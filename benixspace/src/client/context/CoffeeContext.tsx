import React, { createContext, useContext, useState } from 'react';

interface CoffeeContextType {
  isCoffeeModalOpen: boolean;
  initialCups: number;
  openCoffeeModal: (cups?: number) => void;
  closeCoffeeModal: () => void;
}

const CoffeeContext = createContext<CoffeeContextType | undefined>(undefined);

export const CoffeeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCoffeeModalOpen, setIsCoffeeModalOpen] = useState(false);
  const [initialCups, setInitialCups] = useState(1);

  const openCoffeeModal = (cups: number = 1) => {
    setInitialCups(cups);
    setIsCoffeeModalOpen(true);
  };

  const closeCoffeeModal = () => {
    setIsCoffeeModalOpen(false);
  };

  return (
    <CoffeeContext.Provider
      value={{
        isCoffeeModalOpen,
        initialCups,
        openCoffeeModal,
        closeCoffeeModal,
      }}
    >
      {children}
    </CoffeeContext.Provider>
  );
};

export const useCoffee = () => {
  const context = useContext(CoffeeContext);
  if (!context) {
    throw new Error('useCoffee must be used within a CoffeeProvider');
  }
  return context;
};
