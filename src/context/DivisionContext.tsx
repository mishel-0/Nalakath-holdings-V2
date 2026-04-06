'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export const companies = [
  { id: "nalakath-holdings-main", name: "Nalakath Holdings", division: "Group HQ" },
  { id: "green-villa", name: "Green Villa", division: "Real Estate" },
  { id: "oval-palace", name: "Oval Palace Resort", division: "Hospitality" },
  { id: "nalakath-construction", name: "Nalakath Construction", division: "Infrastructure" },
];

interface DivisionContextType {
  activeDivision: typeof companies[0];
  setDivision: (id: string) => void;
}

const DivisionContext = createContext<DivisionContextType | undefined>(undefined);

export function DivisionProvider({ children }: { children: ReactNode }) {
  const [activeDivision, setActiveDivision] = useState(companies[0]);

  const setDivision = (id: string) => {
    const found = companies.find(c => c.id === id);
    if (found) setActiveDivision(found);
  };

  return (
    <DivisionContext.Provider value={{ activeDivision, setDivision }}>
      {children}
    </DivisionContext.Provider>
  );
}

export function useDivision() {
  const context = useContext(DivisionContext);
  if (!context) throw new Error("useDivision must be used within DivisionProvider");
  return context;
}
