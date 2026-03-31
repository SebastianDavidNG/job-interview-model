import { useCallback, useEffect, useRef } from 'react';

/** Mapea idioma del wizard a locale del Web Speech API */
export function speechLocaleFromInterviewLanguage(
  interviewLanguage: string | undefined
): string {
  switch (interviewLanguage) {
    case 'en':
      return 'en-US';
    case 'pt':
      return 'pt-BR';
    case 'fr':
      return 'fr-FR';
    case 'de':
      return 'de-DE';
    case 'es':
      return 'es-ES';
    case 'auto':
    default:
      return typeof navigator !== 'undefined' && navigator.language
        ? navigator.language
        : 'es-ES';
  }
}

type RecognitionCtor = new () => SpeechRecognition;

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isBrowserSpeechSupported(): boolean {
  return getRecognitionCtor() !== null;
}

type Options = {
  enabled: boolean;
  lang: string;
  onText: (text: string, isFinal: boolean) => void;
  onError: (message: string) => void;
};

/**
 * Reconocimiento continuo del micrófono (Chrome/Edge).
 * Reinicia automáticamente cuando el motor se detiene (silencio prolongado).
 */
export function useLiveSpeechRecognition({ enabled, lang, onText, onError }: Options): void {
  const onTextRef = useRef(onText);
  const onErrorRef = useRef(onError);
  onTextRef.current = onText;
  onErrorRef.current = onError;

  const recRef = useRef<SpeechRecognition | null>(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const startSafe = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor || !enabledRef.current) return;

    try {
      if (recRef.current) {
        recRef.current.onend = null;
        recRef.current.onerror = null;
        recRef.current.onresult = null;
        recRef.current.abort();
      }
    } catch {
      /* ignore */
    }

    const rec = new Ctor();
    recRef.current = rec;
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang;

    rec.onresult = (ev: SpeechRecognitionEvent) => {
      let text = '';
      for (let i = 0; i < ev.results.length; i++) {
        text += ev.results[i][0]?.transcript ?? '';
      }
      const trimmed = text.trim();
      if (!trimmed) return;
      const last = ev.results[ev.results.length - 1];
      const isFinal = last?.isFinal ?? false;
      onTextRef.current(trimmed, isFinal);
    };

    rec.onerror = (ev: SpeechRecognitionErrorEvent) => {
      if (ev.error === 'no-speech' || ev.error === 'aborted') return;
      if (ev.error === 'not-allowed') {
        onErrorRef.current('Permiso de micrófono denegado.');
        return;
      }
      onErrorRef.current(ev.error || 'Error de reconocimiento');
    };

    rec.onend = () => {
      if (enabledRef.current && recRef.current === rec) {
        try {
          rec.start();
        } catch {
          /* ya iniciado */
        }
      }
    };

    try {
      rec.start();
    } catch {
      onErrorRef.current('No se pudo iniciar el reconocimiento de voz.');
    }
  }, [lang]);

  useEffect(() => {
    if (!enabled) {
      try {
        recRef.current?.stop();
      } catch {
        /* ignore */
      }
      recRef.current = null;
      return;
    }
    startSafe();
    return () => {
      enabledRef.current = false;
      try {
        recRef.current?.stop();
      } catch {
        /* ignore */
      }
      recRef.current = null;
    };
  }, [enabled, startSafe]);
}
