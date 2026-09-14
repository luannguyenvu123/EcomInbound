import { useEffect, useState } from 'react';

interface ToastProps {
  title: string;
  description: string;
  show: boolean;
  onClose: () => void;
  type?: 'success' | 'error' | 'info';
}

export default function Toast({ title, description, show, onClose, type = 'success' }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  const iconMap = {
    success: { icon: 'done', bg: 'bg-secondary' },
    error: { icon: 'error', bg: 'bg-error' },
    info: { icon: 'info', bg: 'bg-primary' },
  };

  const { icon, bg } = iconMap[type];

  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] flex items-center gap-space-md bg-inverse-surface text-inverse-on-surface px-space-lg py-space-md rounded-xl shadow-xl transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
      }`}
    >
      <div className={`w-7 h-7 rounded-full ${bg} flex items-center justify-center text-on-primary`}>
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      </div>
      <div className="flex flex-col">
        <span className="font-semibold text-headline-sm text-inverse-on-surface">{title}</span>
        <span className="text-body-sm text-outline-variant">{description}</span>
      </div>
    </div>
  );
}
