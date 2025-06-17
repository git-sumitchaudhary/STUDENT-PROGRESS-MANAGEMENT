
import { Student } from '../types'; 

export const convertToCSV = (data: Student[]): string => {
  if (!data || data.length === 0) {
    return "";
  }
  const headers = ["Name", "Email", "Phone Number", "Codeforces Handle", "Current Rating", "Max Rating", "Last Synced"];
  const rows = data.map(student => [
    student.name,
    student.email,
    student.phoneNumber,
    student.codeforcesHandle,
    student.currentRating ?? 'N/A',
    student.maxRating ?? 'N/A',
    student.lastSyncedAt ? new Date(student.lastSyncedAt).toLocaleString() : 'N/A'
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
};

export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
    