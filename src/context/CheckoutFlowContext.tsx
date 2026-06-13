import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import CheckoutFlowModal from '../components/CheckoutFlowModal';

interface CheckoutFlowContextType {
  startCheckout: () => void;
  closeCheckout: () => void;
  isOpen: boolean;
}

const CheckoutFlowContext = createContext<CheckoutFlowContextType | undefined>(undefined);

export const CheckoutFlowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const startCheckout = () => {
    setIsOpen(true);
  };

  const closeCheckout = () => {
    setIsOpen(false);
  };

  return (
    <CheckoutFlowContext.Provider value={{ startCheckout, closeCheckout, isOpen }}>
      {children}
      {isOpen && <CheckoutFlowModal onClose={closeCheckout} />}
    </CheckoutFlowContext.Provider>
  );
};

export const useCheckoutFlow = () => {
  const context = useContext(CheckoutFlowContext);
  if (context === undefined) {
    throw new Error('useCheckoutFlow must be used within a CheckoutFlowProvider');
  }
  return context;
};
