import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const router = Router();

const createSessionSchema = z.object({
  title: z.string().optional().default('Interview Session'),
  role: z.string().min(1, 'Role is required'),
  company: z.string().optional(),
  jobDesc: z.string().optional(),
  skills: z.array(z.string()).default([]),
  language: z.enum(['en', 'es']).default('en'),
  aiProvider: z.enum(['groq', 'anthropic', 'openai', 'gemini']).default('groq'),
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const data = createSessionSchema.parse(req.body);
    const session = await prisma.session.create({
      data: {
        title: data.title ?? 'Interview Session',
        role: data.role,
        company: data.company,
        jobDesc: data.jobDesc,
        skills: data.skills,
        language: data.language,
        aiProvider: data.aiProvider,
        status: 'pending',
      },
    });
    res.status(201).json(session);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation error', details: err.errors });
    console.error(err);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) ?? '1'));
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) ?? '20')));
    const skip = (page - 1) * limit;
    const [sessions, total] = await Promise.all([
      prisma.session.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.session.count(),
    ]);
    res.json({ sessions, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: {
        transcripts: { orderBy: { timestamp: 'asc' } },
        responses: { orderBy: { timestamp: 'asc' } },
      },
    });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.session.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

export default router;
