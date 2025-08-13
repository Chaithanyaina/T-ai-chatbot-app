import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useMutation, useSubscription } from '@apollo/client';
import { useUserData } from '@nhost/react';
import { MESSAGES_SUBSCRIPTION } from '../graphql/subscriptions';
import {
  INSERT_USER_MESSAGE_MUTATION,
  SEND_MESSAGE_ACTION,
  UPDATE_MESSAGE_MUTATION,
  DELETE_MESSAGE_MUTATION
} from '../graphql/mutations';
import { Loader2, SendHorizonal, Copy, Pencil, Menu as MenuIcon } from 'lucide-react';
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
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const userData = useUserData();

  /** Auto-resize textarea **/
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [newMessage]);

  /** Subscriptions **/
  const { data, loading, error } = useSubscription(MESSAGES_SUBSCRIPTION, {
    variables: { chat_id: chatId },
    skip: !chatId,
  });

  /** Mutations **/
  const [insertUserMessage] = useMutation(INSERT_USER_MESSAGE_MUTATION);
  const [sendMessageAction, { loading: sendingMessage }] = useMutation(SEND_MESSAGE_ACTION, {
    onError: (err) => toast.error(`Chatbot error: ${err.message}`),
  });

  const [updateMessage] = useMutation(UPDATE_MESSAGE_MUTATION);
  const [deleteMessage] = useMutation(DELETE_MESSAGE_MUTATION, {
    update(cache, { data: { delete_messages_by_pk } }) {
      const normalizedId = cache.identify({
        id: delete_messages_by_pk.id,
        __typename: 'messages'
      });
      cache.evict({ id: normalizedId });
      cache.gc();
    }
  });

  /** Last messages **/
  const { lastUserMessage, lastAssistantMessage } = useMemo(() => {
    if (!data?.messages || data.messages.length === 0) return {};
    const messages = [...data.messages].reverse();
    return {
      lastUserMessage: messages.find((m) => m.role === 'user'),
      lastAssistantMessage: messages.find((m) => m.role === 'assistant')
    };
  }, [data]);

  /** Scroll to bottom **/
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(scrollToBottom, [data, sendingMessage]);

  /** Send Message **/
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || sendingMessage) return;
    const messageContent = newMessage;
    setNewMessage('');
    try {
      await insertUserMessage({ variables: { chat_id: chatId, content: messageContent } });
      await sendMessageAction({ variables: { chat_id: chatId, message: String(messageContent) } });
    } catch (err) {
      toast.error(`Failed to send message: ${err.message}`);
      setNewMessage(messageContent);
    }
  };

  /** Edit & Resend **/
  const handleEditSubmit = async () => {
    if (!editingMessageId || !editedContent.trim()) {
      setEditingMessageId(null);
      return;
    }
    try {
      if (
        lastAssistantMessage &&
        new Date(lastAssistantMessage.created_at) > new Date(lastUserMessage.created_at)
      ) {
        await deleteMessage({ variables: { id: lastAssistantMessage.id } });
      }
      await updateMessage({
        variables: { id: editingMessageId, content: editedContent }
      });
      await sendMessageAction({
        variables: { chat_id: chatId, message: String(editedContent) }
      });
    } catch (err) {
      toast.error(`Error regenerating response: ${err.message}`);
    } finally {
      setEditingMessageId(null);
    }
  };

  /** Empty State **/
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
            I'm Subspace Pro, your personal assistant.
          </p>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Select a chat on the left to get started.
          </p>
        </div>
      </div>
    );
  }

  /** Loading / Error **/
  if (loading)
    return (
      <div className="flex-grow flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  if (error)
    return (
      <div className="flex-grow p-4 text-red-500 h-full">Error: {error.message}</div>
    );

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
            {data?.messages.map((msg) => (
              <motion.div
                key={msg.id}
                className={clsx('flex items-start gap-4 group w-full', {
                  'justify-end': msg.role === 'user'
                })}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {msg.role === 'user' &&
                  msg.id === lastUserMessage?.id &&
                  editingMessageId !== msg.id && (
                    <button
                      onClick={() => {
                        setEditingMessageId(msg.id);
                        setEditedContent(msg.content);
                      }}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                {msg.role === 'assistant' && <Avatar role="assistant" />}

                <div
                  className={clsx(
                    'p-4 rounded-lg shadow-sm max-w-xl', // bubble sizing change
                    {
                      'bg-blue-600 text-white': msg.role === 'user',
                      'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200':
                        msg.role === 'assistant'
                    }
                  )}
                >
                  {editingMessageId === msg.id ? (
                    <textarea
                    
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      onBlur={handleEditSubmit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleEditSubmit();
                        }
                      }}
                      autoFocus
                      className="w-full p-4 pr-14 bg-gray-100 dark:bg-[#1e1e1e] border-2 border-transparent focus:border-blue-500 rounded-lg focus:outline-none focus:ring-0 transition-shadow text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                      rows={Math.min(10, editedContent.split('\n').length)}
                    />
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <MessageContent content={msg.content} />
                    </div>
                  )}
                </div>
                {msg.role === 'user' && <Avatar role="user" userData={userData} />}
              </motion.div>
            ))}
          </AnimatePresence>

          {sendingMessage && (
            <motion.div
              className="flex items-start gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Avatar role="assistant" />
              <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 shadow-sm">
                <motion.div
                  className="flex gap-1.5"
                  initial="hidden"
                  animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.2 } } }}
                >
                  {[0, 0.1, 0.2].map((delay) => (
                    <motion.span
                      key={delay}
                      variants={{ visible: { y: [0, -2, 0] }, hidden: { y: 0 } }}
                      transition={{ duration: 0.5, repeat: Infinity, delay }}
                      className="w-2 h-2 bg-gray-400 rounded-full"
                    />
                  ))}
                </motion.div>
              </div>
            </motion.div>
          )}

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
              placeholder="Ask about anything..."
              className="w-full p-4 pr-14 bg-gray-100 dark:bg-[#1e1e1e] border-2 border-transparent focus:border-blue-500 rounded-lg focus:outline-none focus:ring-0 transition-shadow text-gray-800 dark:text-gray-200 resize-none"
              style={{ maxHeight: '200px' }}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sendingMessage}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg disabled:bg-blue-400 disabled:dark:bg-blue-800 transition-colors"
            >
              {sendingMessage ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <SendHorizonal size={20} />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MessageView;
