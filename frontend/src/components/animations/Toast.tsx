import { motion } from 'framer-motion';
import { useEffect } from 'react';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  message,
  duration = 3000,
  onClose,
}) => {

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => onClose(id), duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const typeConfig = {
    success: {
      bg: 'bg-green-500',
      icon: '✓',
      iconBg: 'bg-green-600',
    },
    error: {
      bg: 'bg-red-500',
      icon: '✕',
      iconBg: 'bg-red-600',
    },
    warning: {
      bg: 'bg-yellow-500',
      icon: '⚠',
      iconBg: 'bg-yellow-600',
    },
    info: {
      bg: 'bg-blue-500',
      icon: 'ℹ',
      iconBg: 'bg-blue-600',
    },
  };

  const config = typeConfig[type];

  const toastVariants = {
    initial: { opacity: 0, y: -50, scale: 0.8 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, x: 300, scale: 0.8 },
  };

  return (
    <motion.div
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
      className={`${config.bg} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-md`}
    >
      <div className={`${config.iconBg} w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold`}>
        {config.icon}
      </div>
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={() => onClose(id)}
        className="hover:bg-white/20 rounded p-1 transition-colors"
      >
        ✕
      </button>
    </motion.div>
  );
};

export default Toast;
