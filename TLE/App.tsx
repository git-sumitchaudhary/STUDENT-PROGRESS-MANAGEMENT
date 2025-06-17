
import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { StudentManagementPage } from './components/StudentManagementPage'; 
import { StudentProfileView } from './components/StudentProfileView'; 
import { useTheme, Theme } from './hooks/useTheme'; 
import { SunIcon, MoonIcon } from './components/common/IconComponents'; 


const App: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  const toggleTheme = () => {
    setTheme(theme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT);
  };

  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20,
    },
    in: {
      opacity: 1,
      y: 0,
    },
    out: {
      opacity: 0,
      y: -20,
    },
  };

  const pageTransition = {
    type: 'tween' as const,
    ease: 'anticipate' as const,
    duration: 0.4,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" as const }}
        className="bg-primary dark:bg-primary-dark text-white p-4 shadow-md sticky top-0 z-50"
      >
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold hover:text-secondary-light transition-colors">
            Student Progress System
          </Link>
          <motion.button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-primary-light dark:hover:bg-primary text-white transition-colors"
            aria-label="Toggle theme"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {theme === Theme.LIGHT ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
          </motion.button>
        </div>
      </motion.header>

      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname} // Ensure re-render on route change for AnimatePresence
          className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8"
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
        >
          <Routes location={location}> {/* Pass location to Routes for AnimatePresence */}
            <Route path="/" element={<StudentManagementPage />} />
            <Route path="/student/:handle" element={<StudentProfileView />} />
          </Routes>
        </motion.main>
      </AnimatePresence>

      <motion.footer 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" as const, delay: 0.2 }}
        className="bg-gray-100 dark:bg-gray-800 text-center p-4 text-sm text-muted-light dark:text-muted-dark"
      >
        &copy; {new Date().getFullYear()} Student Progress Management System.
      </motion.footer>
    </div>
  );
};

export default App;