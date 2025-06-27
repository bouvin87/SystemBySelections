import React from 'react';

// Global toast state
let toastListeners: Array<(toasts: Toast[]) => void> = [];
let toasts: Toast[] = [];
let toastCount = 0;

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'destructive';
}

function genId() {
  toastCount = (toastCount + 1) % Number.MAX_SAFE_INTEGER;
  return toastCount.toString();
}

function notifyListeners() {
  toastListeners.forEach(listener => listener([...toasts]));
}

export function addToast(toastProps: Omit<Toast, 'id'>) {
  const id = genId();
  const toast: Toast = {
    id,
    ...toastProps,
  };
  
  toasts.push(toast);
  notifyListeners();
  
  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    removeToast(id);
  }, 5000);
  
  return id;
}

export function removeToast(id: string) {
  toasts = toasts.filter(t => t.id !== id);
  notifyListeners();
}

export function useToast() {
  const [currentToasts, setCurrentToasts] = React.useState<Toast[]>([]);
  
  React.useEffect(() => {
    const listener = (newToasts: Toast[]) => {
      setCurrentToasts(newToasts);
    };
    
    toastListeners.push(listener);
    setCurrentToasts([...toasts]);
    
    return () => {
      toastListeners = toastListeners.filter(l => l !== listener);
    };
  }, []);
  
  const toast = React.useCallback((props: Omit<Toast, 'id'>) => {
    addToast(props);
  }, []);
  
  const dismiss = React.useCallback((id?: string) => {
    if (id) {
      removeToast(id);
    } else {
      toasts = [];
      notifyListeners();
    }
  }, []);
  
  return {
    toasts: currentToasts,
    toast,
    dismiss,
  };
}
