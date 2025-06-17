import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Student } from '../types'; 
import { Button } from './common/Button'; 
import { EditIcon, DeleteIcon, ViewIcon, SyncIcon, EmailIcon, CheckCircleIcon, XCircleIcon, MoreVerticalIcon } from './common/IconComponents'; 
import { useNavigate } from 'react-router-dom';
import { formatRelativeTime } from '../utils/dateHelper'; 

interface StudentTableProps {
  students: Student[];
  onEdit: (student: Student) => void;
  onDelete: (studentId: string) => void;
  onSync: (student: Student) => void;
  onToggleReminder: (student: Student) => void;
}

const rowVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: "easeOut" as const
    }
  }),
  exit: { 
    opacity: 0, 
    x: 20,
    transition: {
        duration: 0.2,
        ease: "easeIn" as const
    }
 },
};

const dropdownVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: -10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.15, ease: "easeOut" as const } },
  exit: { opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.1, ease: "easeIn" as const } },
}


export const StudentTable: React.FC<StudentTableProps> = ({ students, onEdit, onDelete, onSync, onToggleReminder }) => {
  const navigate = useNavigate();
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (students.length === 0) {
    return (
      <motion.p 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center text-muted-light dark:text-muted-dark py-8"
      >
        No students found. Add a student to get started.
      </motion.p>
    );
  }

  const toggleDropdown = (studentId: string) => {
    setActiveDropdownId(prevId => (prevId === studentId ? null : studentId));
  };

  return (
    <motion.div 
      className="overflow-x-auto bg-card-light dark:bg-card-dark shadow-lg rounded-lg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-750">
          <tr>
            {['Name', 'Email', 'Phone', 'CF Handle', 'Rating', 'Max Rating', 'Last Synced', 'Reminders', 'Actions'].map(header => (
              <th key={header} scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-light dark:text-muted-dark uppercase tracking-wider whitespace-nowrap">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <AnimatePresence initial={false}>
          {students.map((student, index) => (
            <motion.tr 
              key={student.id} 
              custom={index}
              variants={rowVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              layout // Smooth reordering/deletion
              className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-text-light dark:text-text-dark">{student.name}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-light dark:text-muted-dark">{student.email}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-light dark:text-muted-dark">{student.phoneNumber || 'N/A'}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm">
                <a 
                  href={`https://codeforces.com/profile/${student.codeforcesHandle}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-secondary-light font-medium"
                >
                  {student.codeforcesHandle}
                </a>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-light dark:text-muted-dark">{student.currentRating ?? 'N/A'}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-light dark:text-muted-dark">{student.maxRating ?? 'N/A'}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-light dark:text-muted-dark" title={student.lastSyncedAt ? new Date(student.lastSyncedAt).toLocaleString() : 'Never'}>
                {formatRelativeTime(student.lastSyncedAt)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-light dark:text-muted-dark">
                <div className="flex items-center space-x-1">
                  <EmailIcon className={`w-4 h-4 ${student.reminderSentCount > 0 ? 'text-yellow-500' : 'text-gray-400'}`} title={`Reminders sent: ${student.reminderSentCount}`} />
                  <span>{student.reminderSentCount}</span>
                  <button onClick={() => onToggleReminder(student)} title={student.disableReminders ? "Enable Reminders" : "Disable Reminders"} className="ml-1 p-0.5">
                    {student.disableReminders ? <XCircleIcon className="w-4 h-4 text-red-500"/> : <CheckCircleIcon className="w-4 h-4 text-green-500"/>}
                  </button>
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                <div className="flex items-center space-x-1 relative"> {/* Added relative for dropdown positioning */}
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/student/${student.codeforcesHandle}`)} title="View Details">
                    <ViewIcon className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleDropdown(student.id)} title="More options">
                    <MoreVerticalIcon className="w-4 h-4" />
                  </Button>
                  
                  <AnimatePresence>
                    {activeDropdownId === student.id && (
                      <motion.div
                        ref={dropdownRef}
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute right-0 top-full mt-1 w-36 bg-card-light dark:bg-card-dark border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-10 py-1"
                      >
                        <button
                          onClick={() => { onEdit(student); setActiveDropdownId(null); }}
                          className="w-full text-left px-3 py-1.5 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                        >
                          <EditIcon className="w-4 h-4 mr-2" /> Edit
                        </button>
                        <button
                          onClick={() => { onSync(student); setActiveDropdownId(null); }}
                          className="w-full text-left px-3 py-1.5 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                        >
                          <SyncIcon className="w-4 h-4 mr-2" /> Sync
                        </button>
                        <button
                          onClick={() => { onDelete(student.id); setActiveDropdownId(null); }}
                          className="w-full text-left px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-700/50 flex items-center"
                        >
                          <DeleteIcon className="w-4 h-4 mr-2" /> Delete
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </td>
            </motion.tr>
          ))}
        </AnimatePresence>
      </table>
    </motion.div>
  );
};
