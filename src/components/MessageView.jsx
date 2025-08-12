import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useSubscription } from '@apollo/client';
import { MESSAGES_SUBSCRIPTION } from '../graphql/subscriptions';
import { INSERT_USER_MESSAGE_MUTATION, SEND_MESSAGE_ACTION } from '../graphql/mutations';
import { Loader2, SendHorizonal, User, Bot } from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'react-hot-toast';

const MessageView = ({ chatId }) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const { data, loading, error } = useSubscription(MESSAGES_SUBSCRIPTION, {
    variables: { chat_id: chatId },
    skip: !chatId,
  });

  const [insertUserMessage] = useMutation(INSERT_USER_MESSAGE_MUTATION);
  const [sendMessageAction, { loading: sendingMessage }] = useMutation(SEND_MESSAGE_ACTION, {
     onError: (err) => {
        toast.error(`Chatbot error: ${err.message}`);
     }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [data]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || sendingMessage) return;

    const messageContent = newMessage;
    setNewMessage('');

    try {
      await insertUserMessage({
        variables: { chat_id: chatId, content: messageContent },
      });
      await sendMessageAction({
        variables: { chat_id: chatId, message: messageContent },
      });
    } catch (err) {
      toast.error(`Failed to send message: ${err.message}`);
      setNewMessage(messageContent); // Restore message on failure
    }
  };

  if (!chatId) {
    return <div className="flex-grow flex items-center justify-center text-gray-500">Select a chat to start messaging</div>;
  }
  if (loading) return <div className="flex-grow flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (error) return <div className="flex-grow p-4 text-red-500">Error: {error.message}</div>;

  return (
    <div className="flex-grow flex flex-col h-screen">
      <div className="flex-grow p-6 overflow-y-auto">
        <div className="space-y-4">
          {data?.messages.map((msg) => (
            <div key={msg.id} className={clsx('flex items-start gap-3', { 'justify-end': msg.role === 'user' })}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white flex-shrink-0">
                  <Bot size={20} />
                </div>
              )}
              <div className={clsx(
                'p-3 rounded-lg max-w-lg',
                { 'bg-blue-500 text-white': msg.role === 'user', 'bg-gray-200 text-gray-800': msg.role === 'assistant' }
              )}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
               {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white flex-shrink-0">
                  <User size={20} />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-4 bg-white border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" disabled={!newMessage.trim() || sendingMessage} className="p-2 bg-blue-500 text-white rounded-lg disabled:bg-blue-300">
            {sendingMessage ? <Loader2 className="animate-spin" /> : <SendHorizonal />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MessageView;