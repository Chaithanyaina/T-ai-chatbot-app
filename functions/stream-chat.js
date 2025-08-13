// functions/stream-chat.js

import { NhostClient } from '@nhost/nhost-js';

// Initialize Nhost client to verify the user's JWT
const nhost = new NhostClient({
  subdomain: process.env.NHOST_SUBDOMAIN,
  region: process.env.NHOST_REGION,
});

export default async (req, res) => {
  // 1. Check for POST method
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  // 2. Secure the function: Verify the user is authenticated
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send('Unauthorized');
  }

  const jwt = authHeader.replace('Bearer ', '');
  const { session, error: sessionError } = await nhost.auth.getSession({ jwt });

  if (sessionError || !session) {
    return res.status(401).send('Unauthorized');
  }

  // 3. Get the message history from the request body
  const { messages } = req.body;

  // 4. Call the OpenRouter API with streaming enabled
  const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'google/gemma-7b-it',
      messages,
      stream: true, // This is the key to enable streaming
    }),
  });

  // 5. Pipe the AI's streaming response directly back to our app
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Use the modern ReadableStream to pipe the data
  return aiResponse.body.pipeTo(
    new WritableStream({
      write(chunk) {
        res.write(chunk);
      },
      close() {
        res.end();
      },
    })
  );
};