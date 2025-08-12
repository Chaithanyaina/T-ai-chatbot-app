import React from 'react';
import { User, Bot } from 'lucide-react';
import clsx from 'clsx';

const Avatar = ({ role, userData }) => {
  const isUser = role === 'user';
  const initial = userData?.displayName?.charAt(0).toUpperCase() || '?';

  return (
    <div className={clsx(
      'w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0',
      isUser ? 'bg-blue-600' : 'bg-gray-600 dark:bg-gray-700'
    )}>
      {isUser ? (
        <span className="font-semibold">{initial}</span>
      ) : (
        <Bot size={20} />
      )}
    </div>
  );
};

export default Avatar;