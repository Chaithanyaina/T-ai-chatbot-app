import React, { useState } from 'react';
import ChatList from '../components/ChatList';
import MessageView from '../components/MessageView';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = () => {
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);

  return (
    // The `h-[100svh]` class is the key fix for mobile browser height
    <div className="flex h-[100svh] w-full bg-white dark:bg-[#0d1117] overflow-hidden relative">
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            key="sidebar"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="h-full absolute top-0 left-0 z-40 md:relative md:z-auto"
          >
            <ChatList 
              selectedChatId={selectedChatId} 
              onSelectChat={(chatId) => {
                setSelectedChatId(chatId);
                if (window.innerWidth < 768) {
                  setIsSidebarOpen(false);
                }
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
        ></div>
      )}

      <main className="flex-1 h-full flex flex-col">
        <MessageView 
          chatId={selectedChatId} 
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
      </main>
    </div>
  );
};

export default Dashboard;