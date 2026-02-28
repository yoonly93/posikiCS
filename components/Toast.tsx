'use client';

import { useEffect, useState } from 'react';

interface ToastItem {
  id: number;
  type: 'success' | 'error';
  message: string;
}

let toastId = 0;
let addToastFn: ((type: 'success' | 'error', message: string) => void) | null = null;

export function showToast(type: 'success' | 'error', message: string) {
  addToastFn?.(type, message);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    addToastFn = (type, message) => {
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, type, message }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3300);
    };
    return () => {
      addToastFn = null;
    };
  }, []);

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: ToastItem }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setShow(true));
    });

    const timer = setTimeout(() => setShow(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`toast ${toast.type}${show ? ' show' : ''}`}>
      {toast.message}
    </div>
  );
}
