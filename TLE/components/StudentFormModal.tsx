import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Student } from '../types'; 
import { Modal } from './common/Modal'; 
import { Button } from './common/Button'; 
import { ModernSpinner } from './common/ModernSpinner'; 

// Define initialFormState outside as well, if it's only used for initialization
const initialFormStateOmitted: Omit<Student, 'id' | 'currentRating' | 'maxRating' | 'lastSyncedAt' | 'reminderSentCount' | 'disableReminders' | 'lastSubmissionDate'> = {
  name: '',
  email: '',
  phoneNumber: '',
  codeforcesHandle: '',
};

// Define InputField outside StudentFormModal
interface InputFieldProps {
  label: string;
  name: keyof typeof initialFormStateOmitted; // Use the type from the moved initial state
  type?: string;
  value: string;
  error?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
  disabled?: boolean;
}

const InputField: React.FC<InputFieldProps> = 
  ({label, name, type = "text", value, error, onChange, autoFocus = false, disabled = false}) => (
  <div className="mb-4">
    <label htmlFor={name} className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">{label}</label>
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${error ? 'border-red-500 focus:ring-red-400' : 'border-gray-300 focus:ring-primary dark:focus:ring-primary-light'} ${disabled ? 'opacity-70 bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''}`}
      autoFocus={autoFocus}
      disabled={disabled}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);


interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (student: Student) => void;
  studentToEdit?: Student | null;
  isSaving?: boolean; // New prop for loading state during save
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  studentToEdit,
  isSaving = false // Default to false
}) => {
  const [formData, setFormData] = useState(initialFormStateOmitted);
  const [errors, setErrors] = useState<Partial<typeof initialFormStateOmitted>>({});
  const prevIsOpen = useRef(isOpen);

  useEffect(() => {
    if (isOpen) {
      if (studentToEdit) {
        setFormData({
          name: studentToEdit.name,
          email: studentToEdit.email,
          phoneNumber: studentToEdit.phoneNumber,
          codeforcesHandle: studentToEdit.codeforcesHandle,
        });
      } else {
        // Only reset if modal is opening for a new student (not already open for new)
        if (!prevIsOpen.current) { 
          setFormData(initialFormStateOmitted);
        }
      }
      // Reset errors when modal opens or studentToEdit changes
      if (!prevIsOpen.current || studentToEdit) {
         setErrors({});
      }
    }
  }, [isOpen, studentToEdit]); // Removed prevIsOpen from deps as it's a ref for comparison

  // Update prevIsOpen ref after isOpen changes
  useEffect(() => {
    prevIsOpen.current = isOpen;
  }, [isOpen]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof initialFormStateOmitted]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // const validate = (): boolean => {
  //   const newErrors: Partial<typeof initialFormStateOmitted> = {};
  //   if (!formData.name.trim()) newErrors.name = 'Name is required';
  //   if (!formData.email.trim()) {
  //     newErrors.email = 'Email is required';
  //   } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
  //     newErrors.email = 'Email is invalid';
  //   }
  //   if (!formData.codeforcesHandle.trim()) newErrors.codeforcesHandle = 'Codeforces Handle is required';
  //   if (formData.phoneNumber.trim() && !/^\d{10,15}$/.test(formData.phoneNumber)) {
  //       newErrors.phoneNumber = 'Phone number is invalid (must be 10-15 digits)';
  //   }

  //   setErrors(newErrors);
  //   return Object.keys(newErrors).length === 0;
  // };

  const validate = (): boolean => {
  const newErrors: Partial<typeof initialFormStateOmitted> = {};

  if (!formData.name.trim()) newErrors.name = 'Name is required';

  if (!formData.email.trim()) {
    newErrors.email = 'Email is required';
  } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
    newErrors.email = 'Email is invalid';
  }

  if (!formData.codeforcesHandle.trim()) {
    newErrors.codeforcesHandle = 'Codeforces Handle is required';
  }

  if (!formData.phoneNumber.trim()) {
    newErrors.phoneNumber = 'Phone number is required';
  } else if (!/^\d{10,15}$/.test(formData.phoneNumber)) {
    newErrors.phoneNumber = 'Phone number is invalid (must be 10-15 digits)';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const studentData: Student = {
        ...(studentToEdit || { id: '', currentRating: null, maxRating: null, lastSyncedAt: null, reminderSentCount: 0, disableReminders: false, lastSubmissionDate: null }),
        ...formData,
        id: studentToEdit ? studentToEdit.id : '', 
        currentRating: studentToEdit ? studentToEdit.currentRating : null,
        maxRating: studentToEdit ? studentToEdit.maxRating : null,
        lastSyncedAt: studentToEdit ? studentToEdit.lastSyncedAt : null,
        reminderSentCount: studentToEdit ? studentToEdit.reminderSentCount : 0,
        disableReminders: studentToEdit ? studentToEdit.disableReminders : false,
        lastSubmissionDate: studentToEdit ? studentToEdit.lastSubmissionDate : null,
      };
      onSave(studentData); // onSave will set isProcessing in parent, which comes back as isSaving
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={isSaving ? () => {} : onClose} title={studentToEdit ? 'Edit Student' : 'Add Student'}>
      <div className="relative"> {/* Added relative positioning for overlay */}
        {isSaving && (
          <motion.div
            className="absolute inset-0 bg-card-light/70 dark:bg-card-dark/70 backdrop-blur-sm flex flex-col items-center justify-center rounded-md z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ModernSpinner size={60} />
            <p className="mt-3 text-lg font-semibold text-text-light dark:text-text-dark">
              {studentToEdit ? 'Saving Changes...' : 'Adding Student...'}
            </p>
            <p className="text-sm text-muted-light dark:text-muted-dark">Please wait.</p>
          </motion.div>
        )}
        <form onSubmit={handleSubmit} noValidate className={isSaving ? "opacity-50 pointer-events-none" : ""}>
          <InputField 
            label="Name" name="name" 
            value={formData.name} onChange={handleChange} 
            error={errors.name} autoFocus={true} 
            disabled={isSaving} 
          />
          <InputField 
            label="Email" name="email" type="email" 
            value={formData.email} onChange={handleChange} 
            error={errors.email} 
            disabled={isSaving} 
          />
          <InputField 
            label="Phone Number" name="phoneNumber" type="tel" 
            value={formData.phoneNumber} onChange={handleChange} 
            error={errors.phoneNumber} 
            disabled={isSaving} 
          />
          <InputField 
            label="Codeforces Handle" name="codeforcesHandle" 
            value={formData.codeforcesHandle} onChange={handleChange} 
            error={errors.codeforcesHandle} 
            disabled={isSaving} 
          />
          
          <div className="mt-6 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isSaving} disabled={isSaving}>
              {studentToEdit ? 'Save Changes' : 'Add Student'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};