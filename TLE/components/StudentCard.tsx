import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Student } from '../types';
import { Button } from './common/Button';
import { EditIcon, DeleteIcon, ViewIcon, SyncIcon, EmailIcon, CheckCircleIcon, XCircleIcon, MoreVerticalIcon, InfoIcon } from './common/IconComponents';
import { ModernSpinner } from './common/ModernSpinner';
import { useNavigate } from 'react-router-dom';
import { formatRelativeTime } from '../utils/dateHelper';

interface StudentCardProps {
  student: Student;
  onEdit: (student: Student) => void;
  onDelete: (studentId: string) => void;
  onSync: (student: Student) => Promise<void>; // Make onSync async for internal loading state
  onToggleReminder: (student: Student) => void;
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.2, ease: "easeIn" } } // Added exit animation
};

const dropdownVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: -10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.15, ease: "easeOut" } },
  exit: { opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.1, ease: "easeIn" } },
};

export const StudentCard: React.FC<StudentCardProps> = ({ student, onEdit, onDelete, onSync, onToggleReminder }) => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSyncingThisCard, setIsSyncingThisCard] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click if icon is clicked
    setIsDropdownOpen(prev => !prev);
  };

  const handleCardSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDropdownOpen(false); // Close dropdown before syncing
    setIsSyncingThisCard(true);
    await onSync(student);
    setIsSyncingThisCard(false);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(student);
    setIsDropdownOpen(false);
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(student.id);
    setIsDropdownOpen(false);
  }

  const handleToggleReminderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleReminder(student);
    setIsDropdownOpen(false);
  }
  
  const handleViewDetails = () => {
    navigate(`/student/${student.codeforcesHandle}`);
  };

  return (
    <motion.div
      layout // Added layout prop for smoother reordering if search/sort changes list
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit" // Apply exit animation
      className="bg-card-light dark:bg-card-dark shadow-lg rounded-xl p-5 flex flex-col justify-between hover:shadow-xl transition-shadow duration-300"
      onClick={handleViewDetails} // Make whole card clickable for view details
      style={{ cursor: 'pointer' }}
    >
      <div>
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-xl font-bold text-text-light dark:text-text-dark truncate" title={student.name}>{student.name}</h3>
            <a
              href={`https://codeforces.com/profile/${student.codeforcesHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()} // Prevent card click for this link
              className="text-sm text-primary dark:text-primary-light hover:underline"
            >
              {student.codeforcesHandle}
            </a>
          </div>
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDropdown}
              className="p-1 -mr-1" // Make click area slightly larger
              aria-label="More options"
              title="More options"
            >
              {isSyncingThisCard ? <ModernSpinner size={18} /> : <MoreVerticalIcon className="w-5 h-5" />}
            </Button>
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  ref={dropdownRef}
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute right-0 top-full mt-1 w-48 bg-card-light dark:bg-card-dark border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-20 py-1"
                  onClick={(e) => e.stopPropagation()} // Prevent card click inside dropdown
                >
                  {[
                    { label: 'Edit', icon: <EditIcon className="w-4 h-4 mr-2" />, action: handleEditClick, disabled: isSyncingThisCard },
                    { label: isSyncingThisCard ? 'Syncing...' : 'Sync Data', icon: isSyncingThisCard ? <ModernSpinner size={16} className="mr-2"/> : <SyncIcon className="w-4 h-4 mr-2" />, action: handleCardSync, disabled: isSyncingThisCard },
                    { label: student.disableReminders ? 'Enable Reminders' : 'Disable Reminders', icon: student.disableReminders ? <CheckCircleIcon className="w-4 h-4 mr-2 text-green-500" /> : <XCircleIcon className="w-4 h-4 mr-2 text-red-500" />, action: handleToggleReminderClick, disabled: isSyncingThisCard },
                    { label: 'Delete', icon: <DeleteIcon className="w-4 h-4 mr-2" />, action: handleDeleteClick, isDanger: true, disabled: isSyncingThisCard },
                  ].map(item => (
                    <button
                      key={item.label}
                      onClick={item.action}
                      disabled={item.disabled}
                      className={`w-full text-left px-3 py-1.5 text-sm flex items-center transition-colors
                        ${item.isDanger ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-700/50' : 'text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-700'}
                        ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      {item.icon} {item.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-1.5 text-sm mb-4">
          <p className="text-muted-light dark:text-muted-dark">
            Rating: <span className="font-semibold text-text-light dark:text-text-dark">{student.currentRating ?? 'N/A'}</span>
          </p>
          <p className="text-muted-light dark:text-muted-dark">
            Max Rating: <span className="font-semibold text-text-light dark:text-text-dark">{student.maxRating ?? 'N/A'}</span>
          </p>
          <div className="flex items-center text-muted-light dark:text-muted-dark" title={`Reminders sent: ${student.reminderSentCount}`}>
            <EmailIcon className={`w-4 h-4 mr-1.5 ${student.reminderSentCount > 0 ? (student.disableReminders ? 'text-gray-400' : 'text-yellow-500') : 'text-gray-400'}`} />
            <span>Reminders: {student.reminderSentCount}</span>
            {student.disableReminders && <InfoIcon className="w-3.5 h-3.5 ml-1 text-blue-500" title="Reminders are currently disabled for this student."/>}
          </div>
           <p className="text-xs text-muted-light dark:text-muted-dark pt-1" title={student.lastSyncedAt ? new Date(student.lastSyncedAt).toLocaleString() : 'Never'}>
            Synced: {formatRelativeTime(student.lastSyncedAt)}
          </p>
        </div>
      </div>

      <Button
        variant="primary"
        size="md"
        onClick={(e) => {
            e.stopPropagation(); // Prevent card's own onClick if button is separate
            handleViewDetails();
        }}
        className="w-full mt-2" // Ensure button is at the bottom
      >
        View Details
      </Button>
    </motion.div>
  );
};