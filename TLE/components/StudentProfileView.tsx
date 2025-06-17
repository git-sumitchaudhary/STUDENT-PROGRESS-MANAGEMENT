import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Student } from '../types'; 
import { ContestHistorySection } from './ContestHistorySection'; 
import { ProblemSolvingSection } from './ProblemSolvingSection'; 
import * as studentDataService from '../services_backend/studentDataService'; 
import { getUserInfo } from '../services_backend/codeforcesService'; 
import { InfoIcon } from './common/IconComponents'; 
import { ModernSpinner } from './common/ModernSpinner'; 
import { Button } from './common/Button'; // For potential refresh button

enum ProfileTab {
  Contests = 'Contests',
  Problems = 'Problems'
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const notificationVariants: Variants = {
  initial: { opacity: 0, x: 100 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
  exit: { opacity: 0, x: 100, transition: { duration: 0.2, ease: 'easeIn' as const } },
};

export const StudentProfileView: React.FC = () => {
  const { handle } = useParams<{ handle: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>(ProfileTab.Contests);
  const [refreshKey, setRefreshKey] = useState(0);
  const [notifications, setNotifications] = useState<Array<{id: string, message: string, type: 'info' | 'success' | 'error'}>>([]);


  const loadStudentData = async (forceApiRefresh: boolean = false) => {
    if (!handle) {
      setError("No student handle provided.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const students = studentDataService.getAllStudents();
      let foundStudent = students.find(s => s.codeforcesHandle.toLowerCase() === handle.toLowerCase());
      
      if (foundStudent) {
        if (forceApiRefresh) {
            addNotification(`Refreshing core data for ${handle} from Codeforces...`, 'info');
            foundStudent = await studentDataService.syncStudentData(foundStudent, true); 
            addNotification(`Core data for ${handle} updated.`, 'success');
        }
        setStudent(foundStudent);
        
        const cfInfo = await getUserInfo([handle], forceApiRefresh); 
        if (cfInfo.length > 0) {
          setAvatar(cfInfo[0].avatar);
        }
      } else {
        setError(`Student with handle "${handle}" not found in local records. Please add them first or check the handle.`);
      }
    } catch (err) {
      console.error("Error loading student profile:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load student data.";
      setError(errorMessage);
      addNotification(`Error: ${errorMessage}`, 'error');
    }
    setIsLoading(false);
  };
  
  const addNotification = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const newNotification = { id: `${Date.now()}_${Math.random()}`, message, type };
    setNotifications(prev => [...prev.slice(-2), newNotification]); 
    setTimeout(() => {
        setNotifications(prev => prev.filter(note => note.id !== newNotification.id));
    }, 7000);
  };


  useEffect(() => {
    loadStudentData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle, refreshKey]); 

  const handleForceRefreshAllProfileData = () => {
    addNotification(`Initiating full data refresh for ${handle}... This may take a moment.`, 'info');
    loadStudentData(true).then(() => {
        setRefreshKey(prev => prev + 1); 
    });
  };


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <ModernSpinner size={80} />
        <p className="mt-4 text-lg text-muted-light dark:text-muted-dark">Loading student profile for {handle}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div 
        className="p-6 bg-red-100 text-red-700 rounded-md dark:bg-red-800 dark:text-red-200 text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <InfoIcon className="w-8 h-8 mx-auto mb-2"/>
        <p className="font-semibold text-lg">{error}</p>
        <Link to="/" className="mt-4 inline-block px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors">
          Back to Student List
        </Link>
      </motion.div>
    );
  }

  if (!student) { 
    return (
         <motion.div 
          className="p-6 bg-yellow-100 text-yellow-700 rounded-md dark:bg-yellow-800 dark:text-yellow-200 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          >
            <InfoIcon className="w-8 h-8 mx-auto mb-2"/>
            <p className="font-semibold text-lg">Student data could not be loaded.</p>
             <Link to="/" className="mt-4 inline-block px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors">
              Back to Student List
            </Link>
        </motion.div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
       <div className="fixed bottom-4 right-4 space-y-2 z-[100] w-full max-w-sm sm:max-w-md">
          <AnimatePresence initial={false}>
            {notifications.map((note) => {
               let bgColor = note.type === 'error' ? 'bg-red-100 dark:bg-red-800' : note.type === 'success' ? 'bg-green-100 dark:bg-green-800' : 'bg-blue-100 dark:bg-blue-800';
               let textColor = note.type === 'error' ? 'text-red-700 dark:text-red-200' : note.type === 'success' ? 'text-green-700 dark:text-green-200' : 'text-blue-700 dark:text-blue-200';
               let borderColor = note.type === 'error' ? 'border-red-300 dark:border-red-600' : note.type === 'success' ? 'border-green-300 dark:border-green-600' : 'border-blue-300 dark:border-blue-600';
              return ( 
                <motion.div 
                    key={note.id} 
                    className={`p-3 rounded-md shadow-lg text-sm border ${bgColor} ${textColor} ${borderColor}`}
                    variants={notificationVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    layout
                > 
                    {note.message} 
                </motion.div> 
              );
            })}
          </AnimatePresence>
        </div>
      <motion.div 
        className="bg-card-light dark:bg-card-dark p-6 rounded-lg shadow-lg"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
          {avatar && (
            <motion.img 
              src={avatar} 
              alt={`${student.name}'s avatar`} 
              className="w-24 h-24 rounded-full border-4 border-primary dark:border-primary-light object-cover shadow-md"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }} 
            />
          )}
          <motion.div 
            className="flex-grow"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <h2 className="text-3xl font-bold text-text-light dark:text-text-dark">{student.name}</h2>
            <p className="text-lg text-primary dark:text-primary-light">
              <a href={`https://codeforces.com/profile/${student.codeforcesHandle}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {student.codeforcesHandle}
              </a>
            </p>
            <p className="text-sm text-muted-light dark:text-muted-dark">{student.email}</p>
            {(student.currentRating !== null || student.maxRating !== null) && (
                 <p className="text-sm text-muted-light dark:text-muted-dark">
                    Rating: {student.currentRating ?? 'N/A'} (Max: {student.maxRating ?? 'N/A'})
                 </p>
            )}
             <p className="text-xs text-muted-light dark:text-muted-dark mt-1">
                Core data last synced: {student.lastSyncedAt ? new Date(student.lastSyncedAt).toLocaleString() : 'Never'}
            </p>
          </motion.div>
          <Button variant="outline" size="sm" onClick={handleForceRefreshAllProfileData} disabled={isLoading}>
            Refresh All Data
          </Button>
        </div>
      </motion.div>
      
      <motion.div 
        className="bg-card-light dark:bg-card-dark rounded-lg shadow"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }} // Slightly delay this card
      >
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {(Object.keys(ProfileTab) as Array<keyof typeof ProfileTab>).map((tabKey) => (
              <button
                key={ProfileTab[tabKey]}
                onClick={() => setActiveTab(ProfileTab[tabKey])}
                className={`relative px-4 py-3 sm:px-6 font-medium text-sm sm:text-base focus:outline-none transition-colors duration-200
                  ${activeTab === ProfileTab[tabKey] 
                    ? 'text-primary dark:text-primary-light' 
                    : 'text-muted-light dark:text-muted-dark hover:text-text-light dark:hover:text-text-dark'}`}
              >
                {ProfileTab[tabKey]}
                {activeTab === ProfileTab[tabKey] && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary dark:bg-primary-light"
                    layoutId="underline" // Animates the underline between tabs
                  />
                )}
              </button>
            ))}
          </div>
          <motion.div 
            className="p-4 sm:p-6"
            key={activeTab} // To re-trigger animation when tab changes
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === ProfileTab.Contests && <ContestHistorySection student={student} forceRefreshTrigger={refreshKey} />}
            {activeTab === ProfileTab.Problems && <ProblemSolvingSection student={student} forceRefreshTrigger={refreshKey} />}
          </motion.div>
      </motion.div>

      <motion.div 
        className="text-center mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Link to="/" className="text-primary hover:underline dark:text-primary-light">
          &larr; Back to Student List
        </Link>
      </motion.div>
    </div>
  );
};