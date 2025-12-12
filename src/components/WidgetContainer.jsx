import React from 'react';
import { motion } from 'framer-motion';

const WidgetContainer = ({ children, theme, className, ...props }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className={`${theme.panel} ${theme.shape} p-6 relative overflow-hidden transition-colors duration-500 ${className}`}
    {...props}
  >
    {children}
    {theme.name === 'J.A.R.V.I.S.' && (
      <>
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-400" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-400" />
      </>
    )}
  </motion.div>
);

export default WidgetContainer; 