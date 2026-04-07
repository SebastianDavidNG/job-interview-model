/** Language for simulated interviewer prompts (matches wizard codes). */
export type SimLang = 'es' | 'en' | 'pt' | 'fr' | 'de';

export const SIM_LANGS: SimLang[] = ['es', 'en', 'pt', 'fr', 'de'];

/** Pick language for demo question text: interview language wins; `auto` uses response language. */
export function simulatedQuestionLanguage(
  interviewLanguage: string | undefined,
  responseLanguage: string | undefined
): SimLang {
  if (interviewLanguage && interviewLanguage !== 'auto' && SIM_LANGS.includes(interviewLanguage as SimLang)) {
    return interviewLanguage as SimLang;
  }
  if (responseLanguage && SIM_LANGS.includes(responseLanguage as SimLang)) {
    return responseLanguage as SimLang;
  }
  // Wizard defaults to Spanish before localStorage is read; avoid flashing English on first paint.
  return 'es';
}

export const PREGUNTAS_DEMO: Record<SimLang, string[]> = {
  es: [
    'Cuéntame sobre ti y tu experiencia profesional.',
    '¿Por qué te interesa este rol y nuestra empresa?',
    'Describe un proyecto difícil en el que hayas trabajado y cómo lo resolviste.',
    '¿Cuáles son tus fortalezas y áreas de mejora?',
    '¿Dónde te ves en 5 años?',
  ],
  en: [
    'Tell me about yourself and your professional background.',
    'Why are you interested in this role and our company?',
    'Describe a difficult project you worked on and how you solved it.',
    'What are your strengths and areas for improvement?',
    'Where do you see yourself in five years?',
  ],
  pt: [
    'Fale sobre você e sua experiência profissional.',
    'Por que você se interessa por esta vaga e pela nossa empresa?',
    'Descreva um projeto difícil em que trabalhou e como resolveu.',
    'Quais são seus pontos fortes e áreas de melhoria?',
    'Onde você se vê daqui a cinco anos?',
  ],
  fr: [
    'Parlez-moi de vous et de votre parcours professionnel.',
    'Pourquoi ce poste et notre entreprise vous intéressent-ils ?',
    "Décrivez un projet difficile sur lequel vous avez travaillé et comment vous l'avez résolu.",
    'Quels sont vos points forts et vos axes de progression ?',
    'Où vous voyez-vous dans cinq ans ?',
  ],
  de: [
    'Erzählen Sie von sich und Ihrer Berufserfahrung.',
    'Warum interessieren Sie sich für diese Rolle und unser Unternehmen?',
    'Beschreiben Sie ein schwieriges Projekt und wie Sie es gelöst haben.',
    'Was sind Ihre Stärken und Entwicklungsfelder?',
    'Wo sehen Sie sich in fünf Jahren?',
  ],
};

export const PREGUNTAS_LIVE_CODING: Record<SimLang, string[]> = {
  es: [
    'Implementa una función que invierta un string en O(n) tiempo.',
    'Dado un array de enteros, encuentra el par que suma un target. ¿Qué estructura usarías?',
    'Explica cómo evitarías un memory leak en un useEffect de React.',
    'Implementa un debounce: describe la firma y el comportamiento esperado.',
  ],
  en: [
    'Implement a function that reverses a string in O(n) time.',
    'Given an array of integers, find the pair that sums to a target. What data structure would you use?',
    'Explain how you would avoid a memory leak in a React useEffect.',
    'Implement debounce: describe the signature and expected behavior.',
  ],
  pt: [
    'Implemente uma função que inverta uma string em tempo O(n).',
    'Dado um array de inteiros, encontre o par que soma ao target. Qual estrutura você usaria?',
    'Explique como evitar um memory leak em um useEffect do React.',
    'Implemente debounce: descreva a assinatura e o comportamento esperado.',
  ],
  fr: [
    'Implémentez une fonction qui inverse une chaîne en temps O(n).',
    "Étant donné un tableau d'entiers, trouvez la paire dont la somme est égale à la cible. Quelle structure utiliseriez-vous ?",
    'Expliquez comment éviter une fuite mémoire dans un useEffect React.',
    'Implémentez un debounce : décrivez la signature et le comportement attendu.',
  ],
  de: [
    'Implementieren Sie eine Funktion, die einen String in O(n) umkehrt.',
    'Gegeben ein Integer-Array: Finden Sie das Paar mit der Zielsumme. Welche Datenstruktur würden Sie nutzen?',
    'Erklären Sie, wie Sie ein Memory Leak in einem React-useEffect vermeiden.',
    'Implementieren Sie Debounce: Signatur und erwartetes Verhalten beschreiben.',
  ],
};

export const PREGUNTA_EXTRA_DEMO: Record<SimLang, string> = {
  es: '¿Qué te motiva a cambiar de trabajo en este momento?',
  en: 'What motivates you to look for a new role right now?',
  pt: 'O que te motiva a buscar uma nova oportunidade agora?',
  fr: 'Qu’est-ce qui vous motive à chercher un nouveau poste en ce moment ?',
  de: 'Was motiviert Sie gerade, nach einer neuen Stelle zu suchen?',
};

export const ENUNCIADO_EXTRA_LIVE: Record<SimLang, string> = {
  es: 'Implementa un LRU cache con get y put en O(1) amortizado.',
  en: 'Implement an LRU cache with get and put in O(1) amortized time.',
  pt: 'Implemente um cache LRU com get e put em O(1) amortizado.',
  fr: 'Implémentez un cache LRU avec get et put en O(1) amorti.',
  de: 'Implementieren Sie einen LRU-Cache mit get und put in amortisiert O(1).',
};

export const UI_SIMULATE: Record<
  SimLang,
  { sectionTitle: string; extraBehavioral: string; extraCoding: string }
> = {
  es: {
    sectionTitle: 'Simular pregunta (sin audio)',
    extraBehavioral: 'Pregunta libre (demo)',
    extraCoding: 'Enunciado extra (demo)',
  },
  en: {
    sectionTitle: 'Simulate question (no audio)',
    extraBehavioral: 'Extra behavioral (demo)',
    extraCoding: 'Extra prompt (demo)',
  },
  pt: {
    sectionTitle: 'Simular pergunta (sem áudio)',
    extraBehavioral: 'Pergunta extra (demo)',
    extraCoding: 'Enunciado adicional (demo)',
  },
  fr: {
    sectionTitle: 'Simuler une question (sans audio)',
    extraBehavioral: 'Question bonus (démo)',
    extraCoding: 'Énoncé bonus (démo)',
  },
  de: {
    sectionTitle: 'Frage simulieren (ohne Audio)',
    extraBehavioral: 'Zusatzfrage (Demo)',
    extraCoding: 'Zusatzaufgabe (Demo)',
  },
};
