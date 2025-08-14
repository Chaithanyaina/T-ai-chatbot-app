import React from 'react';
import { motion } from 'framer-motion';
import AnimatedSphere from './AnimatedSphere'; // Import our new 3D component

const AuthLayout = ({ children, title, subtitle, linkText, linkTo }) => {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background p-4">
      <div className="w-full max-w-5xl h-[80vh] min-h-[600px] grid md:grid-cols-2 overflow-hidden rounded-2xl shadow-2xl border border-border">
        {/* Left Side: 3D Animation and Branding */}
        <div className="hidden md:flex flex-col justify-between p-12 bg-secondary/30">
          <div className="z-10">
            <img src="/logo.png" alt="Subspace Logo" className="w-32" />
            <h1 className="mt-8 text-4xl font-bold text-foreground">
              {title}
            </h1>
            <p className="mt-2 text-muted-foreground">{subtitle}</p>
          </div>
          <div className="w-full h-full absolute top-0 left-0">
            <AnimatedSphere />
          </div>
        </div>
        
        {/* Right Side: Form */}
        <div className="flex items-center justify-center p-8 bg-secondary/50 backdrop-blur-lg">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="w-full max-w-sm"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;