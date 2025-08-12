import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useMutation, useSubscription } from '@apollo/client';
import { MESSAGES_SUBSCRIPTION } from '../graphql/subscriptions';
import { 
  INSERT_USER_MESSAGE_MUTATION, 
  SEND_MESSAGE_ACTION,
  UPDATE_MESSAGE_MUTATION,
  DELETE_MESSAGE_MUTATION
} from '../graphql/mutations';
import { Loader2, SendHorizonal, User, Bot, Copy, Pencil } from 'lucide-react';
import clsx from 'clsx';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';

const MessageContent = ({ content }) => {
  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard!');
  };

  return (
    <ReactMarkdown
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const codeText = String(children).replace(/\n$/, '');
          
          if (inline) {
            return (
              <code className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded text-sm" {...props}>
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
            <code className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded" {...props}>
              {children}
            </code>
          );
        },
        p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
        a: ({node, ...props}) => (
          <a className="text-blue-600 dark:text-blue-400 hover:underline" {...props} />
        ),
        ul: ({node, ...props}) => (
          <ul className="list-disc pl-5 mb-2" {...props} />
        ),
        ol: ({node, ...props}) => (
          <ol className="list-decimal pl-5 mb-2" {...props} />
        ),
        blockquote: ({node, ...props}) => (
          <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-600 dark:text-gray-300 mb-2" {...props} />
        )
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

const MessageView = ({ chatId }) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editedContent, setEditedContent] = useState('');

  const { data, loading, error } = useSubscription(MESSAGES_SUBSCRIPTION, {
    variables: { chat_id: chatId },
    skip: !chatId,
  });

  const [insertUserMessage] = useMutation(INSERT_USER_MESSAGE_MUTATION);
  const [sendMessageAction, { loading: sendingMessage }] = useMutation(SEND_MESSAGE_ACTION, {
    onError: (err) => toast.error(`Chatbot error: ${err.message}`),
  });
  
  const [updateMessage] = useMutation(UPDATE_MESSAGE_MUTATION);
  const [deleteMessage] = useMutation(DELETE_MESSAGE_MUTATION, {
    update(cache, { data: { delete_messages_by_pk } }) {
      const normalizedId = cache.identify({ id: delete_messages_by_pk.id, __typename: 'messages' });
      cache.evict({ id: normalizedId });
      cache.gc();
    }
  });

  const { lastUserMessage, lastAssistantMessage } = useMemo(() => {
    if (!data?.messages || data.messages.length === 0) {
      return {};
    }
    const messages = [...data.messages].reverse();
    const lastUserMessage = messages.find(m => m.role === 'user');
    const lastAssistantMessage = messages.find(m => m.role === 'assistant');
    return { lastUserMessage, lastAssistantMessage };
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
      await insertUserMessage({ 
        variables: { chat_id: chatId, content: messageContent } 
      });
      await sendMessageAction({ 
        variables: { chat_id: chatId, message: String(messageContent) } 
      });
    } catch (err) {
      toast.error(`Failed to send message: ${err.message}`);
      setNewMessage(messageContent);
    }
  };

  const handleEditSubmit = async () => {
    if (!editingMessageId || !editedContent.trim()) {
      setEditingMessageId(null);
      return;
    }

    try {
      if (lastAssistantMessage && new Date(lastAssistantMessage.created_at) > new Date(lastUserMessage.created_at)) {
        await deleteMessage({ variables: { id: lastAssistantMessage.id } });
      }
      
      await updateMessage({ 
        variables: { id: editingMessageId, content: editedContent } 
      });
      
      await sendMessageAction({ 
        variables: { chat_id: chatId, message: String(editedContent) } 
      });

    } catch(err) {
      toast.error(`Error regenerating response: ${err.message}`);
    } finally {
      setEditingMessageId(null);
    }
  };
  
  if (!chatId) {
    return (
      <div className="flex-grow flex items-center justify-center bg-white dark:bg-gray-800 text-gray-500">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Welcome to your Chatbot</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Select a chat on the left or create a new one to begin.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-white dark:bg-gray-800">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-grow p-4 text-red-500 bg-white dark:bg-gray-800">
        Error: {error.message}
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col h-screen bg-white dark:bg-gray-800">
      <Toaster position="top-center" />
      <div className="flex-grow overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
          <AnimatePresence>
            {data?.messages.map((msg) => (
              <motion.div 
                key={msg.id} 
                className={clsx('flex items-start gap-4 group', { 
                  'justify-end': msg.role === 'user' 
                })}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {msg.role === 'user' && msg.id === lastUserMessage?.id && editingMessageId !== msg.id && (
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

                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gray-600 dark:bg-gray-700 flex items-center justify-center text-white flex-shrink-0">
                    <Bot size={20} />
                  </div>
                )}

                <div className={clsx(
                  'prose prose-sm max-w-3xl rounded-lg shadow-sm w-full',
                  { 
                    'bg-blue-600 text-white prose-invert': msg.role === 'user', 
                    'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-3': msg.role === 'assistant' 
                  },
                  { 'p-3': msg.role === 'user'}
                )}>
                  {editingMessageId === msg.id ? (
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      onBlur={handleEditSubmit}
                      onKeyDown={(e) => { 
                        if(e.key === 'Enter' && !e.shiftKey) { 
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

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white flex-shrink-0">
                    <User size={20} />
                  </div>
                )}
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
              <div className="w-8 h-8 rounded-full bg-gray-600 dark:bg-gray-700 flex items-center justify-center text-white flex-shrink-0">
                <Bot size={20} />
              </div>
              <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 shadow-sm">
                <motion.div 
                  className="flex gap-1.5" 
                  initial="hidden" 
                  animate="visible" 
                  variants={{ 
                    visible: { transition: { staggerChildren: 0.2 } } 
                  }}
                >
                  <motion.span 
                    variants={{ 
                      visible: { y: [0, -2, 0] }, 
                      hidden: { y: 0 } 
                    }} 
                    transition={{ duration: 0.5, repeat: Infinity }} 
                    className="w-2 h-2 bg-gray-400 rounded-full" 
                  />
                  <motion.span 
                    variants={{ 
                      visible: { y: [0, -2, 0] }, 
                      hidden: { y: 0 } 
                    }} 
                    transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }} 
                    className="w-2 h-2 bg-gray-400 rounded-full" 
                  />
                  <motion.span 
                    variants={{ 
                      visible: { y: [0, -2, 0] }, 
                      hidden: { y: 0 } 
                    }} 
                    transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }} 
                    className="w-2 h-2 bg-gray-400 rounded-full" 
                  />
                </motion.div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex items-center gap-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full p-3 bg-gray-100 dark:bg-gray-700 border border-transparent focus:border-blue-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 transition-shadow"
            />
            <button 
              type="submit" 
              disabled={!newMessage.trim() || sendingMessage} 
              className="p-3 bg-blue-600 text-white rounded-lg disabled:bg-blue-400 disabled:dark:bg-blue-800 transition-colors flex-shrink-0"
            >
              {sendingMessage ? (
                <Loader2 className="animate-spin" />
              ) : (
                <SendHorizonal />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MessageView;