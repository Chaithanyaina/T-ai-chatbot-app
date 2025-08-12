import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { GET_CHATS_QUERY } from '../graphql/queries';
import { CREATE_CHAT_MUTATION, UPDATE_CHAT_TITLE_MUTATION, DELETE_CHAT_MUTATION } from '../graphql/mutations';
import { useSignOut, useUserData } from '@nhost/react';
import { Loader2, PlusCircle, MoreHorizontal, LogOut, Trash2, Pencil, Sun, Moon } from 'lucide-react';
import clsx from 'clsx';
import { Toaster, toast } from 'react-hot-toast';
import { Menu } from '@headlessui/react';
import { motion } from 'framer-motion';
import ConfirmationModal from './ConfirmationModal';
import Avatar from './Avatar';

// Dark Mode Toggle Component
const ThemeToggle = () => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  return (
    <button onClick={toggleTheme} className="p-2 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
      {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  );
};


const ChatList = ({ selectedChatId, onSelectChat }) => {
  // ... (All logic remains the same)
  const { data, loading, error } = useQuery(GET_CHATS_QUERY);
  const userData = useUserData();
  const { signOut } = useSignOut();
  const [editingChatId, setEditingChatId] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [chatToDelete, setChatToDelete] = useState(null);
  const [createChat, { loading: creatingChat }] = useMutation(CREATE_CHAT_MUTATION, {
    refetchQueries: [{ query: GET_CHATS_QUERY }],
    onCompleted: (data) => {
      onSelectChat(data.insert_chats_one.id);
      toast.success('New chat created!');
    },
    onError: (err) => toast.error(`Error creating chat: ${err.message}`),
  });
  const [updateChatTitle] = useMutation(UPDATE_CHAT_TITLE_MUTATION, {
    onError: (err) => toast.error(`Error renaming chat: ${err.message}`),
  });
  const [deleteChat] = useMutation(DELETE_CHAT_MUTATION, {
    update(cache, { data: { delete_chats_by_pk } }) {
      cache.modify({
        fields: {
          chats(existingChats = [], { readField }) {
            return existingChats.filter(
              (chatRef) => delete_chats_by_pk.id !== readField('id', chatRef)
            );
          },
        },
      });
    },
    onCompleted: () => {
      if (selectedChatId === chatToDelete?.id) { onSelectChat(null); }
      toast.success('Chat deleted!');
      setChatToDelete(null);
    },
    onError: (err) => toast.error(`Error deleting chat: ${err.message}`),
  });
  const handleNewChat = () => {
    const newChatTitle = `Chat - ${new Date().toLocaleTimeString()}`;
    createChat({ variables: { title: newChatTitle } });
  };
  const handleStartEditing = (chat) => {
    setEditingChatId(chat.id);
    setNewTitle(chat.title);
  };
  const handleTitleSubmit = (chatId) => {
    if (newTitle.trim()) {
      updateChatTitle({ variables: { id: chatId, title: newTitle } });
    }
    setEditingChatId(null);
  };
  const handleDeleteConfirm = () => {
    if (chatToDelete) {
      deleteChat({ variables: { id: chatToDelete.id } });
    }
  };

  if (loading) return <div className="p-4 w-full max-w-xs bg-gray-100 dark:bg-gray-900/50"><Loader2 className="animate-spin text-gray-400" /></div>;
  if (error) return <div className="p-4 w-full max-w-xs bg-gray-100 dark:bg-gray-900/50 text-red-500">Error: {error.message}</div>;

  return (
    <>
      <ConfirmationModal
        isOpen={!!chatToDelete}
        onClose={() => setChatToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Chat"
      >
        Are you sure you want to delete the chat "{chatToDelete?.title}"? This action cannot be undone.
      </ConfirmationModal>

      <div className="w-full max-w-xs bg-gray-100/50 dark:bg-gray-900/50 backdrop-blur-sm border-r border-gray-200 dark:border-gray-800 h-screen flex flex-col">
        <Toaster />
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Chats</h2>
          {/* THEMETOGGLE MOVED HERE */}
          <div className='flex items-center gap-2'>
            <ThemeToggle />
            <button onClick={handleNewChat} disabled={creatingChat} className="p-2 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 transition-colors">
              {creatingChat ? <Loader2 className="animate-spin" /> : <PlusCircle size={20} />}
            </button>
          </div>
        </div>
        
        <div className="overflow-y-auto flex-grow p-2">
          {data?.chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => editingChatId !== chat.id && onSelectChat(chat.id)}
              className={clsx('group p-3 my-1 flex justify-between items-center cursor-pointer rounded-lg transition-all duration-200', { 'bg-blue-600 text-white shadow-md': selectedChatId === chat.id && editingChatId !== chat.id, 'hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300': selectedChatId !== chat.id })}
            >
              {editingChatId === chat.id ? (
                <input
                  type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                  onBlur={() => handleTitleSubmit(chat.id)} onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit(chat.id)}
                  autoFocus className="w-full bg-transparent outline-none text-sm font-medium"
                />
              ) : (
                <>
                  <p className="font-medium text-sm truncate">{chat.title}</p>
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); handleStartEditing(chat); }} className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"> <Pencil size={14} /> </button>
                    <button onClick={(e) => { e.stopPropagation(); setChatToDelete(chat); }} className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-red-500"> <Trash2 size={14} /> </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="p-2 border-t border-gray-200 dark:border-gray-800 flex-shrink-0">
          <Menu as="div" className="relative">
            <Menu.Button className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
              <div className="flex items-center gap-2 overflow-hidden">
                <Avatar role="user" userData={userData} />
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{userData?.displayName || userData?.email}</span>
              </div>
              <MoreHorizontal size={20} className="text-gray-500 dark:text-gray-400" />
            </Menu.Button>
            <Menu.Items as={motion.div} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.1 }} className="absolute bottom-full left-0 mb-2 w-full origin-bottom-left bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black/5 dark:ring-white/10 focus:outline-none">
              <div className="p-1">
                <Menu.Item>
                  {({ active }) => (
                    <button onClick={signOut} className={clsx('w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md', { 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100': active, 'text-gray-700 dark:text-gray-300': !active })}>
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Menu>
        </div>
      </div>
    </>
  );
};

export default ChatList;