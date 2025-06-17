
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Student } from '../types'; 
import { StudentCard } from './StudentCard'; 
import { StudentFormModal } from './StudentFormModal'; 
import { Button } from './common/Button'; 
import { Modal } from './common/Modal'; 
import { PlusIcon, DownloadIcon, SyncIcon, SettingsIcon, InfoIcon, SearchIcon, XMarkIcon } from './common/IconComponents'; // Added SearchIcon, XMarkIcon
import { ModernSpinner } from './common/ModernSpinner'; 
import * as studentDataService from '../services_backend/studentDataService'; 
import { convertToCSV, downloadCSV } from '../utils/csvHelper'; 
import { formatDate } from '../utils/dateHelper';

export const StudentManagementPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState(''); // New state for search
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true); 
  const [isModalSaving, setIsModalSaving] = useState(false); // Renamed from isProcessing for clarity
  const [isGlobalSyncing, setIsGlobalSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{current: number, total: number, name: string} | null>(null);
  const [showSyncSettingsModal, setShowSyncSettingsModal] = useState(false);
  const [syncSettings, setSyncSettings] = useState(studentDataService.getSyncSettings());
  const [notifications, setNotifications] = useState<Array<{id: string, message: string, type: 'info' | 'success' | 'error' | 'warning'}>>([]);
  const [lastGlobalSync, setLastGlobalSync] = useState<string | null>(null);
const [showSyncInfo, setShowSyncInfo] = useState(false);
  const loadStudents = useCallback((showLoadingIndicator = false) => {
    if(showLoadingIndicator) setIsLoading(true);
    const fetchedStudents = studentDataService.getAllStudents();
    setStudents(fetchedStudents.sort((a,b) => a.name.localeCompare(b.name))); // Sort students by name
    setLastGlobalSync(studentDataService.getLastGlobalSyncTime());
    if(showLoadingIndicator) setIsLoading(false);
  }, []);

  useEffect(() => {
    loadStudents(true); 
  }, [loadStudents]);

  useEffect(() => {
    if (lastGlobalSync) {
      setShowSyncInfo(true);
      const timer = setTimeout(() => {
        setShowSyncInfo(false);
      }, 5000); // disappears after 5 seconds

      return () => clearTimeout(timer); // cleanup on unmount or re-render
    }
  }, [lastGlobalSync]);

  useEffect(() => {
    const lastSyncTime = studentDataService.getLastGlobalSyncTime();
    const settings = studentDataService.getSyncSettings();
    let anHourAgo = new Date();
    anHourAgo.setHours(anHourAgo.getHours() - 1);

    if (lastSyncTime && new Date(lastSyncTime) > anHourAgo && students.length === 0) {
        // Recently synced, and no students, probably fine.
    } else {
        if (lastSyncTime) {
            const lastSyncDate = new Date(lastSyncTime);
            const nextSyncDate = new Date(lastSyncDate);
            nextSyncDate.setDate(lastSyncDate.getDate() + settings.frequencyDays);
            nextSyncDate.setHours(settings.hour, 0, 0, 0);

            if (new Date() > nextSyncDate) {
                console.log("Simulated cron: Time to sync all students automatically.");
                addNotification("Auto-syncing all students in background...", "info");
                handleSyncAllStudents(true); 
            }
        } else {
            if (students.length > 0) { 
                console.log("Simulated cron: Initial sync potentially needed for existing students.");
                addNotification("Performing initial data sync for all students...", "info");
                handleSyncAllStudents(true); 
            }
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) {
      return students; // `students` is already sorted by name
    }
    return students.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const handleAddStudent = () => {
    setStudentToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditStudent = (student: Student) => {
    setStudentToEdit(student);
    setIsModalOpen(true);
  };

  const handleDeleteStudent = (studentId: string) => {
    if (window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      const deleteStatus = studentDataService.deleteStudent(studentId);
      switch (deleteStatus) {
        case 'SUCCESS':
          loadStudents();
          addNotification(`Student successfully deleted.`, 'success');
          break;
        case 'NOT_FOUND':
          addNotification('Student not found. Deletion could not be performed.', 'warning');
          break;
        case 'SAVE_FAILED':
          addNotification('Failed to delete student. Data persistence error. Please try again.', 'error');
          break;
        default:
          addNotification('An unknown error occurred during deletion.', 'error');
      }
    }
  };

  const handleSaveStudent = async (studentData: Student) => {
    setIsModalSaving(true); 
    let isNewStudent = false;
    let oldHandle = '';
    let success = false;

    if (studentData.id) { 
      const existingStudent = students.find(s => s.id === studentData.id);
      if (existingStudent) oldHandle = existingStudent.codeforcesHandle;
      const updatedStudent = studentDataService.updateStudent(studentData);
      success = updatedStudent !== null;
    } else { 
      const newStudent = studentDataService.addStudent(studentData);
      if (newStudent) {
        studentData.id = newStudent.id; 
        isNewStudent = true;
        success = true;
      }
    }
    
    if (success) {
      if (isNewStudent || (oldHandle && studentData.codeforcesHandle.toLowerCase() !== oldHandle.toLowerCase())) {
        addNotification(`Syncing new/updated data for ${studentData.codeforcesHandle}...`, 'info', 10000);
        try {
          await studentDataService.syncStudentData(studentData, true); 
          addNotification(`Data synced for ${studentData.codeforcesHandle}.`, 'success');
        } catch (e) {
          addNotification(`Failed to sync data for ${studentData.codeforcesHandle}. Check console for details.`, 'error');
          console.error("Sync error during save:", e);
        }
      }
      loadStudents(); 
      setIsModalOpen(false);
      setStudentToEdit(null);
      addNotification(`Student ${isNewStudent ? 'added' : 'updated'} successfully.`, 'success');
    } else {
       addNotification(`Failed to ${isNewStudent ? 'add' : 'update'} student. Data might not have been saved.`, 'error');
    }
    setIsModalSaving(false); 
  };

  const handleSyncStudentData = async (student: Student) => {
    addNotification(`Force syncing data for ${student.codeforcesHandle}...`, 'info', 10000);
    try {
        await studentDataService.syncStudentData(student, true); // Force refresh
        addNotification(`Data synced for ${student.codeforcesHandle}.`, 'success');
    } catch(e) {
        addNotification(`Failed to sync ${student.codeforcesHandle}. Check console.`, 'error');
        console.error("Manual sync error:", e);
    }
    loadStudents(); 
  };
  
  const handleSyncAllStudents = async (isAutoSync: boolean = false) => {
    if (!isAutoSync && !window.confirm('This will fetch fresh data for ALL students from Codeforces and may take a significant amount of time. Continue?')) return;
    setIsGlobalSyncing(true);
    setSyncProgress({current: 0, total: students.length, name: ''});
    addNotification('Starting global data refresh from Codeforces...', 'info', 15000);
    
    try {
        const updatedStudents = await studentDataService.syncAllStudents(true, (index, total, name) => { 
          setSyncProgress({current: index + 1, total, name});
        });
        setStudents(updatedStudents.sort((a,b) => a.name.localeCompare(b.name)));
        setLastGlobalSync(studentDataService.getLastGlobalSyncTime());

        const inactivityNotifications = studentDataService.checkInactivityAndNotify(updatedStudents);
        inactivityNotifications.forEach(n => addNotification(n.message, 'warning', 10000));
        
        addNotification('Global sync completed. Inactivity checks performed.', 'success');
    } catch (e) {
        addNotification('Global sync failed. Some students might not be updated. Check console.', 'error');
        console.error("Global sync error:", e);
        loadStudents(); 
    }
    
    setIsGlobalSyncing(false);
    setSyncProgress(null);
  };

  const handleDownloadCSV = () => {
    const csvData = convertToCSV(students);
    downloadCSV(csvData, 'students_progress.csv');
    addNotification('Student data downloaded as CSV.', 'info');
  };

  const handleToggleReminder = (student: Student) => {
    const updatedStudent = { ...student, disableReminders: !student.disableReminders };
    const success = studentDataService.updateStudent(updatedStudent);
    if (success) {
      loadStudents();
      addNotification(`Reminders ${updatedStudent.disableReminders ? 'disabled' : 'enabled'} for ${student.name}.`, 'info');
    } else {
      addNotification(`Failed to update reminder status for ${student.name}.`, 'error');
    }
  };
  
  const handleSaveSyncSettings = () => {
    studentDataService.saveSyncSettings(syncSettings);
    setShowSyncSettingsModal(false);
    addNotification('Sync settings updated.', 'success');
  };

  const addNotification = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info', duration: number = 7000) => {
    console.log(`Notification (${type}):`, message);
    const newNotification = {id: `${Date.now()}_${Math.random()}`, message, type};
    setNotifications(prev => [...prev.slice(-4), newNotification]); 
    setTimeout(() => {
        setNotifications(prev => prev.filter(note => note.id !== newNotification.id));
    }, duration);
  };

  if (isLoading) { 
    return (
        <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)]">
            <ModernSpinner size={80} />
            <p className="mt-4 text-xl text-muted-light dark:text-muted-dark">Loading student dashboard...</p>
        </div>
    );
  }

  const headerVariants: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
  };
  const searchBarVariants: Variants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const, delay: 0.1 } },
  };
  const notificationVariants: Variants = {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
    exit: { opacity: 0, x: 100, transition: { duration: 0.2, ease: 'easeIn' as const } },
  };
  const cardGridVariants: Variants = {
    hidden: { opacity: 1 }, // Parent doesn't hide, children do
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.07, // Stagger animation of student cards
        },
    },
  };
  const messageVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } }
  };


  return (
    <div className="space-y-6 pb-16"> 
      <motion.div 
        className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-card-light dark:bg-card-dark shadow rounded-lg"
        variants={headerVariants}
        initial="hidden"
        animate="visible"
      >
        <h1 className="text-2xl font-semibold text-text-light dark:text-text-dark">Student Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleAddStudent} leftIcon={<PlusIcon className="w-5 h-5"/>} disabled={isModalSaving || isGlobalSyncing}>Add Student</Button>
          <Button onClick={() => handleSyncAllStudents(false)} leftIcon={<SyncIcon className="w-5 h-5"/>} isLoading={isGlobalSyncing} disabled={isModalSaving || isGlobalSyncing}>
            {isGlobalSyncing ? `Syncing ${syncProgress?.current || 0}/${syncProgress?.total || students.length}...` : 'Force Sync All'}
          </Button>
          <Button onClick={handleDownloadCSV} variant="outline" leftIcon={<DownloadIcon className="w-5 h-5"/>} disabled={isModalSaving || isGlobalSyncing}>Download CSV</Button>
          <Button onClick={() => setShowSyncSettingsModal(true)} variant="outline" leftIcon={<SettingsIcon className="w-5 h-5"/>} disabled={isModalSaving || isGlobalSyncing}>Sync Settings</Button>
        </div>
      </motion.div>

      <motion.div variants={searchBarVariants} initial="hidden" animate="visible" className="my-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-muted-light dark:text-muted-dark" />
          </div>
          <input
            type="text"
            placeholder="Search students by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white dark:focus:ring-primary-light dark:focus:border-primary-light transition-colors"
          />
          <AnimatePresence>
            {searchTerm && (
              <motion.button
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-light dark:text-muted-dark hover:text-text-light dark:hover:text-text-dark"
                aria-label="Clear search"
              >
                <XMarkIcon className="h-5 w-5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      
      {/* {lastGlobalSync && (
        <motion.div 
          className="p-3 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-md text-sm text-blue-700 dark:text-blue-200 flex items-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <InfoIcon className="w-5 h-5 mr-2 flex-shrink-0" />
          Data last auto-synced around: {formatDate(lastGlobalSync)}. Next auto-sync: ~{syncSettings.hour}:00, in {syncSettings.frequencyDays} day(s) from last sync. (Manual syncs are separate)
        </motion.div>
      )} */}

      {showSyncInfo && (
        <motion.div
          className="p-3 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-md text-sm text-blue-700 dark:text-blue-200 flex items-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ delay: 0.1 }}
        >
          <InfoIcon className="w-5 h-5 mr-2 flex-shrink-0" />
          Data last auto-synced around: {formatDate(lastGlobalSync)}. Next auto-sync: ~{syncSettings.hour}:00, in {syncSettings.frequencyDays} day(s) from last sync. (Manual syncs are separate)
        </motion.div>
      )}

      {isGlobalSyncing && syncProgress && (
         <motion.div 
            className="my-2 p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-md text-sm text-yellow-700 dark:text-yellow-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
           Global Sync: Processing {syncProgress.name} ({syncProgress.current} of {syncProgress.total})... This might take a while.
         </motion.div>
      )}

      <div className="fixed bottom-4 right-4 space-y-2 z-[100] w-full max-w-sm sm:max-w-md">
        <AnimatePresence initial={false}>
          {notifications.map((note) => {
             let bgColor = 'bg-blue-100 dark:bg-blue-800';
             let textColor = 'text-blue-700 dark:text-blue-200';
             let borderColor = 'border-blue-300 dark:border-blue-600';

             if (note.type === 'error') {
                bgColor = 'bg-red-100 dark:bg-red-800';
                textColor = 'text-red-700 dark:text-red-200';
                borderColor = 'border-red-300 dark:border-red-600';
             } else if (note.type === 'success') {
                bgColor = 'bg-green-100 dark:bg-green-800';
                textColor = 'text-green-700 dark:text-green-200';
                borderColor = 'border-green-300 dark:border-green-600';
             } else if (note.type === 'warning') {
                bgColor = 'bg-yellow-100 dark:bg-yellow-800';
                textColor = 'text-yellow-700 dark:text-yellow-200';
                borderColor = 'border-yellow-300 dark:border-yellow-600';
             }

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

      {students.length === 0 ? (
        <motion.p 
            variants={messageVariants}
            initial="hidden"
            animate="visible"
            className="text-center text-muted-light dark:text-muted-dark py-12 text-lg"
        >
            No students found. Click "Add Student" to get started!
        </motion.p>
      ) : filteredStudents.length === 0 ? (
        <motion.p 
            variants={messageVariants}
            initial="hidden"
            animate="visible"
            className="text-center text-muted-light dark:text-muted-dark py-12 text-lg"
        >
            No students match your search criteria "{searchTerm}".
        </motion.p>
      ) : (
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          variants={cardGridVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredStudents.map(student => (
            <StudentCard 
              key={student.id}
              student={student}
              onEdit={handleEditStudent}
              onDelete={handleDeleteStudent}
              onSync={handleSyncStudentData}
              onToggleReminder={handleToggleReminder}
            />
          ))}
        </motion.div>
      )}
      
      <StudentFormModal 
        isOpen={isModalOpen} 
        onClose={() => { if (!isModalSaving) { setIsModalOpen(false); setStudentToEdit(null); }}}
        onSave={handleSaveStudent}
        studentToEdit={studentToEdit}
        isSaving={isModalSaving} 
      />
      
      <Modal isOpen={showSyncSettingsModal} onClose={() => setShowSyncSettingsModal(false)} title="Cron Sync Settings">
        <div className="space-y-4">
          <div>
            <label htmlFor="syncHour" className="block text-sm font-medium text-text-light dark:text-text-dark">Sync Hour (0-23, device local time)</label>
            <input 
              type="number" 
              id="syncHour" 
              min="0" max="23"
              value={syncSettings.hour}
              onChange={(e) => setSyncSettings(s => ({...s, hour: parseInt(e.target.value)}))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div>
            <label htmlFor="syncFrequency" className="block text-sm font-medium text-text-light dark:text-text-dark">Sync Frequency (days)</label>
            <input 
              type="number" 
              id="syncFrequency" 
              min="1"
              value={syncSettings.frequencyDays}
              onChange={(e) => setSyncSettings(s => ({...s, frequencyDays: parseInt(e.target.value)}))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <p className="text-xs text-muted-light dark:text-muted-dark">
            Note: This simulates a cron job. The sync will attempt to run when the app is next opened after the scheduled time, based on the last sync time. This uses browser localStorage and is not a true server-side cron.
          </p>
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={handleSaveSyncSettings}>Save Settings</Button>
        </div>
      </Modal>
    </div>
  );
};
