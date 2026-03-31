## InterviewPilot — Interview AI Copilot

Este archivo centraliza el contexto vivo del proyecto. Se actualizará a medida que vayamos tomando decisiones de producto, arquitectura e implementación.

---

### 1. Visión general del proyecto

Desarrollar una PWA llamada **InterviewPilot** que funcione como copiloto de IA en tiempo real durante entrevistas de trabajo online. La herramienta:

- Captura el audio de la conversación (entrevistador + candidato).
- Transcribe automáticamente las preguntas del entrevistador.
- Genera respuestas guía para el candidato en tiempo real, con latencia mínima, para permitir una lectura natural y fluida en un segundo dispositivo (tablet/celular/segunda pantalla).

**Referencias de diseño/funcionalidad:**
- `ntro.io`: consola discreta, modo stealth, captura de audio en reuniones.
- `devinterview.io`: estructura de respuestas técnicas precisas y por categorías.

---

### 2. Stack y arquitectura (resumen)

**Frontend (apps/web):**
- Next.js 14+ (App Router), TypeScript.
- Tailwind CSS.
- Estado global: Zustand.
- Tiempo real: WebSockets (Socket.io) o SSE.
- Audio: Web Audio API + MediaRecorder API.

**Backend (apps/server):**
- Node.js con Express o Fastify.
- Socket.io para WebSockets.
- Transcripción en tiempo real: Deepgram (principal) o AssemblyAI Real-Time.
- IA para respuestas (prioridad por velocidad):
  - Groq (Llama 3.3 70B / 3.1 8B instant).
  - Anthropic Claude haiku.
  - OpenAI GPT‑4o mini.
  - Google Gemini 2.0 Flash.
- Base de datos: PostgreSQL + Prisma.
- Caché/contexto: Redis.
- Autenticación: NextAuth.js o Clerk.

**Infraestructura:**
- Vercel (frontend).
- Railway/Render (backend WebSocket).
- Env vars para todas las API keys.

---

### 3. Módulos principales

**Módulo 1 — Configuración de sesión (pre‑entrevista)**
- Form multi‑paso tipo wizard (vacante, candidato, idioma/IA, revisión + prueba de audio).
- Objeto `SessionConfig` (vacante, perfil candidato, idioma, tipo de entrevista, IA, audio, contexto adicional).
- Soporte de plantillas reutilizables.

**Módulo 2 — Captura de audio en tiempo real**
- Captura desde tab (`getDisplayMedia`) y/o micrófono (`getUserMedia`).
- Posibilidad de mezclar micrófono + tab.
- Envío de stream a Deepgram Real‑Time vía WebSocket.
- Uso de `interim_results`, endpointing y diarización.

**Módulo 3 — Motor de IA para respuestas**
- System prompt maestro dinámico construido con `SessionConfig` + historial de conversación.
- Selección dinámica de proveedor IA más rápido (`auto`).
- Respuestas siempre en streaming, con límite de tokens y baja temperatura.
- Historial de últimas N interacciones almacenado en Redis.

**Módulo 4 — UI de sesión activa**
- Layout con:
  - Transcripción en tiempo real.
  - Panel de guía de respuesta con fuente grande, alto contraste, efecto typewriter.
  - Historial de preguntas.
- Estados de sesión (`idle`, `listening`, `transcribing`, `generating`, `ready`, `error`).
- Atajos de teclado (regenerar, toggle stealth, variar tamaño texto, etc.).

**Módulo 5 — Modo multi‑dispositivo (stealth)**
- Dispositivo primario (PC) crea una sesión con código/QR.
- Dispositivo secundario (móvil/tablet) se une vía WebSocket como `viewer`.
- Solo el secundario muestra la guía de respuesta; el primario se mantiene “limpio”.

**Módulo 6 — Multi‑idioma**
- Soporte inicial: `es`, `en`, `fr`, `de`, `pt`, `it` + modo `auto` con Deepgram.
- Posibilidad de: audio en un idioma → guía en otro.

**Módulo 7 — Post‑sesión y analytics**
- Resumen de todas las preguntas detectadas + respuestas sugeridas.
- Exportación PDF/Markdown.
- Replay de sesión (transcript + guía).
- Métricas de latencia, nº de preguntas, idiomas, proveedor IA y tokens.

---

### 4. Seguridad y privacidad (pilares)

- Procesamiento de audio en streaming en memoria (no se guarda por defecto).
- Opt‑in explícito para guardar transcripciones.
- API keys siempre en el backend.
- Sesiones con expiración automática.
- Session codes de un solo uso y caducidad.
- HTTPS en todo.
- Contexto sensible (CV, info del cargo) encriptado en Redis con TTL.

---

### 5. UX / guía visual rápida

- Modo oscuro por defecto (fondo casi negro, texto claro).
- Panel de respuesta minimalista y sin distracciones, con auto‑scroll y animación suave de tokens.
- Indicadores discretos de estado (grabando, procesando, listo).
- Layouts diferenciados para:
  - Escritorio (config + panel completo).
  - Tablet (columna principal optimizada).
  - Móvil stealth (solo guía, fuente grande, fondo negro).

---

### 6. Roadmap de fases

**Fase 1 — MVP**
- Captura de micrófono + Deepgram en tiempo real.
- Detección básica de preguntas.
- Generación streaming con Groq.
- UI básica de sesión.
- Configuración manual de contexto.
- Soporte `en` y `es`.

**Fase 2 — Multi‑dispositivo y calidad**
- Sincronización multi‑dispositivo via WebSocket + QR.
- Vista optimizada móvil (stealth).
- Historial de conversación como contexto.
- Botón de regenerar y feedback.
- Todos los idiomas soportados.
- Templates de configuración.

**Fase 3 — Producción**
- Autenticación y usuarios.
- Resumen post‑sesión + export.
- Dashboard de historial.
- Selección dinámica de proveedor IA (`auto`).
- Optimizaciones finales de latencia.
- Rate limiting y hardening de APIs.

**Fase 4 — Futuro**
- Captura de audio del tab nativa.
- Análisis de sentimiento.
- Sugerencias proactivas sin esperar pregunta completa.
- Modo “práctica” con IA como entrevistador.
- Integración con LinkedIn.

---

### 7. Estructura de monorepo (propuesta)

- `apps/web`: Next.js frontend (config, sesión, viewer, post‑sesión).
- `apps/server`: backend Node.js (rutas `sessions`, `ai`, `audio`, WebSocket `session.gateway`).
- `packages/shared-types`: tipos compartidos (incl. `SessionConfig`, `ConversationTurn`, etc.).
- `packages/prompt-builder`: lógica de construcción de prompts y system messages.
- `docker-compose.yml`: stack de desarrollo local (PostgreSQL + Redis).

---

### 8. Notas de trabajo entre Tony & Jarvis

- Tú (Tony) defines prioridades, alcance de cada iteración y decisiones de producto.
- Yo (Jarvis) bajo esas decisiones a:
  - Diseño técnico concreto (componentes, hooks, servicios).
  - Implementación en código (frontend, backend, infra ligera de dev).
  - Ajustes del contexto en este archivo conforme vayan cambiando los requisitos.

Cada vez que cambiemos algo importante (stack, arquitectura, UX clave, modelo IA, etc.), iremos reflejándolo aquí para mantener una única fuente de verdad del proyecto.

