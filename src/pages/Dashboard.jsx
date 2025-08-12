import React, { useState } from 'react';
import ChatList from '../components/ChatList';
import MessageView from '../components/MessageView';

const Dashboard = () => {
  const [selectedChatId, setSelectedChatId] = useState(null);

  return (
    <div className="flex h-screen w-full bg-white">
      <ChatList selectedChatId={selectedChatId} onSelectChat={setSelectedChatId} />
      <MessageView chatId={selectedChatId} />
    </div>
  );
};

export default Dashboard;