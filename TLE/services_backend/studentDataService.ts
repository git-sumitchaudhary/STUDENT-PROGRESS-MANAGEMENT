
import { Student, CFUserInfo, CFSubmission } from '../types'; 
import { getUserInfo, getUserSubmissions, clearEndpointCache } from './codeforcesService'; 
import { v4 as uuidv4 } from 'uuid';
import { INACTIVITY_THRESHOLD_DAYS } from '../constants'; 

const STUDENTS_STORAGE_KEY = 'studentsData';
const LAST_GLOBAL_SYNC_KEY = 'lastGlobalSyncTime';
const SYNC_SETTINGS_KEY = 'syncSettings';

interface SyncSettings {
  hour: number; // 0-23
  frequencyDays: number; // e.g., 1 for daily
}

const DEFAULT_SYNC_SETTINGS: SyncSettings = {
  hour: 2, // 2 AM
  frequencyDays: 1,
};

// Helper to get students from localStorage
const getStudents = (): Student[] => {
  const data = localStorage.getItem(STUDENTS_STORAGE_KEY);
  if (!data) {
    return [];
  }
  try {
    const parsedData = JSON.parse(data);
    if (Array.isArray(parsedData)) {
      return parsedData;
    } else {
      console.error("Stored student data is not an array. Clearing and returning empty.", parsedData);
      localStorage.removeItem(STUDENTS_STORAGE_KEY);
      return [];
    }
  } catch (error) {
    console.error("Failed to parse students data from localStorage. Clearing and returning empty.", error);
    localStorage.removeItem(STUDENTS_STORAGE_KEY); // Remove corrupted data
    return [];
  }
};

// Helper to save students to localStorage
const saveStudents = (students: Student[]): boolean => {
  try {
    localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(students));
    return true;
  } catch (error) {
    console.error("Failed to save students data to localStorage:", error);
    return false;
  }
};

export const getAllStudents = (): Student[] => {
  return getStudents();
};

export const addStudent = (studentData: Omit<Student, 'id' | 'currentRating' | 'maxRating' | 'lastSyncedAt' | 'reminderSentCount' | 'disableReminders'>): Student | null => {
  const students = getStudents();
  const newStudent: Student = {
    ...studentData,
    id: uuidv4(),
    currentRating: null,
    maxRating: null,
    lastSyncedAt: null,
    reminderSentCount: 0,
    disableReminders: false,
  };
  // Clear any potential old cache for this handle if it existed with different casing or was deleted
  clearEndpointCache(`user.info?handles=${newStudent.codeforcesHandle}`);
  clearEndpointCache(`user.rating?handle=${newStudent.codeforcesHandle}`);
  clearEndpointCache(`user.status?handle=${newStudent.codeforcesHandle}&from=1&count=50`); 
  
  students.push(newStudent);
  if (saveStudents(students)) {
    return newStudent;
  }
  return null; // Return null if saving failed
};

export const updateStudent = (updatedStudent: Student): Student | null => {
  let students = getStudents();
  const index = students.findIndex(s => s.id === updatedStudent.id);
  if (index !== -1) {
    // If handle changed, clear old cache entries
    if (students[index].codeforcesHandle.toLowerCase() !== updatedStudent.codeforcesHandle.toLowerCase()) {
        clearEndpointCache(`user.info?handles=${students[index].codeforcesHandle}`);
        clearEndpointCache(`user.rating?handle=${students[index].codeforcesHandle}`);
        // etc. for other relevant endpoints
    }
    students[index] = updatedStudent;
    if (saveStudents(students)) {
      return updatedStudent;
    }
    return null; // Return null if saving failed
  }
  return null;
};

export type DeleteStatus = 'SUCCESS' | 'NOT_FOUND' | 'SAVE_FAILED';

export const deleteStudent = (studentId: string): DeleteStatus => {
  let students = getStudents();
  const studentIndex = students.findIndex(s => s.id === studentId);

  if (studentIndex === -1) {
    return 'NOT_FOUND';
  }

  const studentToDelete = students[studentIndex];
  
  // Clear cache associated with this student
  clearEndpointCache(`user.info?handles=${studentToDelete.codeforcesHandle}`);
  clearEndpointCache(`user.rating?handle=${studentToDelete.codeforcesHandle}`);
  clearEndpointCache(`user.status?handle=${studentToDelete.codeforcesHandle}&from=1&count=50`); 
  // ... clear other relevant endpoints

  students = students.filter(s => s.id !== studentId);
  
  if (saveStudents(students)) {
    return 'SUCCESS';
  } else {
    return 'SAVE_FAILED';
  }
};

export const syncStudentData = async (student: Student, forceRefresh: boolean = false): Promise<Student> => {
  try {
    const [userInfo] = await getUserInfo([student.codeforcesHandle], forceRefresh);
    if (userInfo) {
      student.currentRating = userInfo.rating ?? student.currentRating; 
      student.maxRating = userInfo.maxRating ?? student.maxRating;
    }

    const submissions = await getUserSubmissions(student.codeforcesHandle, 50, forceRefresh); 
    const latestOkSubmission = submissions
      .filter(sub => sub.verdict === 'OK')
      .sort((a, b) => b.creationTimeSeconds - a.creationTimeSeconds)[0];
    
    const anyLatestSubmission = submissions
        .sort((a,b) => b.creationTimeSeconds - a.creationTimeSeconds)[0];

    if (latestOkSubmission) {
      student.lastSubmissionDate = new Date(latestOkSubmission.creationTimeSeconds * 1000).toISOString();
    } else if (anyLatestSubmission) { 
        student.lastSubmissionDate = new Date(anyLatestSubmission.creationTimeSeconds * 1000).toISOString();
    }
    
    student.lastSyncedAt = new Date().toISOString();
    updateStudent(student); 
    return student;
  } catch (error) {
    console.error(`Failed to sync data for ${student.codeforcesHandle}:`, error);
    return student; 
  }
};

export const syncAllStudents = async (
    forceRefresh: boolean = false, 
    onProgress?: (index: number, total: number, studentName: string) => void
  ): Promise<Student[]> => {
  const students = getStudents();
  const updatedStudents: Student[] = [];
  for (let i = 0; i < students.length; i++) {
    if (onProgress) onProgress(i, students.length, students[i].name);
    const updatedStudent = await syncStudentData(students[i], forceRefresh); 
    updatedStudents.push(updatedStudent);
  }
  localStorage.setItem(LAST_GLOBAL_SYNC_KEY, new Date().toISOString());
  return updatedStudents;
};


export const getSyncSettings = (): SyncSettings => {
  const data = localStorage.getItem(SYNC_SETTINGS_KEY);
  if (!data) return DEFAULT_SYNC_SETTINGS;
  try {
    const parsedSettings = JSON.parse(data);
    if (typeof parsedSettings.hour === 'number' && typeof parsedSettings.frequencyDays === 'number') {
      return parsedSettings;
    }
  } catch (e) {
    console.error("Failed to parse sync settings, using defaults:", e);
  }
  return DEFAULT_SYNC_SETTINGS;
}

export const saveSyncSettings = (settings: SyncSettings): void => {
  try {
    localStorage.setItem(SYNC_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save sync settings to localStorage:", error);
  }
}

export const getLastGlobalSyncTime = (): string | null => {
  return localStorage.getItem(LAST_GLOBAL_SYNC_KEY);
}

export const checkInactivityAndNotify = (students: Student[]): { student: Student, message: string }[] => {
  const notifications: { student: Student, message: string }[] = [];
  const now = new Date();

  students.forEach(student => {
    if (student.disableReminders) return;

    let isActive = true;
    if (student.lastSubmissionDate) {
      const lastSubDate = new Date(student.lastSubmissionDate);
      const diffDays = (now.getTime() - lastSubDate.getTime()) / (1000 * 3600 * 24);
      if (diffDays > INACTIVITY_THRESHOLD_DAYS) {
        isActive = false;
      }
    } else { 
      isActive = false; 
    }
    
    if (!isActive) {
      student.reminderSentCount = (student.reminderSentCount || 0) + 1;
      updateStudent(student); 
      notifications.push({ student, message: `Reminder: ${student.name} (${student.email}) has been inactive for >${INACTIVITY_THRESHOLD_DAYS} days. Reminders sent: ${student.reminderSentCount}.` });
    }
  });
  return notifications;
};
