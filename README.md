# InterviewPilot 🎯

Real-time AI copilot for online job interviews. Captures audio, transcribes interviewer questions in real-time, and generates AI-powered response suggestions — designed to run on a second device (tablet, phone, or second screen).

## Features

- 🎙️ **Real-time transcription** via Deepgram Nova-2
- 🤖 **AI response suggestions** from Groq, Anthropic, OpenAI, or Gemini
- 🌐 **Multi-language support** (English & Spanish)
- 📱 **PWA** — installable on mobile devices
- 🔄 **Streaming responses** for minimal latency
- 💾 **Session history** with full transcripts and responses

## Architecture

```
job-interview-model/
├── frontend/          # Next.js 14 PWA
├── backend/           # Node.js + Express + Socket.io
└── docker-compose.yml # PostgreSQL + Redis
```

## Prerequisites

- Node.js 18+
- Docker (for PostgreSQL and Redis)
- API keys for at least one AI provider

## Setup

### 1. Start infrastructure

```bash
docker-compose up -d
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Edit `backend/.env` with your API keys:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/interviewpilot"
REDIS_URL="redis://localhost:6379"
DEEPGRAM_API_KEY="your_deepgram_key"
GROQ_API_KEY="your_groq_key"          # Recommended: fastest
ANTHROPIC_API_KEY="your_anthropic_key" # Optional
OPENAI_API_KEY="your_openai_key"       # Optional
GEMINI_API_KEY="your_gemini_key"       # Optional
```

### 4. Set up database

```bash
cd backend
npx prisma db push
npx prisma generate
```

### 5. Run

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | No | Redis URL (falls back to in-memory) |
| `PORT` | No | Server port (default: 3001) |
| `CORS_ORIGIN` | No | Frontend URL (default: http://localhost:3000) |
| `DEEPGRAM_API_KEY` | Yes* | For real-time transcription |
| `GROQ_API_KEY` | Yes* | Groq Llama 3 (fastest) |
| `ANTHROPIC_API_KEY` | Yes* | Claude Haiku |
| `OPENAI_API_KEY` | Yes* | GPT-4o mini |
| `GEMINI_API_KEY` | Yes* | Gemini Pro |

*At least one AI provider key required.

### Frontend (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_BACKEND_URL` | Backend URL (default: http://localhost:3001) |

## Usage

1. Open http://localhost:3000
2. Click **Start Interview** and configure your session
3. On your second device, open the interview URL
4. Click **Start Recording** — audio is captured and transcribed live
5. AI responses stream in automatically as questions are detected
