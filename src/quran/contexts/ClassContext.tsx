
import React, { createContext, useContext, useState, type ReactNode } from "react";

export interface Student {
  id: string;
  name: string;
  currentLesson?: {
    surah: string;
    verses: string;
  };
}

export interface Class {
  id: number;
  name: string;
  students: Student[];
}

interface ClassContextType {
  classes: Class[];
  setClasses: (classes: Class[]) => void;
}

const ClassContext = createContext<ClassContextType | undefined>(undefined);

export const initialClasses: Class[] = [
  {
    id: 1,
    name: "Class 1",
    students: [
      { id: "1", name: "Ahmed Karim" },
      { id: "2", name: "Layla Hussein" },
    ],
  },
  {
    id: 2,
    name: "Class 2",
    students: [
      { id: "6", name: "Amina Rahman" },
      { id: "7", name: "Bilal Saeed" },
    ],
  },
  {
    id: 3,
    name: "Class 3",
    students: [
      { id: "11", name: "Sara Ahmed" },
      { id: "12", name: "Hassan Ali" },
    ],
  },
  {
    id: 4,
    name: "Class 4",
    students: [
      { id: "16", name: "Hamza Qureshi" },
      { id: "17", name: "Mariam Baig" },
    ],
  },
  {
    id: 5,
    name: "Class 5",
    students: [
      { id: "21", name: "Zahra Hussain" },
      { id: "22", name: "Imran Malik" },
    ],
  },
  {
    id: 6,
    name: "Class 6",
    students: [
      { id: "26", name: "Tariq Jameel" },
      { id: "27", name: "Asma Khalil" },
    ],
  },
];

interface ClassProviderProps {
  children: ReactNode;
}

// Make sure ClassProvider is explicitly defined as a React function component
export const ClassProvider: React.FC<ClassProviderProps> = ({ children }) => {
  // Use React.useState instead of the named import to ensure it's defined correctly
  const [classes, setClasses] = React.useState<Class[]>(initialClasses);

  return (
    <ClassContext.Provider value={{ classes, setClasses }}>
      {children}
    </ClassContext.Provider>
  );
};

export const useClasses = () => {
  const context = useContext(ClassContext);
  if (context === undefined) {
    throw new Error("useClasses must be used within a ClassProvider");
  }
  return context;
};
