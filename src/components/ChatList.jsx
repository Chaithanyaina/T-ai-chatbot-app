import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { GET_CHATS_QUERY } from '../graphql/queries';
import { CREATE_CHAT_MUTATION } from '../graphql/mutations';
import { Loader2, PlusCircle } from 'lucide-react';
import clsx from 'clsx';
import { Toaster, toast } from 'react-hot-toast';

const ChatList = ({ selectedChatId, onSelectChat }) => {
  const { data, loading, error } = useQuery(GET_CHATS_QUERY);
  const [createChat, { loading: creatingChat }] = useMutation(CREATE_CHAT_MUTATION, {
    refetchQueries: [{ query: GET_CHATS_QUERY }],
    onCompleted: (data) => {
      onSelectChat(data.insert_chats_one.id);
      toast.success('New chat created!');
    },
    onError: (err) => {
      toast.error(`Error creating chat: ${err.message}`);
    },
  });

  const handleNewChat = () => {
    const newChatTitle = `Chat - ${new Date().toLocaleTimeString()}`;
    createChat({ variables: { title: newChatTitle } });
  };

  if (loading) return <div className="p-4"><Loader2 className="animate-spin" /></div>;
  if (error) return <div className="p-4 text-red-500">Error: {error.message}</div>;

  return (
    <div className="w-1/4 bg-gray-100 border-r border-gray-200 h-screen flex flex-col">
      <Toaster />
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-bold">Chats</h2>
        <button onClick={handleNewChat} disabled={creatingChat} className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50">
          {creatingChat ? <Loader2 className="animate-spin" /> : <PlusCircle />}
        </button>
      </div>
      <div className="overflow-y-auto flex-grow">
        {data?.chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={clsx(
              'p-4 cursor-pointer hover:bg-gray-200 border-b border-gray-200',
              { 'bg-blue-100 hover:bg-blue-200': selectedChatId === chat.id }
            )}
          >
            <p className="font-semibold truncate">{chat.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatList;