# InterviewPilot

Copiloto de IA en tiempo real para entrevistas de trabajo (Meet, Zoom, Teams). Transcribe la conversación y sugiere respuestas al candidato usando el contexto de la vacante y su CV.

## Requisitos

- Node.js 18+
- Cuenta en [Groq](https://console.groq.com) (gratis, para la IA)

## Desarrollo local

### 1. Clave de Groq (IA real)

1. Entra en [console.groq.com](https://console.groq.com) → API Keys → Create API Key.
2. En la carpeta `server`, crea un archivo `.env` (puedes copiar `.env.example`):
   ```bash
   cd server
   cp .env.example .env
   ```
3. Edita `.env` y pega tu clave:
   ```
   GROQ_API_KEY=gsk_xxxxxxxxxxxx
   ```

### 2. Arrancar servidor y cliente

```bash
# Terminal 1 — backend (puerto 3001)
cd server
npm install
npm run dev

# Terminal 2 — frontend (puerto 3000)
cd client
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000): configura la sesión (vacante + tu perfil), inicia sesión y en la pantalla de sesión usa las preguntas simuladas para probar la guía de respuesta con IA real.

Verificación rápida (sin revelar la clave):
- Abre `http://localhost:3001/debug/env`
- Debe devolver: `{"GROQ_API_KEY_set": true}`

### Entrevista / live coding en tiempo real

1. En la pantalla de sesión (`/session/...`), pulsa **Activar micrófono** (Chrome o Edge recomendado; el reconocimiento de voz es del navegador).
2. El audio que capte el micrófono se transcribe y se envía al servidor; en otro dispositivo puedes abrir **`/viewer`**, introducir el mismo código de sesión y ver la misma transcripción y la guía de la IA.
3. **Pedir guía ahora** envía el texto transcrito actual a Groq. Con **Auto tras pausa** (~3 s de silencio), se intenta una guía automática si el texto parece un enunciado o pregunta (útil en modo live coding).
4. Para mejores resultados con videollamadas, usa auriculares y que el entrevistador se escuche por los altavoces del mismo equipo, o una configuración de audio loopback (p. ej. BlackHole en Mac) según el asistente de configuración.

## Compilar para producción

```bash
# 1. Frontend
cd client
npm run build
# → genera client/dist/

# 2. Backend
cd ../server
npm run build
# → genera server/dist/
```

## Desplegar en producción

### Opción A — Todo en un solo servidor (Railway, Render, Fly.io, etc.)

El backend sirve el frontend compilado desde `server/public`.

```bash
# Compilar cliente y copiarlo al servidor
cd client && npm run build && cd ..
cp -r client/dist server/public

# Desplegar solo la carpeta server (con server/public dentro)
# En el servidor: npm install --production && npm start
```

Variables de entorno en el servidor:

- `GROQ_API_KEY` — clave de Groq (obligatoria para IA real)
- `PORT` — puerto (el host suele asignarlo)
- `CORS_ORIGIN` — puede omitirse si todo va en el mismo dominio

La app se abre en la URL del servidor (ej. `https://tu-app.railway.app`). El cliente usa el mismo origen para API y WebSocket.

### Opción B — Frontend y backend separados

- **Backend**: Despliega `server` (Railway, Render, etc.) con `GROQ_API_KEY`, `PORT` y `CORS_ORIGIN` = URL del frontend.
- **Frontend**: Compila apuntando al backend y sube `client/dist` a Vercel/Netlify:

  ```bash
  cd client
  VITE_SERVER_URL=https://tu-backend.ejemplo.com npm run build
  ```

Sin `GROQ_API_KEY` el backend sigue funcionando y devuelve respuestas de demo (texto fijo).
