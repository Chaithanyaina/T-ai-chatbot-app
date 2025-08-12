import React, { useState } from 'react';
import ChatList from '../components/ChatList';
import MessageView from '../components/MessageView';
import { useSignOut } from '@nhost/react';
import { LogOut } from 'lucide-react';

const Dashboard = () => {
  const [selectedChatId, setSelectedChatId] = useState(null);
  const { signOut } = useSignOut();

  return (
    <div className="flex h-screen w-full">
       <div className="fixed top-2 right-2 z-10">
         <button onClick={signOut} className="flex items-center gap-2 bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600">
            <LogOut size={16} />
            Sign Out
         </button>
       </div>
      <ChatList selectedChatId={selectedChatId} onSelectChat={setSelectedChatId} />
      <MessageView chatId={selectedChatId} />
    </div>
  );
};

export default Dashboard;