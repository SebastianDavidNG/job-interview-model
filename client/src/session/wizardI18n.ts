import { type SimLang, SIM_LANGS } from './simulatedQuestions';

export type { SimLang };
export { SIM_LANGS };

/** Native names for the first screen only — does not depend on UI locale. */
export const LANG_NATIVE_NAMES: Record<SimLang, string> = {
  es: 'Español',
  en: 'English',
  pt: 'Português',
  fr: 'Français',
  de: 'Deutsch',
};

/** Short multilingual hint before any locale is chosen. */
export const WIZARD_LANGUAGE_GATE = {
  title:
    'Choose your language · Elige tu idioma · Escolha seu idioma · Choisissez la langue · Wählen Sie Ihre Sprache',
  subtitle:
    'Then every step, the sidebar, and form labels will follow that language — switch any time to see the UI update. · Luego cada paso, el menú lateral y las etiquetas usarán ese idioma; cámbialo cuando quieras y verás la interfaz actualizarse.',
  pickerLabel: 'Language · Idioma · Langue · Sprache',
  continueDisabled: 'Continue · Continuar · Continuer · Weiter',
};

/**
 * Saved UI locale from a previous visit, or null if the user has not chosen yet.
 * We intentionally do not guess from the browser here so the first screen stays neutral.
 */
export function loadSavedWizardLocale(): SimLang | null {
  try {
    const s = localStorage.getItem('ip_ui_locale');
    if (s && SIM_LANGS.includes(s as SimLang)) return s as SimLang;
  } catch {
    /* ignore */
  }
  return null;
}

export type WizardCopy = {
  headerSubtitle: string;
  navSteps: { title: string; desc: string }[];
  lang: {
    badge: string;
    title: string;
    intro: string;
    label: string;
    hint: string;
    continue: string;
    langNames: Record<SimLang, string>;
  };
  job: {
    badge: string;
    title: string;
    intro: string;
    jobTitle: string;
    company: string;
    jobDescription: string;
    jobTitlePh: string;
    companyPh: string;
    jobDescPh: string;
    jobDescHint: string;
    requiredSkills: string;
    requiredSkillsPh: string;
    niceSkills: string;
    niceSkillsPh: string;
    interviewType: string;
    salaryRange: string;
    salaryPh: string;
    interviewMixed: string;
    interviewTechnical: string;
    interviewBehavioral: string;
    interviewHr: string;
    interviewLiveCoding: string;
  };
  profile: {
    badge: string;
    title: string;
    intro: string;
    yourName: string;
    currentRole: string;
    yearsExp: string;
    years0: string;
    years12: string;
    years35: string;
    years58: string;
    years812: string;
    years12p: string;
    technologies: string;
    technologiesPh: string;
    resumeFile: string;
    fileSelected: string;
    keyAchievements: string;
    keyAchievementsPh: string;
    resumeSummary: string;
    additionalContext: string;
  };
  ai: {
    badge: string;
    title: string;
    intro: string;
    interviewLanguage: string;
    responseLanguage: string;
    langAuto: string;
    langEs: string;
    langEn: string;
    langPt: string;
    langFr: string;
    langDe: string;
    responseStyle: string;
    styleConcise: string;
    styleConciseDesc: string;
    styleBullets: string;
    styleBulletsDesc: string;
    styleDetailed: string;
    styleDetailedDesc: string;
    audioSource: string;
    extTitle: string;
    extDesc: string;
    extBadges: string[];
    virtTitle: string;
    virtDesc: string;
    virtBadges: string[];
    dmTitle: string;
    dmDesc: string;
    dmBadges: string[];
    audioTest: string;
    testMic: string;
    testing: string;
    notTested: string;
    micOk: string;
    micDenied: string;
    reviewBtn: string;
  };
  review: {
    badge: string;
    title: string;
    intro: string;
    launch: string;
    summaryJobTitle: string;
    summaryCompany: string;
    summaryInterviewType: string;
    summaryYears: string;
    summaryILang: string;
    summaryRLang: string;
    summaryStyle: string;
    summaryAudio: string;
    requiredSkillsSection: string;
    interviewLabels: Record<string, string>;
    styleLabels: Record<string, string>;
    captureLabels: Record<string, string>;
  };
  errors: { stepJob: string; stepProfile: string };
  nav: { back: string; continue: string; stepOf: string; of: string };
  skillAdd: string;
};

const interviewLabels = {
  es: {
    mixed: 'Mixta (técnica + comportamental)',
    technical: 'Técnica',
    behavioral: 'Comportamental / STAR',
    hr: 'RRHH / Cultural fit',
    live_coding: 'Prueba en vivo (live coding)'
  },
  en: {
    mixed: 'Mixed (technical + behavioral)',
    technical: 'Technical',
    behavioral: 'Behavioral / STAR',
    hr: 'HR / Cultural fit',
    live_coding: 'Live coding'
  },
  pt: {
    mixed: 'Mista (técnica + comportamental)',
    technical: 'Técnica',
    behavioral: 'Comportamental / STAR',
    hr: 'RH / Fit cultural',
    live_coding: 'Live coding'
  },
  fr: {
    mixed: 'Mixte (technique + comportemental)',
    technical: 'Technique',
    behavioral: 'Comportemental / STAR',
    hr: 'RH / Adéquation culturelle',
    live_coding: 'Live coding'
  },
  de: {
    mixed: 'Gemischt (technisch + verhaltensbezogen)',
    technical: 'Technisch',
    behavioral: 'Verhalten / STAR',
    hr: 'HR / Kulturfit',
    live_coding: 'Live coding'
  }
} as const;

const styleLabels = {
  es: { concise: 'Concisa', bullet_points: 'Puntos clave', detailed: 'Detallada' },
  en: { concise: 'Concise', bullet_points: 'Bullet points', detailed: 'Detailed' },
  pt: { concise: 'Concisa', bullet_points: 'Tópicos', detailed: 'Detalhada' },
  fr: { concise: 'Concise', bullet_points: 'Liste à puces', detailed: 'Détaillée' },
  de: { concise: 'Kurz', bullet_points: 'Stichpunkte', detailed: 'Ausführlich' }
} as const;

const captureLabels = {
  es: { extension: 'Extensión Chrome', virtual_device: 'Audio virtual', display_media: 'Pantalla + audio' },
  en: { extension: 'Chrome extension', virtual_device: 'Virtual audio', display_media: 'Screen + audio' },
  pt: { extension: 'Extensão Chrome', virtual_device: 'Áudio virtual', display_media: 'Tela + áudio' },
  fr: { extension: 'Extension Chrome', virtual_device: 'Audio virtuel', display_media: 'Écran + audio' },
  de: { extension: 'Chrome-Erweiterung', virtual_device: 'Virtuelles Audio', display_media: 'Bildschirm + Audio' }
} as const;

function R(l: SimLang): WizardCopy['review'] {
  return {
    badge: '',
    title: '',
    intro: '',
    launch: '',
    summaryJobTitle: '',
    summaryCompany: '',
    summaryInterviewType: '',
    summaryYears: '',
    summaryILang: '',
    summaryRLang: '',
    summaryStyle: '',
    summaryAudio: '',
    requiredSkillsSection: '',
    interviewLabels: { ...interviewLabels[l] } as unknown as Record<string, string>,
    styleLabels: { ...styleLabels[l] } as unknown as Record<string, string>,
    captureLabels: { ...captureLabels[l] } as unknown as Record<string, string>
  };
}

export const WIZARD_UI: Record<SimLang, WizardCopy> = {
  es: {
    headerSubtitle: 'CONFIGURACIÓN DE SESIÓN',
    navSteps: [
      { title: 'Idioma', desc: 'Interfaz de la app' },
      { title: 'La vacante', desc: 'Cargo, empresa y descripción' },
      { title: 'Tu perfil', desc: 'Experiencia y logros' },
      { title: 'IA y audio', desc: 'Idioma, estilo y fuente' },
      { title: 'Revisar', desc: 'Confirmar y lanzar' }
    ],
    lang: {
      badge: 'paso 01 / 05',
      title: 'Elige el idioma de la aplicación',
      intro:
        'Los textos de asistente, etiquetas y pasos siguientes se mostrarán en el idioma que elijas. Podrás cambiar el idioma de la entrevista y de las respuestas de la IA en un paso posterior.',
      label: 'Idioma de la interfaz',
      hint: 'Puedes volver a este paso desde el menú lateral en cualquier momento.',
      continue: 'Continuar →',
      langNames: { es: 'Español', en: 'English', pt: 'Português', fr: 'Français', de: 'Deutsch' }
    },
    job: {
      badge: 'paso 02 / 05',
      title: 'La vacante',
      intro:
        'Ingresa los detalles del cargo. Cuanto más específico seas, mejores serán las respuestas sugeridas. Si eliges «Prueba en vivo», la IA priorizará pasos de código y qué decir en voz alta.',
      jobTitle: 'Cargo',
      company: 'Empresa',
      jobDescription: 'Descripción de la vacante',
      jobTitlePh: 'ej: Senior Frontend Developer',
      companyPh: 'ej: Rappi, Bancolombia, Google...',
      jobDescPh: 'Pega aquí la descripción completa del cargo...',
      jobDescHint: 'Cuanto más completa sea, más precisas serán las respuestas de la IA.',
      requiredSkills: 'Habilidades requeridas',
      requiredSkillsPh: 'React, TypeScript, AWS...',
      niceSkills: 'Habilidades deseables',
      niceSkillsPh: 'Docker, GraphQL, Figma...',
      interviewType: 'Tipo de entrevista',
      salaryRange: 'Rango salarial (opcional)',
      salaryPh: 'ej: COP 8M - 12M / mes',
      interviewMixed: interviewLabels.es.mixed,
      interviewTechnical: interviewLabels.es.technical,
      interviewBehavioral: interviewLabels.es.behavioral,
      interviewHr: interviewLabels.es.hr,
      interviewLiveCoding: interviewLabels.es.live_coding
    },
    profile: {
      badge: 'paso 03 / 05',
      title: 'Tu perfil',
      intro: 'La IA usará esta información para personalizar las respuestas con tus experiencias reales.',
      yourName: 'Tu nombre',
      currentRole: 'Rol actual',
      yearsExp: 'Años de experiencia',
      years0: 'Menos de 1 año',
      years12: '1-2 años',
      years35: '3-5 años',
      years58: '5-8 años',
      years812: '8-12 años',
      years12p: '12+ años',
      technologies: 'Tecnologías que dominas',
      technologiesPh: 'React, Node.js, PostgreSQL, AWS...',
      resumeFile: 'CV / Resume (PDF o Word) (opcional)',
      fileSelected: 'Archivo seleccionado:',
      keyAchievements: 'Logros clave',
      keyAchievementsPh: 'Incluye métricas concretas...',
      resumeSummary: 'Resumen de tu CV / perfil profesional',
      additionalContext: 'Contexto adicional (opcional)'
    },
    ai: {
      badge: 'paso 04 / 05',
      title: 'IA y audio',
      intro: 'Configura cómo la herramienta escucha la entrevista y cómo quieres que aparezcan las respuestas.',
      interviewLanguage: 'Idioma de la entrevista',
      responseLanguage: 'Idioma de las respuestas sugeridas',
      langAuto: '🔍 Detectar automáticamente',
      langEs: '🇪🇸 Español',
      langEn: '🇺🇸 English',
      langPt: '🇧🇷 Português',
      langFr: '🇫🇷 Français',
      langDe: '🇩🇪 Deutsch',
      responseStyle: 'Estilo de respuesta',
      styleConcise: 'Concisa',
      styleConciseDesc: '2-3 oraciones. Ideal para leer y hablar al mismo tiempo.',
      styleBullets: 'Puntos clave',
      styleBulletsDesc: '3-4 bullets con verbos de acción.',
      styleDetailed: 'Detallada',
      styleDetailedDesc: 'Respuesta completa con método STAR.',
      audioSource: 'Fuente de audio',
      extTitle: 'Extensión de Chrome (Recomendado)',
      extDesc:
        'Captura el audio del tab de Meet directamente. Sin configuración adicional. Invisible al entrevistador.',
      extBadges: ['✓ Google Meet', '✓ 100% Invisible', '✓ Sin setup'],
      virtTitle: 'Dispositivo de audio virtual',
      virtDesc: 'Requiere BlackHole (Mac) o VB-Cable (Windows). Ideal para Zoom y Teams nativos.',
      virtBadges: ['✓ Zoom', '✓ Teams', '⚠ Instalar BlackHole/VB-Cable'],
      dmTitle: 'Compartir pantalla con audio',
      dmDesc:
        'Sin instalación adicional. El navegador pedirá elegir qué compartir. Activar «Compartir audio del sistema».',
      dmBadges: ['✓ Universal', '⚠ Muestra barra de captura'],
      audioTest: 'Prueba de audio',
      testMic: 'Probar micrófono',
      testing: 'Probando...',
      notTested: 'Sin probar',
      micOk: '✓ Micrófono funcionando',
      micDenied: '✗ Permiso denegado',
      reviewBtn: 'Revisar →'
    },
    review: {
      ...R('es'),
      badge: 'paso 05 / 05',
      title: 'Todo listo',
      intro: 'Revisa la configuración antes de iniciar.',
      launch: '🚀 COMENZAR ENTREVISTA',
      summaryJobTitle: 'Cargo',
      summaryCompany: 'Empresa',
      summaryInterviewType: 'Tipo de entrevista',
      summaryYears: 'Años de experiencia',
      summaryILang: 'Idioma entrevista',
      summaryRLang: 'Idioma respuestas',
      summaryStyle: 'Estilo IA',
      summaryAudio: 'Fuente audio',
      requiredSkillsSection: 'Habilidades requeridas'
    },
    errors: {
      stepJob: 'Completa cargo, empresa, descripción y al menos una habilidad requerida.',
      stepProfile: 'Agrega tus logros clave y un resumen de tu perfil/CV.'
    },
    nav: { back: '← Atrás', continue: 'Continuar →', stepOf: '', of: 'de' },
    skillAdd: '+ Agregar'
  },
  en: {
    headerSubtitle: 'SESSION SETUP',
    navSteps: [
      { title: 'Language', desc: 'App interface' },
      { title: 'The role', desc: 'Title, company, description' },
      { title: 'Your profile', desc: 'Experience & wins' },
      { title: 'AI & audio', desc: 'Language, style, source' },
      { title: 'Review', desc: 'Confirm & start' }
    ],
    lang: {
      badge: 'step 01 / 05',
      title: 'Choose the app language',
      intro:
        'All labels, helper text, and the following steps will appear in your chosen language. You will set interview language and AI answer language in a later step.',
      label: 'Interface language',
      hint: 'You can return to this step from the sidebar anytime.',
      continue: 'Continue →',
      langNames: { es: 'Español', en: 'English', pt: 'Português', fr: 'Français', de: 'Deutsch' }
    },
    job: {
      badge: 'step 02 / 05',
      title: 'The role',
      intro:
        'Add job details. The more specific you are, the better the suggested answers. If you pick Live coding, the AI will focus on code steps and what to say out loud.',
      jobTitle: 'Job title',
      company: 'Company',
      jobDescription: 'Job description',
      jobTitlePh: 'e.g. Senior Frontend Developer',
      companyPh: 'e.g. Acme Inc., Google...',
      jobDescPh: 'Paste the full job description here...',
      jobDescHint: 'The more complete it is, the more accurate the AI answers.',
      requiredSkills: 'Required skills',
      requiredSkillsPh: 'React, TypeScript, AWS...',
      niceSkills: 'Nice-to-have skills',
      niceSkillsPh: 'Docker, GraphQL, Figma...',
      interviewType: 'Interview type',
      salaryRange: 'Salary range (optional)',
      salaryPh: 'e.g. $120k–150k / year',
      interviewMixed: interviewLabels.en.mixed,
      interviewTechnical: interviewLabels.en.technical,
      interviewBehavioral: interviewLabels.en.behavioral,
      interviewHr: interviewLabels.en.hr,
      interviewLiveCoding: interviewLabels.en.live_coding
    },
    profile: {
      badge: 'step 03 / 05',
      title: 'Your profile',
      intro: 'The AI uses this to tailor answers to your real experience.',
      yourName: 'Your name',
      currentRole: 'Current role',
      yearsExp: 'Years of experience',
      years0: 'Less than 1 year',
      years12: '1–2 years',
      years35: '3–5 years',
      years58: '5–8 years',
      years812: '8–12 years',
      years12p: '12+ years',
      technologies: 'Technologies you use',
      technologiesPh: 'React, Node.js, PostgreSQL, AWS...',
      resumeFile: 'Resume (PDF or Word) (optional)',
      fileSelected: 'Selected file:',
      keyAchievements: 'Key achievements',
      keyAchievementsPh: 'Include concrete metrics...',
      resumeSummary: 'Resume / professional summary',
      additionalContext: 'Additional context (optional)'
    },
    ai: {
      badge: 'step 04 / 05',
      title: 'AI & audio',
      intro: 'Choose how the tool listens and how answers should read.',
      interviewLanguage: 'Interview language',
      responseLanguage: 'Suggested answer language',
      langAuto: '🔍 Auto-detect',
      langEs: '🇪🇸 Español',
      langEn: '🇺🇸 English',
      langPt: '🇧🇷 Português',
      langFr: '🇫🇷 Français',
      langDe: '🇩🇪 Deutsch',
      responseStyle: 'Answer style',
      styleConcise: 'Concise',
      styleConciseDesc: '2–3 sentences. Easy to read while speaking.',
      styleBullets: 'Bullet points',
      styleBulletsDesc: '3–4 bullets with action verbs.',
      styleDetailed: 'Detailed',
      styleDetailedDesc: 'Full answer with STAR structure.',
      audioSource: 'Audio source',
      extTitle: 'Chrome extension (recommended)',
      extDesc: 'Captures Meet tab audio directly. No extra setup. Invisible to the interviewer.',
      extBadges: ['✓ Google Meet', '✓ Stealth', '✓ No setup'],
      virtTitle: 'Virtual audio device',
      virtDesc: 'Requires BlackHole (Mac) or VB-Cable (Windows). Great for Zoom and Teams.',
      virtBadges: ['✓ Zoom', '✓ Teams', '⚠ Install driver'],
      dmTitle: 'Screen share with audio',
      dmDesc: 'No install. Browser will ask what to share. Enable system audio when prompted.',
      dmBadges: ['✓ Universal', '⚠ Capture bar visible'],
      audioTest: 'Audio test',
      testMic: 'Test microphone',
      testing: 'Testing...',
      notTested: 'Not tested',
      micOk: '✓ Microphone OK',
      micDenied: '✗ Permission denied',
      reviewBtn: 'Review →'
    },
    review: {
      ...R('en'),
      badge: 'step 05 / 05',
      title: 'All set',
      intro: 'Review your settings before starting.',
      launch: '🚀 START SESSION',
      summaryJobTitle: 'Job title',
      summaryCompany: 'Company',
      summaryInterviewType: 'Interview type',
      summaryYears: 'Years of experience',
      summaryILang: 'Interview language',
      summaryRLang: 'Answer language',
      summaryStyle: 'AI style',
      summaryAudio: 'Audio source',
      requiredSkillsSection: 'Required skills'
    },
    errors: {
      stepJob: 'Fill in job title, company, description, and at least one required skill.',
      stepProfile: 'Add key achievements and a resume / profile summary.'
    },
    nav: { back: '← Back', continue: 'Continue →', stepOf: '', of: 'of' },
    skillAdd: '+ Add'
  },
  pt: {
    headerSubtitle: 'CONFIGURAÇÃO DA SESSÃO',
    navSteps: [
      { title: 'Idioma', desc: 'Interface do app' },
      { title: 'A vaga', desc: 'Cargo, empresa e descrição' },
      { title: 'Seu perfil', desc: 'Experiência e conquistas' },
      { title: 'IA e áudio', desc: 'Idioma, estilo e fonte' },
      { title: 'Revisar', desc: 'Confirmar e iniciar' }
    ],
    lang: {
      badge: 'passo 01 / 05',
      title: 'Escolha o idioma do aplicativo',
      intro:
        'Os textos e os próximos passos aparecerão no idioma escolhido. O idioma da entrevista e das respostas da IA será configurado depois.',
      label: 'Idioma da interface',
      hint: 'Você pode voltar a este passo pelo menu lateral a qualquer momento.',
      continue: 'Continuar →',
      langNames: { es: 'Español', en: 'English', pt: 'Português', fr: 'Français', de: 'Deutsch' }
    },
    job: {
      badge: 'passo 02 / 05',
      title: 'A vaga',
      intro:
        'Informe os detalhes do cargo. Quanto mais específico, melhores as sugestões. Se escolher Live coding, a IA focará em código e o que falar em voz alta.',
      jobTitle: 'Cargo',
      company: 'Empresa',
      jobDescription: 'Descrição da vaga',
      jobTitlePh: 'ex: Senior Frontend Developer',
      companyPh: 'ex: Nubank, iFood...',
      jobDescPh: 'Cole aqui a descrição completa da vaga...',
      jobDescHint: 'Quanto mais completa, mais precisas serão as respostas da IA.',
      requiredSkills: 'Habilidades obrigatórias',
      requiredSkillsPh: 'React, TypeScript, AWS...',
      niceSkills: 'Habilidades desejáveis',
      niceSkillsPh: 'Docker, GraphQL, Figma...',
      interviewType: 'Tipo de entrevista',
      salaryRange: 'Faixa salarial (opcional)',
      salaryPh: 'ex: R$ 10k - 15k / mês',
      interviewMixed: interviewLabels.pt.mixed,
      interviewTechnical: interviewLabels.pt.technical,
      interviewBehavioral: interviewLabels.pt.behavioral,
      interviewHr: interviewLabels.pt.hr,
      interviewLiveCoding: interviewLabels.pt.live_coding
    },
    profile: {
      badge: 'passo 03 / 05',
      title: 'Seu perfil',
      intro: 'A IA usa isso para personalizar respostas com suas experiências reais.',
      yourName: 'Seu nome',
      currentRole: 'Cargo atual',
      yearsExp: 'Anos de experiência',
      years0: 'Menos de 1 ano',
      years12: '1-2 anos',
      years35: '3-5 anos',
      years58: '5-8 anos',
      years812: '8-12 anos',
      years12p: '12+ anos',
      technologies: 'Tecnologias que domina',
      technologiesPh: 'React, Node.js, PostgreSQL, AWS...',
      resumeFile: 'Currículo (PDF ou Word) (opcional)',
      fileSelected: 'Arquivo selecionado:',
      keyAchievements: 'Principais conquistas',
      keyAchievementsPh: 'Inclua métricas concretas...',
      resumeSummary: 'Resumo do CV / perfil profissional',
      additionalContext: 'Contexto adicional (opcional)'
    },
    ai: {
      badge: 'passo 04 / 05',
      title: 'IA e áudio',
      intro: 'Configure como a ferramenta escuta a entrevista e como as respostas aparecem.',
      interviewLanguage: 'Idioma da entrevista',
      responseLanguage: 'Idioma das respostas sugeridas',
      langAuto: '🔍 Detectar automaticamente',
      langEs: '🇪🇸 Español',
      langEn: '🇺🇸 English',
      langPt: '🇧🇷 Português',
      langFr: '🇫🇷 Français',
      langDe: '🇩🇪 Deutsch',
      responseStyle: 'Estilo de resposta',
      styleConcise: 'Concisa',
      styleConciseDesc: '2-3 frases. Ideal para ler e falar ao mesmo tempo.',
      styleBullets: 'Tópicos',
      styleBulletsDesc: '3–4 tópicos com verbos de ação.',
      styleDetailed: 'Detalhada',
      styleDetailedDesc: 'Resposta completa com método STAR.',
      audioSource: 'Fonte de áudio',
      extTitle: 'Extensão Chrome (recomendado)',
      extDesc: 'Captura o áudio da aba do Meet. Sem configuração extra. Invisível ao entrevistador.',
      extBadges: ['✓ Google Meet', '✓ Discreto', '✓ Sem configuração'],
      virtTitle: 'Dispositivo de áudio virtual',
      virtDesc: 'Requer BlackHole (Mac) ou VB-Cable (Windows). Ideal para Zoom e Teams.',
      virtBadges: ['✓ Zoom', '✓ Teams', '⚠ Instalar driver'],
      dmTitle: 'Compartilhar tela com áudio',
      dmDesc: 'Sem instalar nada. O navegador pedirá o que compartilhar. Ative o áudio do sistema.',
      dmBadges: ['✓ Universal', '⚠ Barra de captura visível'],
      audioTest: 'Teste de áudio',
      testMic: 'Testar microfone',
      testing: 'Testando...',
      notTested: 'Não testado',
      micOk: '✓ Microfone OK',
      micDenied: '✗ Permissão negada',
      reviewBtn: 'Revisar →'
    },
    review: {
      ...R('pt'),
      badge: 'passo 05 / 05',
      title: 'Tudo pronto',
      intro: 'Revise antes de iniciar.',
      launch: '🚀 INICIAR SESSÃO',
      summaryJobTitle: 'Cargo',
      summaryCompany: 'Empresa',
      summaryInterviewType: 'Tipo de entrevista',
      summaryYears: 'Anos de experiência',
      summaryILang: 'Idioma da entrevista',
      summaryRLang: 'Idioma das respostas',
      summaryStyle: 'Estilo da IA',
      summaryAudio: 'Fonte de áudio',
      requiredSkillsSection: 'Habilidades obrigatórias'
    },
    errors: {
      stepJob: 'Preencha cargo, empresa, descrição e pelo menos uma habilidade obrigatória.',
      stepProfile: 'Adicione conquistas e um resumo do seu perfil/CV.'
    },
    nav: { back: '← Voltar', continue: 'Continuar →', stepOf: '', of: 'de' },
    skillAdd: '+ Adicionar'
  },
  fr: {
    headerSubtitle: 'CONFIGURATION DE LA SESSION',
    navSteps: [
      { title: 'Langue', desc: "Interface de l'app" },
      { title: "L'offre", desc: 'Poste, entreprise, description' },
      { title: 'Profil', desc: 'Expérience et réussites' },
      { title: 'IA et audio', desc: 'Langue, style, source' },
      { title: 'Vérifier', desc: 'Confirmer et lancer' }
    ],
    lang: {
      badge: 'étape 01 / 05',
      title: "Choisissez la langue de l'application",
      intro:
        "Les libellés et les étapes suivantes s'afficheront dans cette langue. Vous réglerez la langue de l'entretien et celle des réponses de l'IA plus tard.",
      label: "Langue de l'interface",
      hint: 'Vous pouvez revenir à cette étape via le menu latéral.',
      continue: 'Continuer →',
      langNames: { es: 'Español', en: 'English', pt: 'Português', fr: 'Français', de: 'Deutsch' }
    },
    job: {
      badge: 'étape 02 / 05',
      title: "L'offre d'emploi",
      intro:
        "Plus les détails sont précis, meilleures seront les suggestions. Pour le live coding, l'IA se concentre sur le code et l'oral.",
      jobTitle: 'Intitulé du poste',
      company: 'Entreprise',
      jobDescription: "Description du poste",
      jobTitlePh: 'ex : Développeur Front Senior',
      companyPh: 'ex : Google, startup...',
      jobDescPh: "Collez ici la description complète...",
      jobDescHint: "Plus c'est complet, plus les réponses seront précises.",
      requiredSkills: 'Compétences requises',
      requiredSkillsPh: 'React, TypeScript, AWS...',
      niceSkills: 'Compétences souhaitées',
      niceSkillsPh: 'Docker, GraphQL, Figma...',
      interviewType: "Type d'entretien",
      salaryRange: 'Fourchette salariale (optionnel)',
      salaryPh: 'ex : 50k–65k € / an',
      interviewMixed: interviewLabels.fr.mixed,
      interviewTechnical: interviewLabels.fr.technical,
      interviewBehavioral: interviewLabels.fr.behavioral,
      interviewHr: interviewLabels.fr.hr,
      interviewLiveCoding: interviewLabels.fr.live_coding
    },
    profile: {
      badge: 'étape 03 / 05',
      title: 'Votre profil',
      intro: "L'IA s'en sert pour personnaliser les réponses.",
      yourName: 'Votre nom',
      currentRole: 'Poste actuel',
      yearsExp: "Années d'expérience",
      years0: 'Moins de 1 an',
      years12: '1–2 ans',
      years35: '3–5 ans',
      years58: '5–8 ans',
      years812: '8–12 ans',
      years12p: '12+ ans',
      technologies: 'Technologies maîtrisées',
      technologiesPh: 'React, Node.js, PostgreSQL, AWS...',
      resumeFile: 'CV (PDF ou Word) (optionnel)',
      fileSelected: 'Fichier sélectionné :',
      keyAchievements: 'Réalisations clés',
      keyAchievementsPh: 'Incluez des métriques...',
      resumeSummary: 'Résumé du CV / profil',
      additionalContext: 'Contexte supplémentaire (optionnel)'
    },
    ai: {
      badge: 'étape 04 / 05',
      title: 'IA et audio',
      intro: "Configurez l'écoute et le style des réponses suggérées.",
      interviewLanguage: "Langue de l'entretien",
      responseLanguage: 'Langue des réponses suggérées',
      langAuto: '🔍 Détection auto',
      langEs: '🇪🇸 Español',
      langEn: '🇺🇸 English',
      langPt: '🇧🇷 Português',
      langFr: '🇫🇷 Français',
      langDe: '🇩🇪 Deutsch',
      responseStyle: 'Style de réponse',
      styleConcise: 'Concis',
      styleConciseDesc: '2–3 phrases. Facile à lire en parlant.',
      styleBullets: 'Liste à puces',
      styleBulletsDesc: "3–4 puces avec verbes d'action.",
      styleDetailed: 'Détaillé',
      styleDetailedDesc: 'Réponse complète (STAR).',
      audioSource: "Source audio",
      extTitle: 'Extension Chrome (recommandé)',
      extDesc:
        "Capture l'audio de l'onglet Meet sans installation supplémentaire. Reste discret pour votre interlocuteur.",
      extBadges: ['✓ Google Meet', '✓ Discret', '✓ Sans installation'],
      virtTitle: 'Périphérique audio virtuel',
      virtDesc: 'BlackHole (Mac) ou VB-Cable (Windows). Idéal Zoom / Teams.',
      virtBadges: ['✓ Zoom', '✓ Teams', '⚠ Installation'],
      dmTitle: "Partage d'écran avec audio",
      dmDesc: "Le navigateur demande quoi partager. Activez l'audio système.",
      dmBadges: ['✓ Universel', '⚠ Barre visible'],
      audioTest: "Test audio",
      testMic: 'Tester le micro',
      testing: 'Test en cours...',
      notTested: 'Non testé',
      micOk: '✓ Micro OK',
      micDenied: '✗ Permission refusée',
      reviewBtn: 'Vérifier →'
    },
    review: {
      ...R('fr'),
      badge: 'étape 05 / 05',
      title: 'Tout est prêt',
      intro: 'Vérifiez la configuration avant de lancer.',
      launch: '🚀 DÉMARRER LA SESSION',
      summaryJobTitle: 'Poste',
      summaryCompany: 'Entreprise',
      summaryInterviewType: "Type d'entretien",
      summaryYears: "Années d'expérience",
      summaryILang: "Langue d'entretien",
      summaryRLang: 'Langue des réponses',
      summaryStyle: 'Style IA',
      summaryAudio: 'Source audio',
      requiredSkillsSection: 'Compétences requises'
    },
    errors: {
      stepJob: 'Remplissez le poste, entreprise, description et au moins une compétence requise.',
      stepProfile: 'Ajoutez des réalisations clés et un résumé de profil.'
    },
    nav: { back: '← Retour', continue: 'Continuer →', stepOf: '', of: 'sur' },
    skillAdd: '+ Ajouter'
  },
  de: {
    headerSubtitle: 'SESSION-EINRICHTUNG',
    navSteps: [
      { title: 'Sprache', desc: 'App-Oberfläche' },
      { title: 'Die Stelle', desc: 'Titel, Firma, Beschreibung' },
      { title: 'Profil', desc: 'Erfahrung & Erfolge' },
      { title: 'KI & Audio', desc: 'Sprache, Stil, Quelle' },
      { title: 'Prüfen', desc: 'Starten' }
    ],
    lang: {
      badge: 'Schritt 01 / 05',
      title: 'App-Sprache wählen',
      intro:
        'Alle Beschriftungen und die folgenden Schritte erscheinen in dieser Sprache. Interview- und Antwortsprache stellen Sie später ein.',
      label: 'Oberflächensprache',
      hint: 'Sie können über die Seitenleiste jederzeit hierher zurückkehren.',
      continue: 'Weiter →',
      langNames: { es: 'Español', en: 'English', pt: 'Português', fr: 'Français', de: 'Deutsch' }
    },
    job: {
      badge: 'Schritt 02 / 05',
      title: 'Die Stelle',
      intro:
        'Je genauer die Angaben, desto besser die Vorschläge. Bei Live Coding liegt der Fokus auf Code und mündlicher Erklärung.',
      jobTitle: 'Jobtitel',
      company: 'Unternehmen',
      jobDescription: 'Stellenbeschreibung',
      jobTitlePh: 'z. B. Senior Frontend Developer',
      companyPh: 'z. B. Muster GmbH, Google...',
      jobDescPh: 'Vollständige Stellenbeschreibung einfügen...',
      jobDescHint: 'Je vollständiger, desto präziser die KI-Antworten.',
      requiredSkills: 'Erforderliche Kompetenzen',
      requiredSkillsPh: 'React, TypeScript, AWS...',
      niceSkills: 'Wünschenswerte Kompetenzen',
      niceSkillsPh: 'Docker, GraphQL, Figma...',
      interviewType: 'Interview-Typ',
      salaryRange: 'Gehaltsspanne (optional)',
      salaryPh: 'z. B. 60k–80k € / Jahr',
      interviewMixed: interviewLabels.de.mixed,
      interviewTechnical: interviewLabels.de.technical,
      interviewBehavioral: interviewLabels.de.behavioral,
      interviewHr: interviewLabels.de.hr,
      interviewLiveCoding: interviewLabels.de.live_coding
    },
    profile: {
      badge: 'Schritt 03 / 05',
      title: 'Ihr Profil',
      intro: 'Die KI nutzt das, um Antworten auf Ihre Erfahrung abzustimmen.',
      yourName: 'Ihr Name',
      currentRole: 'Aktuelle Rolle',
      yearsExp: 'Jahre Berufserfahrung',
      years0: 'Weniger als 1 Jahr',
      years12: '1–2 Jahre',
      years35: '3–5 Jahre',
      years58: '5–8 Jahre',
      years812: '8–12 Jahre',
      years12p: '12+ Jahre',
      technologies: 'Technologien',
      technologiesPh: 'React, Node.js, PostgreSQL, AWS...',
      resumeFile: 'Lebenslauf (PDF oder Word) (optional)',
      fileSelected: 'Datei:',
      keyAchievements: 'Wichtige Erfolge',
      keyAchievementsPh: 'Konkrete Kennzahlen nennen...',
      resumeSummary: 'Zusammenfassung / Profil',
      additionalContext: 'Zusätzlicher Kontext (optional)'
    },
    ai: {
      badge: 'Schritt 04 / 05',
      title: 'KI & Audio',
      intro: 'Legen Sie fest, wie das Tool mithört und wie die Antwortvorschläge dargestellt werden sollen.',
      interviewLanguage: 'Interview-Sprache',
      responseLanguage: 'Sprache der Vorschläge',
      langAuto: '🔍 Automatisch',
      langEs: '🇪🇸 Español',
      langEn: '🇺🇸 English',
      langPt: '🇧🇷 Português',
      langFr: '🇫🇷 Français',
      langDe: '🇩🇪 Deutsch',
      responseStyle: 'Antwort-Stil',
      styleConcise: 'Kurz',
      styleConciseDesc: '2–3 Sätze. Gut zum Mitsprechen.',
      styleBullets: 'Stichpunkte',
      styleBulletsDesc: '3–4 Punkte mit Aktionsverben.',
      styleDetailed: 'Ausführlich',
      styleDetailedDesc: 'Vollständige Antwort (STAR).',
      audioSource: 'Audio-Quelle',
      extTitle: 'Chrome-Erweiterung (empfohlen)',
      extDesc: 'Erfasst Meet-Tab-Audio. Diskret für den Interviewer.',
      extBadges: ['✓ Google Meet', '✓ Unauffällig', '✓ Ohne Setup'],
      virtTitle: 'Virtuelles Audiogerät',
      virtDesc: 'BlackHole (Mac) oder VB-Cable (Windows). Gut für Zoom/Teams.',
      virtBadges: ['✓ Zoom', '✓ Teams', '⚠ Treiber nötig'],
      dmTitle: 'Bildschirm mit Audio teilen',
      dmDesc: 'Browser fragt nach Freigabe. Systemaudio aktivieren.',
      dmBadges: ['✓ Universal', '⚠ Leiste sichtbar'],
      audioTest: 'Audio-Test',
      testMic: 'Mikrofon testen',
      testing: 'Teste...',
      notTested: 'Nicht getestet',
      micOk: '✓ Mikrofon OK',
      micDenied: '✗ Zugriff verweigert',
      reviewBtn: 'Prüfen →'
    },
    review: {
      ...R('de'),
      badge: 'Schritt 05 / 05',
      title: 'Fertig',
      intro: 'Bitte prüfen Sie die Einstellungen.',
      launch: '🚀 SESSION STARTEN',
      summaryJobTitle: 'Jobtitel',
      summaryCompany: 'Firma',
      summaryInterviewType: 'Interview-Typ',
      summaryYears: 'Berufserfahrung (Jahre)',
      summaryILang: 'Interview-Sprache',
      summaryRLang: 'Antwort-Sprache',
      summaryStyle: 'KI-Stil',
      summaryAudio: 'Audio-Quelle',
      requiredSkillsSection: 'Erforderliche Kompetenzen'
    },
    errors: {
      stepJob: 'Bitte Jobtitel, Firma, Beschreibung und mindestens eine geforderte Kompetenz angeben.',
      stepProfile: 'Bitte Erfolge und eine Profilzusammenfassung angeben.'
    },
    nav: { back: '← Zurück', continue: 'Weiter →', stepOf: '', of: 'von' },
    skillAdd: '+ Hinzufügen'
  }
};
