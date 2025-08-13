# Subspace Pro — AI Assistant 🚀

*A full-stack, real-time, and secure AI chatbot application built to showcase modern web development practices.*
*Created as part of the Intern Assessment for **Subspace**.*

---

> **Live Demo & Showcase**
>
> * **Deployed Site:** `[Your Final Netlify Link]`
> * **Video Walkthrough:** `[Loom/YouTube Link]`
> * **GIF Preview:** *(tip: record a short GIF using Giphy Capture or ScreenToGif and drop it here)*

---

## Table of Contents

* [About The Project](#about-the-project)
* [Core Technologies](#core-technologies)
* [Key Features](#key-features)
* [System Architecture](#system-architecture)
* [Screenshots / Demo](#screenshots--demo)
* [Local Development Setup](#local-development-setup)
* [Environment Variables](#environment-variables)
* [Database Schema (SQL)](#database-schema-sql)
* [Hasura Action (SDL)](#hasura-action-sdl)
* [n8n Workflow (High Level)](#n8n-workflow-high-level)
* [Security Notes](#security-notes)
* [Project Structure](#project-structure)
* [Roadmap](#roadmap)
* [License](#license)

---

## About The Project

**Subspace Pro** is a sophisticated AI assistant designed for real-time, intelligent conversations. The app is built on a **modern, serverless, GraphQL-native** architecture with a polished, responsive UI and advanced chat ergonomics (history management, markdown, edit/regenerate responses).
The solution adheres strictly to the assignment’s requirements: **security-first**, **GraphQL-only API**, and a clean separation between the **frontend** and a **secure automation backend**.

---

## Core Technologies

**Frontend:** React (Vite), Tailwind CSS, Framer Motion
**BaaS:** Nhost
**Authentication:** Nhost Auth
**Database:** Postgres (via Nhost)
**API Layer:** Hasura GraphQL (real-time via Subscriptions)
**Automation / AI Middleware:** n8n
**AI Model:** OpenRouter (Google Gemma / Mistral 7B)
**Deployment:** Netlify

---

## Key Features

* ✅ **Secure Authentication:** Full email/password sign-in & sign-up with Nhost Auth.
* ✅ **Data Privacy:** **Row-Level Security (RLS)** ensures users can only access their own chat data.
* ✅ **Real-time Messaging:** Live chat with **GraphQL Subscriptions**.
* ✅ **Intelligent AI:** The “Subspace Pro” assistant has conversational memory and strong prompt engineering.
* ✅ **Rich Text Formatting:** Full **Markdown** responses with syntax-highlighted code blocks + **copy-to-clipboard**.
* ✅ **Advanced Chat Controls:**

  * Edit & rename chat titles
  * Delete chats (with confirmation)
  * Edit your last message & **regenerate** AI response
* ✅ **Polished UI/UX:**

  * Clean, modern interface; responsive (desktop & mobile)
  * Toggleable sidebar for focus mode
  * Light/Dark mode
  * Smooth **Framer Motion** animations

---

## System Architecture

```mermaid
flowchart LR
  A[Client (React + Vite)] -- GraphQL Queries/Mutations/Subscriptions --> B[(Hasura on Nhost)]
  A -- Auth (Nhost Auth) --> B
  B -- Action: sendMessage --> C[n8n Workflow (Secure Middleware)]
  C -- Validates User / Loads History --> B
  C -- Calls --> D[OpenRouter (Gemma/Mistral)]
  D -- AI Reply --> C
  C -- Save Message (Mutation) --> B
  B -- Realtime Subscriptions --> A
```

* **Frontend (React):** Only speaks GraphQL to the backend.
* **Hasura/Nhost:** Real-time GraphQL API over Postgres; RLS enforces per-user isolation.
* **n8n (Middleware):** Frontend never hits OpenRouter directly. Secrets live on the server. n8n validates the user, fetches context, calls the model, persists the response, and returns a safe payload.

---

## Screenshots / Demo

> Replace the placeholders below with your own assets.

* **Landing / Chat UI:** `./docs/screenshot-landing.png`
* **Chat in action (GIF):** `./docs/chat-demo.gif`
* **n8n Workflow:** `./docs/n8n-workflow.png`

---

## Local Development Setup

### 1) Clone & Install

```bash
git clone [Your GitHub Repository URL]
cd my-chatbot-app
npm install
```

### 2) Backend on Nhost

1. Create a new **Nhost** project.
2. Apply the SQL schema (see [Database Schema (SQL)](#database-schema-sql)).
3. Set **RLS** policies to restrict data by `user_id`.
4. Create the **Hasura Action** `sendMessage` (see [Hasura Action (SDL)](#hasura-action-sdl)).
5. Deploy your **n8n** workflow and set the action handler endpoint to your n8n webhook.

### 3) Environment Variables

Create a `.env.local` in the project root (see [Environment Variables](#environment-variables)).

### 4) Run the App

```bash
npm run dev
```

---

## Environment Variables

Create `.env.local`:

```bash
VITE_NHOST_SUBDOMAIN=your-nhost-subdomain
VITE_NHOST_REGION=your-nhost-region
# Optional: Feature flags, UI settings, etc.
VITE_APP_NAME=Subspace Pro
```

> **Note:** OpenRouter & other secrets live **only** in n8n / server envs. Never expose them in the frontend.

---

## Database Schema (SQL)

> Run this SQL in Nhost (Hasura) to create base tables. Adjust names/constraints as needed.

```sql
-- users come from Nhost Auth (auth.users table)
-- local tables for chats and messages

create table public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null default 'New Chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.chats (user_id, created_at desc);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  user_id uuid not null,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- optional metadata (token counts, model name, etc.)
  meta jsonb not null default '{}'
);

create index on public.messages (chat_id, created_at asc);

-- Row Level Security
alter table public.chats enable row level security;
alter table public.messages enable row level security;

-- Policies: only owners may SELECT/INSERT/UPDATE/DELETE
create policy "chats_owner_select"
on public.chats for select
using (user_id = auth.uid());

create policy "chats_owner_modify"
on public.chats for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "messages_owner_select"
on public.messages for select
using (user_id = auth.uid());

create policy "messages_owner_modify"
on public.messages for all
using (user_id = auth.uid())
with check (user_id = auth.uid());
```

---

## Hasura Action (SDL)

> Define an action that the frontend calls to send a message. Hasura forwards to n8n.

```graphql
type Mutation {
  sendMessage(input: SendMessageInput!): SendMessageOutput!
}

input SendMessageInput {
  chat_id: uuid!
  content: String!
}

type SendMessageOutput {
  message_id: uuid!
  reply_id: uuid!
  reply: String!
}
```

**Action Handler (Webhook):**

* Method: `POST`
* URL: `https://your-n8n-host/webhook/send-message`
* Forward **Authorization** header to n8n (so n8n can verify user via Hasura/Nhost).

**Sample Subscription (Realtime UI):**

```graphql
subscription MessagesByChat($chat_id: uuid!) {
  messages(where: {chat_id: {_eq: $chat_id}}, order_by: {created_at: asc}) {
    id
    role
    content
    created_at
    meta
  }
}
```

---

## n8n Workflow (High Level)

1. **Webhook (Trigger):** Receives `chat_id`, `content`, and **Authorization**.
2. **Validate User:** Hit Hasura with the same auth header; ensure `chat_id` belongs to `auth.uid()`.
3. **Fetch Context:** Query last N messages for context.
4. **Call OpenRouter:** Send prompt + context to model (Gemma/Mistral); keep API key secret in n8n.
5. **Persist Reply:** Insert assistant message back into `public.messages` (mutation).
6. **Respond:** Return `{ message_id, reply_id, reply }` to the Hasura Action response.

> Keep retries, timeouts, and token/length guards in place to avoid runaway costs.

---

## Security Notes

* **No AI keys in the client.** All secrets live in **n8n** server envs.
* **RLS everywhere.** All `SELECT/INSERT/UPDATE/DELETE` actions constrained by `auth.uid()`.
* **Action boundary.** The only path from UI → AI is via **Hasura Action → n8n**.
* **Rate limiting (recommended).** Add per-user throttling in n8n or via an API gateway.

---

## Project Structure

```
my-chatbot-app/
├─ src/
│  ├─ components/        # UI components (ChatList, MessageView, Editor, etc.)
│  ├─ pages/             # Route-level pages
│  ├─ graphql/           # Queries, mutations, subscriptions, fragments
│  ├─ hooks/             # React hooks (auth, subscriptions, etc.)
│  ├─ lib/               # Client setup (Nhost, GraphQL client)
│  ├─ styles/            # Tailwind, globals
│  └─ main.tsx           # App entry
├─ public/               # Static assets
├─ docs/                 # Screenshots/GIFs/diagrams
├─ .env.local            # Local env (not committed)
├─ index.html
├─ vite.config.ts
└─ package.json
```

---

## Roadmap

* [ ] Message search & filters
* [ ] File uploads with AI analysis (Cloudinary/S3)
* [ ] Multi-chat streaming & tool use
* [ ] Per-chat system prompts & memory controls
* [ ] Export chats (Markdown/JSON)

---

## License

This project is provided for assessment and demonstration purposes. Add your preferred license here (e.g., MIT).

---

### Credits

* Built with ❤️ using **React**, **Tailwind**, **Framer Motion**, **Nhost**, **Hasura**, **n8n**, and **OpenRouter**.
* Inspired by leading AI chat UX patterns.

> **Paste this entire Markdown into your `README.md` and replace placeholders (links, envs, screenshots) as needed.**
