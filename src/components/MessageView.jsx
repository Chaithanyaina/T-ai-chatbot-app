import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useSubscription } from '@apollo/client';
import { useUserData, useNhostClient } from '@nhost/react';
import { MESSAGES_SUBSCRIPTION } from '../graphql/subscriptions';
import {
  INSERT_USER_MESSAGE_MUTATION
} from '../graphql/mutations';
import { Loader2, SendHorizonal, Copy, Menu as MenuIcon } from 'lucide-react';
import clsx from 'clsx';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import Avatar from './Avatar';

/** ---------- MessageContent Component ---------- **/
const MessageContent = ({ content }) => {
  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard!');
  };

  return (
    <ReactMarkdown
      components={{
        code({ inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const codeText = String(children).replace(/\n$/, '');

          if (inline) {
            return (
              <code
                className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded text-sm"
                {...props}
              >
                {children}
              </code>
            );
          }

          return match ? (
            <div className="my-2 bg-[#1e1e1e] rounded-lg overflow-hidden">
              <div className="flex justify-between items-center px-4 py-1 bg-gray-700 text-gray-300 text-xs">
                <span>{match[1]}</span>
                <button
                  onClick={() => handleCopy(codeText)}
                  className="flex items-center gap-1 hover:text-white"
                >
                  <Copy size={14} />
                  Copy
                </button>
              </div>
              <SyntaxHighlighter
                language={match[1]}
                style={vscDarkPlus}
                customStyle={{ margin: 0, padding: '1rem' }}
                {...props}
              >
                {codeText}
              </SyntaxHighlighter>
            </div>
          ) : (
            <code
              className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded"
              {...props}
            >
              {children}
            </code>
          );
        },
        p: ({ ...props }) => <p className="mb-2 last:mb-0" {...props} />,
        a: ({ ...props }) => (
          <a className="text-blue-600 dark:text-blue-400 hover:underline" {...props} />
        ),
        ul: ({ ...props }) => <ul className="list-disc pl-5 mb-2" {...props} />,
        ol: ({ ...props }) => <ol className="list-decimal pl-5 mb-2" {...props} />,
        blockquote: ({ ...props }) => (
          <blockquote
            className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-600 dark:text-gray-300 mb-2"
            {...props}
          />
        )
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

/** ---------- Main Component ---------- **/
const MessageView = ({ chatId, isSidebarOpen, setIsSidebarOpen }) => {
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const userData = useUserData();
  const nhost = useNhostClient();

  /** Subscription for messages **/
  const { loading, error } = useSubscription(MESSAGES_SUBSCRIPTION, {
    variables: { chat_id: chatId },
    skip: !chatId,
    onData: ({ data }) => {
      setMessages(data.data.messages);
    }
  });

  /** Mutation for inserting a message **/
  const [insertUserMessage] = useMutation(INSERT_USER_MESSAGE_MUTATION);

  /** Scroll to bottom on new messages **/
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(scrollToBottom, [messages]);

  /** Handle sending a message with streaming response **/
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId) return;

    const messageContent = newMessage;
    setNewMessage('');

    // 1. Save user message to DB
    const { data: userMessageData } = await insertUserMessage({
      variables: { chat_id: chatId, content: messageContent }
    });
    const userMessageId = userMessageData.insert_messages_one.id;

    // Optimistic update
    setMessages((prev) => [
      ...prev,
      { id: userMessageId, role: 'user', content: messageContent }
    ]);

    // 2. Add placeholder assistant message
    let assistantMessageId = `assistant-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: assistantMessageId, role: 'assistant', content: '▋' }
    ]);

    let fullResponse = '';

    try {
      // 3. Call serverless streaming endpoint
      const response = await fetch(nhost.functions.url('stream-chat'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${nhost.auth.getAccessToken()}`
        },
        body: JSON.stringify({
          messages: messages.map(({ role, content }) => ({ role, content }))
        })
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // 4. Process stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6);
            if (dataStr.trim() === '[DONE]') break;

            try {
              const parsedData = JSON.parse(dataStr);
              const delta = parsedData.choices[0]?.delta?.content || '';
              fullResponse += delta;

              // Update UI with streaming content
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, content: fullResponse + '▋' }
                    : m
                )
              );
            } catch {
              // Ignore malformed lines
            }
          }
        }
      }
    } catch (err) {
      toast.error(`Error streaming response: ${err.message}`);
      setMessages((prev) => prev.filter((m) => m.id !== assistantMessageId));
      return;
    } finally {
      // Finalize message (remove ▋)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId ? { ...m, content: fullResponse } : m
        )
      );
    }

    // 5. Save final assistant message to DB
    await insertUserMessage({
      variables: { chat_id: chatId, content: fullResponse, role: 'assistant' }
    });
  };

  /** Empty state **/
  if (!chatId) {
    return (
      <div className="flex-grow flex items-center justify-center h-full text-gray-500 relative">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-4 left-4 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 md:hidden"
        >
          <MenuIcon size={24} />
        </button>
        <div className="text-center">
          <img src="/logo.png" alt="Subspace Logo" className="w-48 mx-auto mb-4" />
          <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200">
            Hi, {userData?.displayName || 'there'}!
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            I'm Subspace Pro, your personal finance assistant.
          </p>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Select a chat on the left to get started.
          </p>
        </div>
      </div>
    );
  }

  /** Loading & Error states **/
  if (loading)
    return (
      <div className="flex-grow flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  if (error)
    return <div className="flex-grow p-4 text-red-500 h-full">Error: {error.message}</div>;

  /** Main UI **/
  return (
    <div className="flex-grow flex flex-col h-screen relative bg-white dark:bg-[#171717]">
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800"
        >
          <MenuIcon size={24} />
        </button>
      </div>
      <Toaster position="top-center" />
      <div className="flex-grow overflow-y-auto">
        <div className="max-w-4xl w-full mx-auto px-4 pt-20 pb-10 space-y-8">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                className={clsx('flex items-start gap-4 group w-full', {
                  'justify-end': msg.role === 'user'
                })}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {msg.role === 'assistant' && <Avatar role="assistant" />}
                <div
                  className={clsx('p-4 rounded-lg shadow-sm max-w-xl', {
                    'bg-blue-600 text-white': msg.role === 'user',
                    'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200':
                      msg.role === 'assistant'
                  })}
                >
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <MessageContent content={msg.content} />
                  </div>
                </div>
                {msg.role === 'user' && <Avatar role="user" userData={userData} />}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="p-4 bg-transparent w-full">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <textarea
              ref={textareaRef}
              rows={1}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Ask about managing your subscriptions..."
              className="w-full p-4 pr-14 bg-gray-100 dark:bg-[#1e1e1e] border-2 border-transparent focus:border-blue-500 rounded-lg focus:outline-none focus:ring-0 transition-shadow text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none"
              style={{ maxHeight: '200px' }}
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg disabled:bg-blue-400 disabled:dark:bg-blue-800 transition-colors"
            >
              <SendHorizonal size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MessageView;
