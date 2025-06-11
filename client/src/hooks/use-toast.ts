import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'destructive';
}

interface ToastState {
  toasts: Toast[];
}

const toastTimeouts = new Map<string, NodeJS.Timeout>();

let toastCount = 0;

function genId() {
  toastCount = (toastCount + 1) % Number.MAX_SAFE_INTEGER;
  return toastCount.toString();
}

export const useToast = () => {
  const [state, setState] = useState<ToastState>({ toasts: [] });

  const dismiss = useCallback((toastId?: string) => {
    setState((state) => ({
      ...state,
      toasts: toastId
        ? state.toasts.filter((toast) => toast.id !== toastId)
        : [],
    }));

    if (toastId) {
      const timeout = toastTimeouts.get(toastId);
      if (timeout) {
        clearTimeout(timeout);
        toastTimeouts.delete(toastId);
      }
    } else {
      toastTimeouts.forEach((timeout) => clearTimeout(timeout));
      toastTimeouts.clear();
    }
  }, []);

  const toast = useCallback(
    ({ title, description, action, variant = 'default', ...props }: Omit<Toast, 'id'>) => {
      const id = genId();

      const update = (props: Partial<Toast>) =>
        setState((state) => ({
          ...state,
          toasts: state.toasts.map((t) =>
            t.id === id ? { ...t, ...props } : t
          ),
        }));

      const dismiss = () => setState((state) => ({
        ...state,
        toasts: state.toasts.filter((t) => t.id !== id),
      }));

      setState((state) => ({
        ...state,
        toasts: [
          ...state.toasts,
          {
            id,
            title,
            description,
            action,
            variant,
            ...props,
          },
        ],
      }));

      const timeout = setTimeout(() => {
        dismiss();
        toastTimeouts.delete(id);
      }, 5000);

      toastTimeouts.set(id, timeout);

      return {
        id,
        dismiss,
        update,
      };
    },
    []
  );

  return {
    ...state,
    toast,
    dismiss,
  };
};
