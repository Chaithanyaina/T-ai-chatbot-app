# Subspace Pro AI Assistant 🚀

A full-stack, real-time, and secure AI chatbot application built to showcase modern web development practices. This project was created as part of the Intern Assessment for Subspace.

---

### **✨ Live Demo & Showcase**

* **Deployed Site:** `https://subspaceaichatbot.netlify.app/`
* **Video Walkthrough:** `https://tinyurl.com/44fpbw33`

---
## About The Project

**Subspace Pro** is a sophisticated AI assistant designed for real-time, intelligent conversations. The application is built from the ground up on a modern, serverless, GraphQL-native architecture. It features a polished, responsive user interface with advanced conversational features like chat history management, markdown rendering, and the ability to edit and regenerate responses.

The entire project adheres strictly to the assignment's requirements, focusing on security, a GraphQL-only API, and a clean separation of concerns between the frontend and a secure automation backend.

---
## Core Technologies

* **Frontend:** React (Vite), Tailwind CSS, Framer Motion
* **Backend as a Service (BaaS):** Nhost
* **Authentication:** Nhost Auth
* **Database:** Postgres (via Nhost)
* **API Layer:** Hasura GraphQL (real-time via Subscriptions)
* **Automation/AI Middleware:** n8n
* **AI Model:** OpenRouter (Google Gemma / Mistral 7B)
* **Deployment:** Netlify

---
## Key Features

* ✅ **Secure Authentication:** Full email/password sign-in and sign-up flow.
* ✅ **Data Privacy:** Strict Row-Level Security (RLS) ensures users can only ever access their own chat data.
* ✅ **Real-time Messaging:** A live chat experience built with GraphQL Subscriptions.
* ✅ **Intelligent AI:** The "Subspace Pro" assistant has conversational memory and is powered by advanced prompt engineering.
* ✅ **Rich Text Formatting:** Full Markdown rendering for chatbot responses, including styled code blocks with a "copy-to-clipboard" function.
* ✅ **Advanced Chat Controls:**
    * Edit and rename chat titles.
    * Delete chats with a confirmation step.
    * Edit your last message and regenerate the AI's response.
* ✅ **Polished UI/UX:**
    * A clean, modern interface inspired by leading AI applications.
    * Fully responsive design for desktop and mobile.
    * Toggable sidebar for a focused chat experience.
    * Seamless light and dark mode support.
    * Smooth animations and transitions with Framer Motion.

---
## System Architecture

The application follows a secure, decoupled architecture that prioritizes safety and best practices.

1.  **Frontend (React):** The user interacts with the React application deployed on Netlify. All communication with the backend is exclusively through GraphQL.
2.  **API & Database (Hasura/Nhost):** Hasura provides an instant, real-time GraphQL API over a Postgres database. All requests are authenticated, and Nhost's RLS policies enforce strict data isolation.
3.  **Chatbot Logic (n8n):** To protect sensitive API keys, the frontend **never** calls the AI directly. Instead, it calls a Hasura Action, which triggers a secure webhook to an **n8n workflow**.
4.  **Secure Middleware:** The n8n workflow acts as a secure backend service. It receives the request, validates the user, fetches chat history, calls the external OpenRouter AI, saves the response back to the database via a GraphQL mutation, and returns the final reply. This ensures all secrets and complex business logic are kept safely on the server.

---
## Local Development Setup

To run this project locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Chaithanyaina/T-ai-chatbot-app.git
    cd T-ai-chatbot-app
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up the Backend:**
    * Create a new project on [Nhost](https://nhost.io).
    * Run the provided SQL to create the `chats` and `messages` tables.
    * Configure the required permissions and the Hasura Action.
    * Set up and activate the n8n workflow.

4.  **Configure Environment Variables:**
    * Create a `.env.local` file in the root of the project.
    * Add your Nhost project's details:
        ```
        VITE_NHOST_SUBDOMAIN=your-nhost-subdomain
        VITE_NHOST_REGION=your-nhost-region
        ```

5.  **Run the application:**
    ```bash
    npm run dev
    ```

    
6.  **Future Enhancements**

The current application serves as a robust and feature-complete foundation. The following enhancements are planned to further expand its capabilities:

* **File and Image Uploads:** Integrate Nhost Storage to allow users to upload images and documents. This would be coupled with a multi-modal AI model, enabling the chatbot to analyze, summarize, and discuss the content of the uploaded files.

* **Global Chat Search:** Implement a powerful, full-text search functionality, allowing users to instantly find specific messages or information across their entire conversation history.

* **Deep Personal Finance Integration:** Further develop the "Subspace Pro" persona into an indispensable financial assistant by adding specialized tools. This could include features for:
    * Analyzing spending patterns from uploaded bank statements.
    * Tracking subscription price changes over time.
    * Offering proactive savings advice based on user data.