import { type SimLang, SIM_LANGS, simulatedQuestionLanguage } from './simulatedQuestions';
import { readSessionConfigStorage } from './storageKeys';

export type { SimLang };

/** UI copy for the main live session screen (`LiveSessionPanel`). */
export type LiveSessionUi = {
  liveBadge: string;
  statusPrefix: string;
  statusListening: string;
  statusConnected: string;
  statusDisconnected: string;
  generatingGuide: string;
  howToTitleInterview: string;
  howToTitleLiveCoding: string;
  howToStep1: string;
  howToStep2: string;
  howToStep3: string;
  micSectionTitle: string;
  speechNotSupported: string;
  micOn: string;
  micOff: string;
  askGuideNow: string;
  autoAfterPause: string;
  emptyTranscriptError: string;
  transcriptListening: string;
  transcriptIdle: string;
  lastPromptTitle: string;
  lastPromptEmpty: string;
  guideTitle: string;
  guideTitleCoding: string;
  emptyGuideCoding: string;
  emptyGuideGeneral: string;
  aiErrorFallback: string;
};

/** UI copy for `/viewer` (`StealthViewer`). Secondary device may not have `ip_config`; falls back to browser language. */
export type StealthViewerUi = {
  readyToConnect: string;
  connecting: string;
  connectedPrefix: string;
  connectError: string;
  generating: string;
  listeningLabel: string;
  /** Shown while partial speech recognition updates stream in */
  listeningProgress: string;
  waitingTranscript: string;
  questionFallback: string;
  aiErrorGeneric: string;
  connectTitle1: string;
  connectTitle2: string;
  connectSubtitle: string;
  connectButton: string;
  noCodePrompt: string;
  demoModeLink: string;
  emptyStateCoding: string;
  emptyStateGeneral: string;
  labelSuggestedCoding: string;
  labelSuggestedGeneral: string;
  btnNow: string;
  btnOther: string;
  btnHistory: string;
  historyTitle: string;
  historyEmpty: string;
  demoQuestion1: string;
  demoAnswer1: string;
  demoQuestionManual: string;
};

export function viewerUiLanguage(): SimLang {
  try {
    const raw = readSessionConfigStorage();
    if (raw) {
      const cfg = JSON.parse(raw) as {
        uiLocale?: string;
        interviewLanguage?: string;
        responseLanguage?: string;
      };
      if (cfg.uiLocale && SIM_LANGS.includes(cfg.uiLocale as SimLang)) return cfg.uiLocale as SimLang;
      return simulatedQuestionLanguage(cfg.interviewLanguage, cfg.responseLanguage);
    }
  } catch {
    /* ignore */
  }
  const nav = typeof navigator !== 'undefined' ? navigator.language.slice(0, 2).toLowerCase() : 'en';
  if (SIM_LANGS.includes(nav as SimLang)) return nav as SimLang;
  return 'en';
}

export const LIVE_SESSION_UI: Record<SimLang, LiveSessionUi> = {
  es: {
    liveBadge: '🔴 EN VIVO',
    statusPrefix: 'Estado:',
    statusListening: 'escuchando',
    statusConnected: 'conectado',
    statusDisconnected: 'desconectado',
    generatingGuide: '· generando guía…',
    howToTitleInterview: 'Cómo usar esta sesión',
    howToTitleLiveCoding: 'Prueba de codificación en tiempo real',
    howToStep1:
      'Pulsa "Activar micrófono" para transcribir lo que suena en tu entorno (ideal: auriculares y audio de la videollamada por el mismo PC).',
    howToStep2:
      'Pulsa "Pedir guía ahora" cuando quieras que la IA analice lo último escuchado, o activa "Auto tras pausa" para que, tras ~3 s de silencio, intente una guía si detecta un enunciado o pregunta.',
    howToStep3:
      'Abre /viewer en el móvil con el mismo código de sesión para leer la guía con discreción.',
    micSectionTitle: 'Micrófono y transcripción',
    speechNotSupported:
      'Tu navegador no expone reconocimiento de voz. Usa Chrome o Edge en el escritorio, o los botones de simulación abajo.',
    micOn: '⏹ Detener micrófono',
    micOff: '🎤 Activar micrófono',
    askGuideNow: '⚡ Pedir guía ahora',
    autoAfterPause: 'Auto tras pausa (~3 s)',
    emptyTranscriptError:
      'No hay texto transcrito todavía. Activa el micrófono o espera a que se escuche al entrevistador.',
    transcriptListening: 'Escuchando… habla o reproduce el audio de la entrevista.',
    transcriptIdle: 'Sin transcripción. Activa el micrófono o usa los botones de prueba.',
    lastPromptTitle: 'Enunciado / pregunta (última guía enviada)',
    lastPromptEmpty: 'Se rellena al pedir guía o al simular con los botones.',
    guideTitle: '✨ Guía de respuesta',
    guideTitleCoding: '✨ Guía live coding',
    emptyGuideCoding:
      'Aquí aparecerán las secciones 【ENTENDER】【DECIR】【PASOS】【CÓDIGO】【TRAMPA】 cuando pidas guía.',
    emptyGuideGeneral: 'La sugerencia aparecerá aquí cuando pidas guía o simules una pregunta.',
    aiErrorFallback: 'Error al generar la respuesta',
  },
  en: {
    liveBadge: '🔴 LIVE',
    statusPrefix: 'Status:',
    statusListening: 'listening',
    statusConnected: 'connected',
    statusDisconnected: 'disconnected',
    generatingGuide: '· generating guidance…',
    howToTitleInterview: 'How to use this session',
    howToTitleLiveCoding: 'Live coding session',
    howToStep1:
      'Press "Activate microphone" to transcribe audio from your environment (best: headphones and the call playing on the same computer).',
    howToStep2:
      'Press "Ask for guidance now" when you want the AI to analyze the latest audio, or enable "Auto after pause" so that after ~3 s of silence it tries to guide when it detects a prompt or question.',
    howToStep3: 'Open /viewer on your phone with the same session code to read the guidance discreetly.',
    micSectionTitle: 'Microphone & transcript',
    speechNotSupported:
      'Your browser does not expose speech recognition. Use Chrome or Edge on desktop, or use the simulation buttons below.',
    micOn: '⏹ Stop microphone',
    micOff: '🎤 Activate microphone',
    askGuideNow: '⚡ Ask for guidance now',
    autoAfterPause: 'Auto after pause (~3 s)',
    emptyTranscriptError:
      "No transcript yet. Turn on the microphone or wait until the interviewer's audio is picked up.",
    transcriptListening: 'Listening… speak or play the interview audio.',
    transcriptIdle: 'No transcript. Turn on the microphone or use the test buttons.',
    lastPromptTitle: 'Prompt / question (last guidance sent)',
    lastPromptEmpty: 'Filled when you ask for guidance or use the simulation buttons.',
    guideTitle: '✨ Answer guidance',
    guideTitleCoding: '✨ Live coding guidance',
    emptyGuideCoding:
      'Sections 【UNDERSTAND】【SAY】【STEPS】【CODE】【TRAP】 will appear here when you ask for guidance.',
    emptyGuideGeneral: 'Suggestions appear here when you ask for guidance or simulate a question.',
    aiErrorFallback: 'Could not generate a response',
  },
  pt: {
    liveBadge: '🔴 AO VIVO',
    statusPrefix: 'Estado:',
    statusListening: 'ouvindo',
    statusConnected: 'conectado',
    statusDisconnected: 'desconectado',
    generatingGuide: '· gerando orientação…',
    howToTitleInterview: 'Como usar esta sessão',
    howToTitleLiveCoding: 'Sessão de live coding',
    howToStep1:
      'Pressione "Ativar microfone" para transcrever o áudio do ambiente (ideal: fones e o áudio da videochamada no mesmo PC).',
    howToStep2:
      'Pressione "Pedir orientação agora" para a IA analisar o último áudio, ou ative "Auto após pausa" para que, após ~3 s de silêncio, tente orientar se detectar um enunciado ou pergunta.',
    howToStep3: 'Abra /viewer no celular com o mesmo código da sessão para ler a orientação com discrição.',
    micSectionTitle: 'Microfone e transcrição',
    speechNotSupported:
      'Seu navegador não expõe reconhecimento de voz. Use Chrome ou Edge no desktop ou os botões de simulação abaixo.',
    micOn: '⏹ Parar microfone',
    micOff: '🎤 Ativar microfone',
    askGuideNow: '⚡ Pedir orientação agora',
    autoAfterPause: 'Auto após pausa (~3 s)',
    emptyTranscriptError:
      'Ainda não há texto transcrito. Ative o microfone ou aguarde o áudio do entrevistador.',
    transcriptListening: 'Ouvindo… fale ou reproduza o áudio da entrevista.',
    transcriptIdle: 'Sem transcrição. Ative o microfone ou use os botões de teste.',
    lastPromptTitle: 'Enunciado / pergunta (última orientação enviada)',
    lastPromptEmpty: 'Preenchido ao pedir orientação ou ao simular com os botões.',
    guideTitle: '✨ Orientação de resposta',
    guideTitleCoding: '✨ Orientação de live coding',
    emptyGuideCoding:
      'As seções 【ENTENDER】【DIZER】【PASSOS】【CÓDIGO】【ARMADILHA】 aparecerão aqui ao pedir orientação.',
    emptyGuideGeneral: 'A sugestão aparecerá aqui ao pedir orientação ou simular uma pergunta.',
    aiErrorFallback: 'Erro ao gerar a resposta',
  },
  fr: {
    liveBadge: '🔴 EN DIRECT',
    statusPrefix: 'État :',
    statusListening: 'écoute',
    statusConnected: 'connecté',
    statusDisconnected: 'déconnecté',
    generatingGuide: '· génération du guide…',
    howToTitleInterview: 'Utiliser cette session',
    howToTitleLiveCoding: 'Session de live coding',
    howToStep1:
      'Appuyez sur « Activer le micro » pour transcrire l’audio ambiant (idéal : casque et son de l’appel sur le même PC).',
    howToStep2:
      'Appuyez sur « Demander un guide » pour que l’IA analyse le dernier audio, ou activez « Auto après pause » : après ~3 s de silence, un guide est tenté si un énoncé ou une question est détecté.',
    howToStep3: 'Ouvrez /viewer sur le mobile avec le même code de session pour lire le guide discrètement.',
    micSectionTitle: 'Microphone et transcription',
    speechNotSupported:
      'Votre navigateur n’expose pas la reconnaissance vocale. Utilisez Chrome ou Edge sur bureau, ou les boutons de simulation ci-dessous.',
    micOn: '⏹ Arrêter le micro',
    micOff: '🎤 Activer le micro',
    askGuideNow: '⚡ Demander un guide',
    autoAfterPause: 'Auto après pause (~3 s)',
    emptyTranscriptError:
      "Pas encore de transcription. Activez le micro ou attendez l'audio de votre interlocuteur.",
    transcriptListening: "Écoute… parlez ou faites jouer l'audio de l'entretien.",
    transcriptIdle: 'Pas de transcription. Activez le micro ou utilisez les boutons de test.',
    lastPromptTitle: 'Énoncé / question (dernier guide envoyé)',
    lastPromptEmpty: 'Rempli quand vous demandez un guide ou simulez avec les boutons.',
    guideTitle: '✨ Guide de réponse',
    guideTitleCoding: '✨ Guide live coding',
    emptyGuideCoding:
      'Les sections 【COMPRENDRE】【DIRE】【ÉTAPES】【CODE】【PIÈGE】 apparaîtront ici quand vous demandez un guide.',
    emptyGuideGeneral: 'La suggestion apparaîtra ici quand vous demandez un guide ou simulez une question.',
    aiErrorFallback: 'Erreur lors de la génération de la réponse',
  },
  de: {
    liveBadge: '🔴 LIVE',
    statusPrefix: 'Status:',
    statusListening: 'hört zu',
    statusConnected: 'verbunden',
    statusDisconnected: 'getrennt',
    generatingGuide: '· Leitfaden wird erstellt…',
    howToTitleInterview: 'So nutzt du diese Session',
    howToTitleLiveCoding: 'Live-Coding-Session',
    howToStep1:
      '„Mikrofon aktivieren“ drücken, um Audio aus der Umgebung zu transkribieren (ideal: Kopfhörer und Anrufaudio auf demselben PC).',
    howToStep2:
      '„Jetzt Leitfaden anfordern“ drücken, damit die KI das letzte Audio auswertet, oder „Auto nach Pause“ aktivieren: nach ~3 s Stille wird bei erkanntem Prompt oder Frage ein Leitfaden versucht.',
    howToStep3: 'Öffne /viewer auf dem Handy mit dem gleichen Session-Code, um den Leitfaden diskret zu lesen.',
    micSectionTitle: 'Mikrofon & Transkript',
    speechNotSupported:
      'Dein Browser bietet keine Spracherkennung. Nutze Chrome oder Edge am Desktop oder die Simulations-Buttons unten.',
    micOn: '⏹ Mikrofon stoppen',
    micOff: '🎤 Mikrofon aktivieren',
    askGuideNow: '⚡ Leitfaden anfordern',
    autoAfterPause: 'Auto nach Pause (~3 s)',
    emptyTranscriptError:
      'Noch kein Text. Mikrofon einschalten oder warten, bis Audio vom Gesprächspartner ankommt.',
    transcriptListening: 'Hört zu … sprich oder spiele das Interview-Audio ab.',
    transcriptIdle: 'Kein Transkript. Mikrofon aktivieren oder Test-Buttons nutzen.',
    lastPromptTitle: 'Aufgabe / Frage (letzter Leitfaden)',
    lastPromptEmpty: 'Wird gefüllt, wenn du einen Leitfaden anforderst oder simulierst.',
    guideTitle: '✨ Antwort-Leitfaden',
    guideTitleCoding: '✨ Live-Coding-Leitfaden',
    emptyGuideCoding:
      'Die Abschnitte 【VERSTEHEN】【SAGEN】【SCHRITTE】【CODE】【FALLE】 erscheinen hier, wenn du einen Leitfaden anforderst.',
    emptyGuideGeneral: 'Vorschläge erscheinen hier, wenn du einen Leitfaden anforderst oder eine Frage simulierst.',
    aiErrorFallback: 'Antwort konnte nicht erzeugt werden',
  },
};

export const STEALTH_VIEWER_UI: Record<SimLang, StealthViewerUi> = {
  es: {
    readyToConnect: 'Listo para conectar',
    connecting: 'Conectando...',
    connectedPrefix: 'Conectado ·',
    connectError: '✗ No se pudo conectar — ¿el servidor está en ejecución?',
    generating: 'Generando respuesta...',
    listeningLabel: 'Escuchando',
    listeningProgress: 'Escuchando...',
    waitingTranscript: 'Esperando audio de la entrevista...',
    questionFallback: 'Pregunta de la entrevista',
    aiErrorGeneric: 'Error al generar',
    connectTitle1: 'Dispositivo',
    connectTitle2: 'secundario',
    connectSubtitle: 'Ingresa el código de sesión que aparece en tu computador, o activa el modo demo.',
    connectButton: 'Conectar →',
    noCodePrompt: '¿Sin código?',
    demoModeLink: 'Entrar en modo demo',
    emptyStateCoding:
      'Aquí verás ENTENDER, DECIR, PASOS, CÓDIGO y TRAMPA cuando haya un enunciado o pregunta.',
    emptyStateGeneral: 'La guía aparecerá aquí cuando el entrevistador haga una pregunta.',
    labelSuggestedCoding: 'guía live coding',
    labelSuggestedGeneral: 'respuesta sugerida',
    btnNow: '⚡ Ahora',
    btnOther: '↺ Otra',
    btnHistory: '📋 Historial',
    historyTitle: 'Preguntas anteriores',
    historyEmpty: 'Sin historial aún',
    demoQuestion1:
      '¿Puedes contarme una situación en la que tuvieras que gestionar a un stakeholder difícil?',
    demoAnswer1:
      'En mi rol anterior tuve un stakeholder con expectativas cambiantes sobre el alcance del proyecto. Lo primero que hice fue clarificar objetivos y restricciones en una reunión uno a uno, y luego acordamos un backlog priorizado visible para todo el equipo. Esto redujo las solicitudes ad hoc en más de un 60% y nos permitió entregar el MVP en la fecha comprometida sin quemar al equipo.',
    demoQuestionManual: '¿Cuál dirías que es tu mayor fortaleza como profesional?',
  },
  en: {
    readyToConnect: 'Ready to connect',
    connecting: 'Connecting...',
    connectedPrefix: 'Connected ·',
    connectError: '✗ Could not connect — is the server running?',
    generating: 'Generating response...',
    listeningLabel: 'Listening',
    listeningProgress: 'Listening...',
    waitingTranscript: 'Waiting for interview audio...',
    questionFallback: 'Interview question',
    aiErrorGeneric: 'Generation error',
    connectTitle1: 'Secondary',
    connectTitle2: 'device',
    connectSubtitle: 'Enter the session code shown on your computer, or start demo mode.',
    connectButton: 'Connect →',
    noCodePrompt: 'No code?',
    demoModeLink: 'Try demo mode',
    emptyStateCoding:
      'You will see UNDERSTAND, SAY, STEPS, CODE, and TRAP when there is a prompt or question.',
    emptyStateGeneral: 'Guidance will appear here when the interviewer asks a question.',
    labelSuggestedCoding: 'live coding guide',
    labelSuggestedGeneral: 'suggested answer',
    btnNow: '⚡ Now',
    btnOther: '↺ Again',
    btnHistory: '📋 History',
    historyTitle: 'Previous questions',
    historyEmpty: 'No history yet',
    demoQuestion1:
      'Can you tell me about a time you had to manage a difficult stakeholder?',
    demoAnswer1:
      'In my previous role I had a stakeholder whose expectations on scope kept shifting. I first clarified goals and constraints in a one-on-one, then we agreed on a prioritized backlog visible to the whole team. That cut ad-hoc requests by over 60% and let us ship the MVP on time without burning out the team.',
    demoQuestionManual: 'What would you say is your greatest strength as a professional?',
  },
  pt: {
    readyToConnect: 'Pronto para conectar',
    connecting: 'Conectando...',
    connectedPrefix: 'Conectado ·',
    connectError: '✗ Não foi possível conectar — o servidor está rodando?',
    generating: 'Gerando resposta...',
    listeningLabel: 'Ouvindo',
    listeningProgress: 'Ouvindo...',
    waitingTranscript: 'Aguardando áudio da entrevista...',
    questionFallback: 'Pergunta da entrevista',
    aiErrorGeneric: 'Erro ao gerar',
    connectTitle1: 'Dispositivo',
    connectTitle2: 'secundário',
    connectSubtitle: 'Digite o código da sessão mostrado no computador ou ative o modo demo.',
    connectButton: 'Conectar →',
    noCodePrompt: 'Sem código?',
    demoModeLink: 'Entrar em modo demo',
    emptyStateCoding:
      'Você verá ENTENDER, DIZER, PASSOS, CÓDIGO e ARMADILHA quando houver um enunciado ou pergunta.',
    emptyStateGeneral: 'A orientação aparecerá aqui quando o entrevistador fizer uma pergunta.',
    labelSuggestedCoding: 'guia de live coding',
    labelSuggestedGeneral: 'resposta sugerida',
    btnNow: '⚡ Agora',
    btnOther: '↺ Outra',
    btnHistory: '📋 Histórico',
    historyTitle: 'Perguntas anteriores',
    historyEmpty: 'Sem histórico ainda',
    demoQuestion1:
      'Pode contar sobre uma situação em que precisou lidar com um stakeholder difícil?',
    demoAnswer1:
      'No meu papel anterior havia um stakeholder com expectativas de escopo mudando. Primeiro alinhei metas e restrições em uma conversa individual; depois combinamos um backlog priorizado visível para o time. Isso reduziu pedidos ad hoc em mais de 60% e permitiu entregar o MVP no prazo sem esgotar o time.',
    demoQuestionManual: 'Qual você diria que é seu maior ponto forte como profissional?',
  },
  fr: {
    readyToConnect: 'Prêt à se connecter',
    connecting: 'Connexion...',
    connectedPrefix: 'Connecté ·',
    connectError: '✗ Connexion impossible — le serveur tourne-t-il ?',
    generating: 'Génération de la réponse...',
    listeningLabel: 'Écoute',
    listeningProgress: 'Écoute…',
    waitingTranscript: 'En attente de l’audio de l’entretien...',
    questionFallback: 'Question d’entretien',
    aiErrorGeneric: 'Erreur de génération',
    connectTitle1: 'Appareil',
    connectTitle2: 'secondaire',
    connectSubtitle: 'Saisissez le code de session affiché sur votre ordinateur, ou lancez la démo.',
    connectButton: 'Se connecter →',
    noCodePrompt: 'Pas de code ?',
    demoModeLink: 'Mode démo',
    emptyStateCoding:
      'Vous verrez COMPRENDRE, DIRE, ÉTAPES, CODE et PIÈGE lorsqu’il y a un énoncé ou une question.',
    emptyStateGeneral: "Le guide apparaîtra ici lorsque votre interlocuteur posera une question.",
    labelSuggestedCoding: 'guide live coding',
    labelSuggestedGeneral: 'réponse suggérée',
    btnNow: '⚡ Maintenant',
    btnOther: '↺ Encore',
    btnHistory: '📋 Historique',
    historyTitle: 'Questions précédentes',
    historyEmpty: 'Pas encore d’historique',
    demoQuestion1:
      'Pouvez-vous me parler d’une situation où vous avez dû gérer un stakeholder difficile ?',
    demoAnswer1:
      'Dans mon précédent poste, un stakeholder changeait souvent les attentes sur le périmètre. J’ai d’abord clarifié objectifs et contraintes en one-to-one, puis nous avons fixé un backlog priorisé visible par l’équipe. Les demandes ad hoc ont chuté de plus de 60% et nous avons livré le MVP dans les temps sans épuiser l’équipe.',
    demoQuestionManual: 'Quelle serait votre plus grande force en tant que professionnel ?',
  },
  de: {
    readyToConnect: 'Bereit zum Verbinden',
    connecting: 'Verbinden...',
    connectedPrefix: 'Verbunden ·',
    connectError: '✗ Verbindung fehlgeschlagen — läuft der Server?',
    generating: 'Antwort wird erstellt...',
    listeningLabel: 'Hört zu',
    listeningProgress: 'Hört zu…',
    waitingTranscript: 'Warte auf Interview-Audio...',
    questionFallback: 'Interviewfrage',
    aiErrorGeneric: 'Fehler bei der Generierung',
    connectTitle1: 'Zweites',
    connectTitle2: 'Gerät',
    connectSubtitle: 'Gib den Session-Code vom Computer ein oder starte den Demo-Modus.',
    connectButton: 'Verbinden →',
    noCodePrompt: 'Kein Code?',
    demoModeLink: 'Demo-Modus',
    emptyStateCoding:
      'Hier erscheinen VERSTEHEN, SAGEN, SCHRITTE, CODE und FALLE, sobald es eine Aufgabe oder Frage gibt.',
    emptyStateGeneral: 'Der Leitfaden erscheint hier, wenn der Interviewer eine Frage stellt.',
    labelSuggestedCoding: 'Live-Coding-Leitfaden',
    labelSuggestedGeneral: 'vorgeschlagene Antwort',
    btnNow: '⚡ Jetzt',
    btnOther: '↺ Nochmal',
    btnHistory: '📋 Verlauf',
    historyTitle: 'Frühere Fragen',
    historyEmpty: 'Noch kein Verlauf',
    demoQuestion1:
      'Können Sie von einer Situation erzählen, in der Sie einen schwierigen Stakeholder managen mussten?',
    demoAnswer1:
      'In meiner vorherigen Rolle hatte ich einen Stakeholder mit wechselnden Scope-Erwartungen. Ich habe zuerst Ziele und Rahmen im Einzelgespräch geklärt, dann ein priorisiertes Backlog für alle sichtbar vereinbart. Ad-hoc-Anfragen sanken um über 60%, und wir lieferten das MVP termingerecht ohne das Team zu überlasten.',
    demoQuestionManual: 'Was würden Sie als Ihre größte Stärke als Fachkraft nennen?',
  },
};
