import Groq from 'groq-sdk';

export type SessionConfig = {
  jobTitle?: string;
  company?: string;
  jobDescription?: string;
  requiredSkills?: string[];
  niceToHaveSkills?: string[];
  /** behavioral | technical | mixed | hr | live_coding */
  interviewType?: string;
  salaryRange?: string;
  candidateName?: string;
  currentRole?: string;
  yearsOfExperience?: string;
  technologiesUsed?: string;
  keyAchievements?: string;
  resumeSummary?: string;
  resumeFileName?: string;
  additionalContext?: string;
  interviewLanguage?: string;
  responseLanguage?: string;
  /** Wizard UI locale — fallback for answer language when responseLanguage is missing */
  uiLocale?: string;
  responseStyle?: string;
  captureMode?: string;
};

const MODEL = 'llama-3.1-8b-instant';

const LANG_CODES = ['es', 'en', 'pt', 'fr', 'de'] as const;
type LangCode = (typeof LANG_CODES)[number];

function isLangCode(s: string | undefined): s is LangCode {
  return !!s && (LANG_CODES as readonly string[]).includes(s);
}

/** Language used for AI answers: explicit response language, else UI locale, else Spanish. */
export function resolveOutputLang(config: SessionConfig | null): LangCode {
  if (!config) return 'es';
  if (isLangCode(config.responseLanguage)) return config.responseLanguage;
  if (isLangCode(config.uiLocale)) return config.uiLocale;
  return 'es';
}

/** Native name of the output language for prompts (in that language where natural). */
const OUTPUT_LANG_NAME: Record<LangCode, string> = {
  es: 'español',
  en: 'English',
  pt: 'português',
  fr: 'français',
  de: 'Deutsch',
};

/** Live-coding section markers 【】 per language (must match client empty-state hints). */
const LIVE_MARKERS: Record<LangCode, { u: string; s: string; p: string; c: string; t: string }> = {
  es: { u: 'ENTENDER', s: 'DECIR', p: 'PASOS', c: 'CÓDIGO', t: 'TRAMPA' },
  en: { u: 'UNDERSTAND', s: 'SAY', p: 'STEPS', c: 'CODE', t: 'TRAP' },
  pt: { u: 'ENTENDER', s: 'DIZER', p: 'PASSOS', c: 'CÓDIGO', t: 'ARMADILHA' },
  fr: { u: 'COMPRENDRE', s: 'DIRE', p: 'ÉTAPES', c: 'CODE', t: 'PIÈGE' },
  de: { u: 'VERSTEHEN', s: 'SAGEN', p: 'SCHRITTE', c: 'CODE', t: 'FALLE' },
};

function candidateAndJobBlock(config: SessionConfig): string {
  return `
PERFIL DEL CANDIDATO:
- Nombre: ${config.candidateName ?? '—'}
- Rol actual: ${config.currentRole ?? '—'}
- Años de experiencia: ${config.yearsOfExperience ?? '—'}
- Tecnologías: ${config.technologiesUsed ?? '—'}
- Logros clave: ${(config.keyAchievements ?? '').slice(0, 500)}
- Resumen CV: ${(config.resumeSummary ?? '').slice(0, 800)}

CONTEXTO DE LA VACANTE:
- Cargo: ${config.jobTitle ?? '—'} en ${config.company ?? '—'}
- Descripción: ${(config.jobDescription ?? '').slice(0, 600)}
- Skills requeridas: ${(config.requiredSkills ?? []).join(', ') || '—'}
- Tipo de entrevista: ${config.interviewType ?? 'mixta'}
${config.additionalContext ? `- Contexto extra: ${config.additionalContext.slice(0, 300)}` : ''}`;
}

function buildLiveCodingSystemPrompt(config: SessionConfig | null, lang: LangCode): string {
  const m = LIVE_MARKERS[lang];
  const L = OUTPUT_LANG_NAME[lang];
  const tags = `【${m.u}】【${m.s}】【${m.p}】【${m.c}】【${m.t}】`;

  const bodies: Record<LangCode, string> = {
    es: `Eres el copiloto de LIVE CODING en una entrevista técnica. El candidato comparte pantalla y debe implementar o explicar código EN TIEMPO REAL.
Escribe TODO el contenido (incluidas las líneas bajo cada marca) en ${L}.
Objetivo: en 10–20 segundos de lectura el candidato sabe QUÉ DECIR en voz alta y QUÉ HACER después.

FORMATO OBLIGATORIO (líneas cortas; usa exactamente estas marcas en su propia línea):
【${m.u}】1–2 líneas: qué piden / restricciones.
【${m.s}】2–4 líneas: frases que el candidato puede decir en voz alta (pensar en voz alta), primera persona.
【${m.p}】Lista numerada (3–6 pasos): alto nivel, orden de implementación.
【${m.c}】Un bloque breve: firma, estructura de datos o pseudocódigo claro.
【${m.t}】1 línea: caso límite o error típico que conviene mencionar o manejar.

Reglas:
- Prioriza claridad sobre perfección; si falta información, en 【${m.s}】 incluye 1 pregunta breve al entrevistador.
- Alinea el código con el stack del perfil cuando sea posible.
- No uses frases meta como "Deberías hacer"; el guión en 【${m.s}】 es lo que el candidato pronuncia.`,
    en: `You are a LIVE CODING copilot in a technical interview. The candidate shares their screen and must implement or explain code IN REAL TIME.
Write EVERYTHING (including text under each tag) in ${L}.
Goal: within 10–20 seconds of reading, the candidate knows what to SAY aloud and what to DO next.

MANDATORY FORMAT (short lines; use these tags each on its own line):
【${m.u}】1–2 lines: what they want / constraints.
【${m.s}】2–4 lines: phrases the candidate can say aloud (think aloud), first person.
【${m.p}】Numbered list (3–6 steps): high-level implementation order.
【${m.c}】One short block: signature, data structure, or clear pseudocode.
【${m.t}】1 line: edge case or typical bug worth mentioning.

Rules:
- Clarity over perfection; if information is missing, add one short question to the interviewer in 【${m.s}】.
- Align code with the candidate's stack when possible.
- No meta phrases like "You should"; 【${m.s}】 is what the candidate actually says.`,
    pt: `Você é o copiloto de LIVE CODING em uma entrevista técnica. O candidato compartilha a tela e deve implementar ou explicar código EM TEMPO REAL.
Escreva TODO o conteúdo (incluindo o texto sob cada marca) em ${L}.
Objetivo: em 10–20 segundos de leitura o candidato sabe O QUE FALAR em voz alta e O QUE FAZER em seguida.

FORMATO OBRIGATÓRIO (linhas curtas; use exatamente estas marcas em linha própria):
【${m.u}】1–2 linhas: o que pedem / restrições.
【${m.s}】2–4 linhas: frases que o candidato pode falar em voz alta (pensar em voz alta), primeira pessoa.
【${m.p}】Lista numerada (3–6 passos): alto nível, ordem de implementação.
【${m.c}】Um bloco breve: assinatura, estrutura de dados ou pseudocódigo claro.
【${m.t}】1 linha: caso limite ou erro típico a mencionar ou tratar.

Regras:
- Priorize clareza; se faltar informação, em 【${m.s}】 inclua 1 pergunta breve ao entrevistador.
- Alinhe o código ao stack do perfil quando possível.
- Sem frases meta como "Você deveria"; o roteiro em 【${m.s}】 é o que o candidato fala.`,
    fr: `Tu es le copilote LIVE CODING lors d'un entretien technique. Le candidat partage son écran et doit implémenter ou expliquer du code EN TEMPS RÉEL.
Écris TOUT (y compris le texte sous chaque balise) en ${L}.
Objectif : en 10–20 secondes de lecture, le candidat sait quoi DIRE à voix haute et quoi FAIRE ensuite.

FORMAT OBLIGATOIRE (lignes courtes ; chaque balise sur sa propre ligne) :
【${m.u}】1–2 lignes : ce qu'on demande / contraintes.
【${m.s}】2–4 lignes : phrases que le candidat peut dire à voix haute (penser à voix haute), à la première personne.
【${m.p}】Liste numérotée (3–6 étapes) : ordre d'implémentation, niveau élevé.
【${m.c}】Un bloc court : signature, structure de données ou pseudo-code clair.
【${m.t}】1 ligne : cas limite ou erreur typique à mentionner.

Règles :
- Privilégie la clarté ; s'il manque une info, ajoute dans 【${m.s}】 une courte question à l'intervieweur.
- Aligner le code sur le stack du profil si possible.
- Pas de méta-phrases du type « Tu devrais » ; 【${m.s}】 est ce que le candidat prononce.`,
    de: `Du bist der LIVE-CODING-Copilot in einem technischen Interview. Der Kandidat teilt den Bildschirm und muss Code IN ECHTZEIT implementieren oder erklären.
Schreibe ALLES (auch den Text unter jeder Marke) auf ${L}.
Ziel: Nach 10–20 Sekunden Lesen weiß der Kandidat, was er LAUT SAGEN und als NÄCHSTES TUN soll.

PFLICHTFORMAT (kurze Zeilen; jede Marke in eigener Zeile):
【${m.u}】1–2 Zeilen: was verlangt wird / Einschränkungen.
【${m.s}】2–4 Zeilen: Sätze, die der Kandidat laut sagen kann (laut denken), erste Person.
【${m.p}】Nummerierte Liste (3–6 Schritte): grob, Implementierungsreihenfolge.
【${m.c}】Ein kurzer Block: Signatur, Datenstruktur oder klarer Pseudocode.
【${m.t}】1 Zeile: Grenzfall oder typischer Fehler, den man erwähnen sollte.

Regeln:
- Klarheit vor Perfektion; bei fehlenden Infos in 【${m.s}】 eine kurze Frage an den Interviewer.
- Code an den Stack des Profils anpassen, wenn möglich.
- Keine Meta-Sätze wie „Du solltest“; 【${m.s}】 ist, was der Kandidat wirklich sagt.`,
  };

  let base = bodies[lang];
  if (config) {
    base += candidateAndJobBlock(config);
  }
  return base;
}

const STYLE_NOTE: Record<LangCode, Record<string, string>> = {
  es: {
    concise: '2-4 oraciones máximo. Sin encabezados.',
    bullet_points: '3-5 puntos clave, cada uno empezando con un verbo de acción.',
    detailed: 'Respuesta estructurada; usa método STAR cuando aplique.',
  },
  en: {
    concise: '2–4 sentences max. No headings.',
    bullet_points: '3–5 key points, each starting with an action verb.',
    detailed: 'Structured answer; use STAR when it fits.',
  },
  pt: {
    concise: 'No máximo 2–4 frases. Sem títulos.',
    bullet_points: '3–5 pontos-chave, cada um começando com um verbo de ação.',
    detailed: 'Resposta estruturada; use STAR quando couber.',
  },
  fr: {
    concise: '2–4 phrases maximum. Pas de titres.',
    bullet_points: "3–5 points clés, chacun commençant par un verbe d'action.",
    detailed: 'Réponse structurée ; utilisez STAR si pertinent.',
  },
  de: {
    concise: 'Höchstens 2–4 Sätze. Keine Überschriften.',
    bullet_points: '3–5 Kernpunkte, jeder mit einem Aktionsverb beginnend.',
    detailed: 'Strukturierte Antwort; STAR-Methode wenn passend.',
  },
};

function buildBehavioralSystemPrompt(config: SessionConfig | null, lang: LangCode): string {
  const style = config?.responseStyle ?? 'concise';
  const styleNote =
    STYLE_NOTE[lang][style] ?? STYLE_NOTE[lang].concise;
  const L = OUTPUT_LANG_NAME[lang];

  const intros: Record<LangCode, string> = {
    es: `Eres un coach de entrevistas que da guías de respuesta EN TIEMPO REAL a un candidato durante una entrevista en vivo.
Responde SIEMPRE en ${L}.
Formato: ${styleNote}
NUNCA empieces con "Yo diría..." o "Deberías decir...". Escribe como si el candidato ESTUVIERA diciendo la respuesta (primera persona, natural).
Objetivo: latencia mínima; el candidato debe poder leer mientras mantiene contacto visual.`,
    en: `You are an interview coach giving REAL-TIME answer guidance to a candidate in a live interview.
You MUST write your entire reply in ${L}.
Format: ${styleNote}
Never start with "I would say..." or "You should say...". Write as if the candidate IS speaking (first person, natural).
Goal: minimal latency; the candidate should be able to read while maintaining eye contact.`,
    pt: `Você é um coach de entrevistas que oferece orientação de resposta EM TEMPO REAL a um candidato durante uma entrevista ao vivo.
Escreva TODA a resposta em ${L}.
Formato: ${styleNote}
Nunca comece com "Eu diria..." ou "Você deveria dizer...". Escreva como se o candidato ESTIVESSE falando (primeira pessoa, natural).
Objetivo: latência mínima; o candidato deve conseguir ler mantendo contato visual.`,
    fr: `Tu es un coach d'entretien qui fournit des guides de réponse EN TEMPS RÉEL à un candidat pendant un entretien en direct.
Tu DOIS rédiger toute ta réponse en ${L}.
Format : ${styleNote}
Ne commence jamais par « Je dirais... » ou « Tu devrais dire... ». Écris comme si le candidat PARLAIT (première personne, naturel).
Objectif : latence minimale ; le candidat doit pouvoir lire tout en gardant le contact visuel.`,
    de: `Du bist ein Interview-Coach und gibst Echtzeit-Antwort-Hilfen an einen Kandidaten im Live-Interview.
Du MUSST die gesamte Antwort auf ${L} schreiben.
Format: ${styleNote}
Beginne nie mit „Ich würde sagen...“ oder „Du solltest sagen...“. Schreibe so, als WÜRDE der Kandidat sprechen (Ich-Form, natürlich).
Ziel: geringe Latenz; der Kandidat soll lesen können und dabei Blickkontakt halten.`,
  };

  let base = intros[lang];
  if (config) {
    base += candidateAndJobBlock(config);
  }
  return base;
}

function buildSystemPrompt(config: SessionConfig | null): string {
  const lang = resolveOutputLang(config);
  if (config?.interviewType === 'live_coding') {
    return buildLiveCodingSystemPrompt(config, lang);
  }
  return buildBehavioralSystemPrompt(config, lang);
}

function buildUserMessage(question: string, config: SessionConfig | null): string {
  const lang = resolveOutputLang(config);
  const isLiveCoding = config?.interviewType === 'live_coding';
  const m = LIVE_MARKERS[lang];
  const tags = `【${m.u}】【${m.s}】【${m.p}】【${m.c}】【${m.t}】`;

  if (isLiveCoding) {
    const lines: Record<LangCode, string> = {
      es: `Lo que dijo o pidió el entrevistador (o el enunciado actual):\n${question}\n\nGenera la guía de live coding AHORA siguiendo el formato con marcas ${tags}.`,
      en: `What the interviewer said or asked (or the current prompt):\n${question}\n\nGenerate the live coding guidance NOW using the format with tags ${tags}.`,
      pt: `O que o entrevistador disse ou pediu (ou o enunciado atual):\n${question}\n\nGere a orientação de live coding AGORA seguindo o formato com as marcas ${tags}.`,
      fr: `Ce que l'intervieweur a dit ou demandé (ou l'énoncé actuel) :\n${question}\n\nGénère le guide live coding MAINTENANT en suivant le format avec les balises ${tags}.`,
      de: `Was der Interviewer gesagt oder gefragt hat (oder die aktuelle Aufgabe):\n${question}\n\nErzeuge JETZT die Live-Coding-Anleitung im Format mit den Marken ${tags}.`,
    };
    return lines[lang];
  }

  const lines: Record<LangCode, string> = {
    es: `Pregunta del entrevistador: ${question}\n\nGenera la respuesta ideal para el candidato AHORA (breve y escaneable).`,
    en: `Interviewer's question: ${question}\n\nGenerate the ideal answer for the candidate NOW (brief and scannable).`,
    pt: `Pergunta do entrevistador: ${question}\n\nGere a resposta ideal para o candidato AGORA (breve e fácil de ler).`,
    fr: `Question de l'intervieweur : ${question}\n\nGénère la réponse idéale pour le candidat MAINTENANT (brève et lisible rapidement).`,
    de: `Frage des Interviewers: ${question}\n\nErzeuge JETZT die ideale Antwort für den Kandidaten (kurz und gut scannbar).`,
  };
  return lines[lang];
}

export async function streamGroqResponse(
  question: string,
  config: SessionConfig | null,
  onToken: (token: string) => void
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set');
  }

  const groq = new Groq({ apiKey });
  const systemPrompt = buildSystemPrompt(config);
  const userLine = buildUserMessage(question, config);

  const isLiveCoding = config?.interviewType === 'live_coding';
  const stream = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userLine },
    ],
    stream: true,
    max_tokens: isLiveCoding ? 550 : 350,
    temperature: 0.25,
  });

  let fullText = '';
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      fullText += delta;
      onToken(delta);
    }
  }
  return fullText;
}
