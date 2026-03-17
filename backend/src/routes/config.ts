import { Router, Request, Response } from 'express';

const router = Router();

router.get('/ai-providers', (_req: Request, res: Response) => {
  res.json({
    providers: [
      { id: 'groq', name: 'Groq (Llama 3)', description: 'Fastest inference, great for real-time responses', available: !!process.env.GROQ_API_KEY },
      { id: 'anthropic', name: 'Anthropic Claude', description: 'High quality, nuanced responses', available: !!process.env.ANTHROPIC_API_KEY },
      { id: 'openai', name: 'OpenAI GPT-4o', description: 'Versatile and reliable', available: !!process.env.OPENAI_API_KEY },
      { id: 'gemini', name: 'Google Gemini', description: "Google's latest model", available: !!process.env.GEMINI_API_KEY },
    ],
  });
});

export default router;
