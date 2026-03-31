"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamGroqResponse = streamGroqResponse;
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const MODEL = 'llama-3.1-8b-instant'; // Baja latencia, ideal para tiempo real
function candidateAndJobBlock(config) {
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
/** Modo prueba en vivo: guía qué decir, pasos y snippet — ojos/manos del candidato. */
function buildLiveCodingSystemPrompt(config) {
    const lang = config?.responseLanguage ?? 'es';
    const langName = lang === 'es' ? 'español' : lang === 'en' ? 'inglés' : lang === 'pt' ? 'portugués' : lang;
    let base = `Eres el copiloto de LIVE CODING en una entrevista técnica. El candidato comparte pantalla y debe implementar o explicar código EN TIEMPO REAL.
Responde SIEMPRE en ${langName}.
Objetivo: en 10–20 segundos de lectura el candidato sabe QUÉ DECIR en voz alta y QUÉ HACER después.

FORMATO OBLIGATORIO (líneas cortas; usa exactamente estas marcas en línea propia):
【ENTENDER】1–2 líneas: qué piden / restricciones.
【DECIR】2–4 líneas: frases que el candidato puede decir en voz alta (pensar en voz alta), primera persona.
【PASOS】Lista numerada (3–6 pasos): alto nivel, orden de implementación.
【CÓDIGO】Un bloque breve: firma, estructura de datos o pseudocódigo claro. Si el lenguaje no está claro, pseudocódigo neutro.
【TRAMPA】1 línea: edge case o error típico que conviene mencionar o manejar.

Reglas:
- Prioriza claridad sobre perfección; si falta información, en 【DECIR】 incluye 1 pregunta breve al entrevistador.
- Alinea el código con el stack del perfil cuando sea posible.
- No uses frases meta como "Deberías hacer"; el guión en 【DECIR】 es lo que el candidato pronuncia.`;
    if (config) {
        base += candidateAndJobBlock(config);
    }
    return base;
}
function buildSystemPrompt(config) {
    if (config?.interviewType === 'live_coding') {
        return buildLiveCodingSystemPrompt(config);
    }
    const lang = config?.responseLanguage ?? 'es';
    const style = config?.responseStyle ?? 'concise';
    const styleNote = style === 'concise'
        ? '2-4 oraciones máximo. Sin encabezados.'
        : style === 'bullet_points'
            ? '3-5 puntos clave, cada uno empezando con un verbo de acción.'
            : 'Respuesta estructurada; usa método STAR cuando aplique.';
    let base = `Eres un coach de entrevistas que da guías de respuesta EN TIEMPO REAL a un candidato durante una entrevista en vivo.
Responde SIEMPRE en ${lang === 'es' ? 'español' : lang === 'en' ? 'inglés' : lang}.
Formato: ${styleNote}
NUNCA empieces con "Yo diría..." o "Deberías decir...". Escribe como si el candidato ESTUVIERA diciendo la respuesta (primera persona, natural).
Objetivo: latencia mínima; el candidato debe poder leer mientras mantiene contacto visual.`;
    if (config) {
        base += candidateAndJobBlock(config);
    }
    return base;
}
async function streamGroqResponse(question, config, onToken) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error('GROQ_API_KEY is not set');
    }
    const groq = new groq_sdk_1.default({ apiKey });
    const systemPrompt = buildSystemPrompt(config);
    const isLiveCoding = config?.interviewType === 'live_coding';
    const userLine = isLiveCoding
        ? `Lo que dijo o pidió el entrevistador (o el enunciado actual):\n${question}\n\nGenera la guía de live coding AHORA siguiendo el formato con marcas 【】.`
        : `Pregunta del entrevistador: ${question}\n\nGenera la respuesta ideal para el candidato AHORA (breve y escaneable).`;
    const stream = await groq.chat.completions.create({
        model: MODEL,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userLine }
        ],
        stream: true,
        max_tokens: isLiveCoding ? 550 : 350,
        temperature: 0.25
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
