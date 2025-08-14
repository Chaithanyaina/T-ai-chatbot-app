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
import {
  Loader2,
  SendHorizonal,
  Copy,
  Pencil,
  Menu as MenuIcon,
  Zap,
  ShieldCheck,
  BrainCircuit
} from 'lucide-react';
import clsx from 'clsx';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import Avatar from './Avatar';
const MessageContent = ({ content }) => {
  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard!');
  };

  return (
    // FIX: The 'className' is now on this parent div, not on ReactMarkdown
    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:text-gray-800 dark:prose-p:text-gray-200 prose-li:text-gray-800 dark:prose-li:text-gray-200 prose-strong:text-gray-900 dark:prose-strong:text-white">
      <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const codeText = String(children).replace(/\n$/, '');
            if (inline) {
              return <code className="bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded text-sm" {...props}>{children}</code>;
            }
            return match ? (
              <div className="my-2 bg-[#1e1e1e] rounded-lg overflow-hidden border border-gray-700">
                <div className="flex justify-between items-center px-4 py-1 bg-gray-700/50 text-gray-300 text-xs">
                  <span>{match[1]}</span>
                  <button onClick={() => handleCopy(codeText)} className="flex items-center gap-1.5 hover:text-white transition-colors"><Copy size={14} />Copy</button>
                </div>
                <SyntaxHighlighter language={match[1]} style={vscDarkPlus} customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }} {...props}>{codeText}</SyntaxHighlighter>
              </div>
            ) : (
              <code className="bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded" {...props}>{children}</code>
            );
          },
          p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
const FeatureCard = ({ icon, title, description, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="bg-white dark:bg-secondary/50 p-4 rounded-lg border border-gray-200 dark:border-border text-center"
  >
    {icon}
    <h3 className="mt-2 font-semibold text-gray-800 dark:text-foreground">{title}</h3>
    <p className="mt-1 text-xs text-gray-500 dark:text-muted-foreground">{description}</p>
  </motion.div>
);

const MessageView = ({ chatId, isSidebarOpen, setIsSidebarOpen }) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const userData = useUserData();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [newMessage]);

  const { data, loading, error } = useSubscription(MESSAGES_SUBSCRIPTION, {
    variables: { chat_id: chatId },
    skip: !chatId
  });

  const [insertUserMessage] = useMutation(INSERT_USER_MESSAGE_MUTATION);
  const [sendMessageAction, { loading: sendingMessage }] = useMutation(SEND_MESSAGE_ACTION, {
    onError: (err) => toast.error(`Chatbot error: ${err.message}`)
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

  const { lastUserMessage } = useMemo(() => {
    if (!data?.messages || data.messages.length === 0) return {};
    const messages = [...data.messages].reverse();
    return {
      lastUserMessage: messages.find((m) => m.role === 'user')
    };
  }, [data]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [data, sendingMessage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || sendingMessage) return;
    const messageContent = newMessage;
    setNewMessage('');
    try {
      await insertUserMessage({ variables: { chat_id: chatId, content: messageContent } });
      await sendMessageAction({
        variables: { chat_id: chatId, message: String(messageContent) }
      });
    } catch (err) {
      toast.error(`Failed to send message: ${err.message}`);
      setNewMessage(messageContent);
    }
  };

  const handleEditSubmit = async () => {
    if (!editedContent.trim()) return;
    try {
      await updateMessage({
        variables: { id: editingMessageId, content: editedContent }
      });
      setEditingMessageId(null);
      setEditedContent('');
    } catch (err) {
      toast.error(`Failed to update message: ${err.message}`);
    }
  };

  if (!chatId) {
    return (
      <div className="flex-grow flex items-center justify-center h-full relative">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-4 left-4 p-2 rounded-md text-gray-500 dark:text-muted-foreground hover:bg-gray-100 dark:hover:bg-accent"
        >
          <MenuIcon size={24} />
        </button>
        <div className="text-center max-w-lg">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-5xl font-bold text-gray-900 dark:text-foreground"
          >
            Meet Subspace Pro
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 text-gray-600 dark:text-muted-foreground"
          >
            Your versatile AI assistant, ready to tackle any task.
          </motion.p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <FeatureCard
              icon={<BrainCircuit className="mx-auto h-6 w-6 text-primary" />}
              title="Advanced Reasoning"
              description="Handles complex logic, coding problems, and creative tasks."
              delay={0.4}
            />
            <FeatureCard
              icon={<Zap className="mx-auto h-6 w-6 text-primary" />}
              title="Lightning Fast"
              description="Real-time responses powered by a modern, serverless stack."
              delay={0.6}
            />
            <FeatureCard
              icon={<ShieldCheck className="mx-auto h-6 w-6 text-primary" />}
              title="Secure & Private"
              description="Your conversations are protected with database-level security."
              delay={0.8}
            />
          </div>
        </div>
      </div>
    );
  }

  if (loading)
    return (
      <div className="flex-grow flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  if (error)
    return (
      <div className="flex-grow p-4 text-destructive h-full">Error: {error.message}</div>
    );

  return (
    <div className="flex-grow flex flex-col h-screen relative">
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-md text-gray-500 dark:text-muted-foreground hover:bg-gray-100 dark:hover:bg-accent"
        >
          <MenuIcon size={24} />
        </button>
      </div>
      <Toaster />
      <div className="flex-grow overflow-y-auto">
        <div className="max-w-4xl w-full mx-auto px-4 pt-20 pb-10 space-y-8">
          <AnimatePresence>
            {data?.messages.map((msg) => (
              <motion.div
                key={msg.id}
                className={clsx('flex w-full', {
                  'justify-end': msg.role === 'user',
                  'justify-start': msg.role === 'assistant'
                })}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div
                  className={clsx('flex items-start gap-4 group', {
                    'flex-row-reverse': msg.role === 'user'
                  })}
                >
                  <Avatar role={msg.role} userData={userData} />
                  <div
                    className={clsx('p-4 rounded-xl shadow-md max-w-xl', {
                      'bg-blue-600 text-white': msg.role === 'user',
                      'bg-white dark:bg-secondary text-gray-900 dark:text-secondary-foreground':
                        msg.role === 'assistant'
                    })}
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
                        className="w-full bg-transparent outline-none text-white dark:text-gray-100 resize-none"
                        rows={Math.min(10, editedContent.split('\n').length)}
                      />
                    ) : (
                      <MessageContent content={msg.content} />
                    )}
                  </div>
                  {msg.role === 'user' &&
                    msg.id === lastUserMessage?.id &&
                    editingMessageId !== msg.id && (
                      <button
                        onClick={() => {
                          setEditingMessageId(msg.id);
                          setEditedContent(msg.content);
                        }}
                        className="p-1 self-center rounded opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 dark:text-muted-foreground hover:bg-gray-100 dark:hover:bg-accent"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                </div>
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
              <div className="p-3 rounded-lg bg-white dark:bg-secondary text-secondary-foreground shadow-md">
                <motion.div
                  className="flex gap-1.5"
                  initial="hidden"
                  animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.2 } } }}
                >
                  <motion.span
                    variants={{ visible: { y: [0, -2, 0] }, hidden: { y: 0 } }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="w-2 h-2 bg-muted-foreground rounded-full"
                  />
                  <motion.span
                    variants={{ visible: { y: [0, -2, 0] }, hidden: { y: 0 } }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }}
                    className="w-2 h-2 bg-muted-foreground rounded-full"
                  />
                  <motion.span
                    variants={{ visible: { y: [0, -2, 0] }, hidden: { y: 0 } }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }}
                    className="w-2 h-2 bg-muted-foreground rounded-full"
                  />
                </motion.div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
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
              placeholder="Message Subspace Pro..."
              className="w-full p-4 pr-16 bg-white dark:bg-secondary border border-gray-300 dark:border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-shadow text-gray-900 dark:text-foreground placeholder-gray-500 dark:placeholder-muted-foreground resize-none"
              style={{ maxHeight: '200px' }}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sendingMessage}
              className="absolute right-3.5 bottom-3 p-2 bg-primary text-primary-foreground rounded-lg disabled:bg-muted disabled:text-muted-foreground transition-colors"
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
