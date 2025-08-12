import React from 'react';
import { motion } from 'framer-motion';

const AuthLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-[#0d1117] p-4">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-8 bg-gray-100/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-8"
      >
        <div className="text-center">
          <img src="/logo.png" alt="Subspace Logo" className="w-32 mx-auto mb-4" />
        </div>
        {children}
      </motion.div>
    </div>
  );
};

export default AuthLayout;