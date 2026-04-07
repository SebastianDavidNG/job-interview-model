# InterviewPilot

Real-time AI copilot for job interviews (Meet, Zoom, Teams). It transcribes the conversation and suggests answers using the job description context and the candidate’s profile.

This repository is **public for portfolio purposes** on my GitHub profile. The code demonstrates full-stack real-time patterns, prompt-driven guidance, and UX for high-pressure communication workflows.

---

## Recruiter quick view

- **Role focus**: Frontend-heavy product development with React + TypeScript, connected to a real-time backend.
- **Problem solved**: Support candidates during interviews with low-latency transcription and AI-assisted response guidance.
- **My contribution**: Product architecture, React UI flows, real-time state synchronization, backend integration, and deployment strategy.
- **What this shows**: I can design and deliver practical user-facing tools, not only isolated components.

### React experience demonstrated in this project

- Built a multi-screen React application (`setup`, `session`, `viewer`) with clear UX flows.
- Implemented real-time client updates using Socket.IO and state-driven rendering.
- Integrated browser APIs (microphone/speech recognition) into a production-style UI workflow.
- Structured the frontend for local development and production deployment with Vite.

---

## What it does

- **Session setup** — Configure the role (job description) and your profile so guidance stays relevant.
- **Live transcription** — Browser-based speech recognition captures what you say; text is sent to the server.
- **AI guidance** — Sends transcript and context to [Groq](https://groq.com) for fast, structured response suggestions.
- **Shared viewer** — Open `/viewer` on another device with the same session code to follow the transcript and AI guidance.
- **Manual & auto guidance** — “Ask for guidance now” or optional auto-guidance after a pause when the text looks like a question or prompt (useful for live coding).

Without a `GROQ_API_KEY`, the backend still runs and returns **fixed demo text** so you can explore the UI.

---

## Tech stack

| Area        | Technologies                          |
| ----------- | --------------------------------------- |
| Frontend    | React 18, Vite, TypeScript, React Router |
| Backend     | Node.js, Express, TypeScript            |
| Realtime    | Socket.IO                             |
| AI          | Groq API (`groq-sdk`)                   |

---

## Requirements

- **Node.js** 18+
- A **Groq** account ([console.groq.com](https://console.groq.com)) — free tier is enough for real AI responses

---

## Local development

### 1. Groq API key (real AI)

1. Go to [console.groq.com](https://console.groq.com) → **API Keys** → **Create API Key**.
2. In the `server` folder, create a `.env` file from the example (this file is **gitignored**; never commit it):

   ```bash
   cd server
   cp .env.example .env
   ```

3. Edit `.env` and set your key:

   ```env
   GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

   Keep this file **only on your machine** or in your host’s secret manager — not in the repo.

### 2. Run server and client

```bash
# Terminal 1 — backend (default port 3001)
cd server
npm install
npm run dev

# Terminal 2 — frontend (default port 3000)
cd client
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000): set up the session (role + profile), start the session, and use the simulated prompts on the session screen to try real AI guidance.

**Quick check (does not expose the key):**

- Open `http://localhost:3001/debug/env`
- You should see: `{"GROQ_API_KEY_set": true}`

### Live interview / live coding flow

1. On the session screen (`/session/...`), click **Enable microphone** (Chrome or Edge recommended; speech recognition is provided by the browser).
2. Transcribed audio is sent to the server. On another device, open **`/viewer`**, enter the same session code, and you’ll see the same transcript and AI guidance.
3. **Ask for guidance now** sends the current transcript to Groq. **Auto after pause** (~3 s of silence) tries automatic guidance when the text looks like a statement or question (helpful for live coding).
4. For better results on video calls: use headphones and have the interviewer audible on the same machine’s speakers, or use a loopback setup (e.g. BlackHole on macOS) as described in the in-app setup assistant.

---

## Production build

```bash
# 1. Frontend
cd client
npm run build
# → outputs to client/dist/

# 2. Backend
cd ../server
npm run build
# → outputs to server/dist/
```

---

## Deploying

### Option A — Single server (Railway, Render, Fly.io, etc.)

The backend can serve the built frontend from `server/public`.

```bash
cd client && npm run build && cd ..
cp -r client/dist server/public

# Deploy the server folder (with server/public inside)
# On the host: npm install --production && npm start
```

Set environment variables on the host (see below). Open the app at your server URL (e.g. `https://your-app.railway.app`). The client uses the same origin for API and WebSocket.

### Option B — Split frontend and backend

- **Backend** — Deploy `server` with `GROQ_API_KEY`, `PORT`, and `CORS_ORIGIN` set to your frontend URL.
- **Frontend** — Build with the backend URL and deploy `client/dist` to Vercel/Netlify:

  ```bash
  cd client
  VITE_SERVER_URL=https://your-backend.example.com npm run build
  ```

---

## Environment variables

| Variable         | Description |
| ---------------- | ----------- |
| `GROQ_API_KEY`   | Groq API key — required for real AI (optional for demo mode). |
| `PORT`           | Server port (often set by the host). |
| `CORS_ORIGIN`    | Allowed browser origins; comma-separated if multiple. Can be omitted when frontend and API share the same domain. |

---

## Security

- **Do not commit** `.env` or any file containing API keys. This repo uses `.gitignore` for that.
- If a key was ever pushed to GitHub, **rotate it** in the Groq console and treat the old key as compromised, even if the repository is private or the file was later removed.

---

## License and usage

This repository is publicly visible **for portfolio and evaluation**.

**All rights reserved.** You may browse the code for reference. Copying, reusing, modifying, redistributing, or deploying this project (in whole or in part) **requires explicit written permission** from the author. See the `LICENSE` file for details.

For collaboration, deployment permission, or other requests, contact:

- Email: `sebastiandavidn@gmail.com`
- LinkedIn: [https://www.linkedin.com/in/sebastiandavidninog/](https://www.linkedin.com/in/sebastiandavidninog/)

---

## Author

Built as a portfolio project demonstrating real-time AI-assisted interview tooling. Not affiliated with Google Meet, Zoom, Microsoft Teams, or Groq.
