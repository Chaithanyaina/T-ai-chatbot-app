import React, { useState } from 'react';
import ChatList from '../components/ChatList';
import MessageView from '../components/MessageView';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = () => {
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen w-full bg-white dark:bg-[#0d1117] overflow-hidden">
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="h-full"
          >
            <ChatList 
              selectedChatId={selectedChatId} 
              onSelectChat={setSelectedChatId} 
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      <main className="flex-1 h-full">
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