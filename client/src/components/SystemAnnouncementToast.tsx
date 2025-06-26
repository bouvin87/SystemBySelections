import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface SystemAnnouncementToastProps {
  message: string;
  onClose: () => void;
}

export function SystemAnnouncementToast({ message, onClose }: SystemAnnouncementToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-close after 8 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation to complete
    }, 8000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className={`fixed top-4 right-4 z-50 bg-blue-600 text-white p-4 rounded-lg shadow-lg max-w-md transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
      style={{ zIndex: 9999 }}
    >
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold mb-1">Systemmeddelande</h4>
          <p className="text-sm">{message}</p>
        </div>
        <button
          onClick={handleClose}
          className="ml-2 text-white hover:text-gray-200 transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}