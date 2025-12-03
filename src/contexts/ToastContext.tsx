import React, { createContext, useContext, useState, ReactNode } from 'react';
import Toast, { ToastType } from '@/components/molecules/Toast/Toast';

interface ToastContextType {
  showToast: (message: string, type: ToastType, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('info');
  const [duration, setDuration] = useState(3000);

  const showToast = (msg: string, toastType: ToastType, toastDuration = 3000) => {
    setMessage(msg);
    setType(toastType);
    setDuration(toastDuration);
    setVisible(true);
  };

  const showSuccess = (msg: string, toastDuration = 3000) => {
    showToast(msg, 'success', toastDuration);
  };

  const showError = (msg: string, toastDuration = 3000) => {
    showToast(msg, 'error', toastDuration);
  };

  const showWarning = (msg: string, toastDuration = 3000) => {
    showToast(msg, 'warning', toastDuration);
  };

  const showInfo = (msg: string, toastDuration = 3000) => {
    showToast(msg, 'info', toastDuration);
  };

  const hideToast = () => {
    setVisible(false);
  };

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
      }}
    >
      {children}
      <Toast
        visible={visible}
        message={message}
        type={type}
        duration={duration}
        onHide={hideToast}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
