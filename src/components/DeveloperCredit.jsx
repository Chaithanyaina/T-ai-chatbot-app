import React from 'react';
import { motion } from 'framer-motion';

const DeveloperCredit = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.5 }}
      className="fixed bottom-4 right-4 z-50"
    >
      <a
        href="https://www.linkedin.com/in/chaithanyainaganti/" // Optional: Link to your profile
        target="_blank"
        rel="noopener noreferrer"
        className="px-3 py-1.5 bg-black/40 dark:bg-white/10 text-white dark:text-gray-300 text-xs font-semibold rounded-full backdrop-blur-sm hover:bg-black/60 dark:hover:bg-white/20 transition-colors"
      >
        Developed by Chaithanya Inaganti
      </a>
    </motion.div>
  );
};

export default DeveloperCredit;