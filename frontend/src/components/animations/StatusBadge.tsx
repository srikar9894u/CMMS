import { motion } from 'framer-motion';
import { useUIEngine } from '../../context/UIEngineContext';

interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  label: string;
  pulse?: boolean;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  pulse = false,
  className = '',
}) => {
  const { animationsEnabled } = useUIEngine();

  const statusConfig = {
    success: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-800 dark:text-green-300',
      border: 'border-green-300 dark:border-green-700',
      dot: 'bg-green-500',
    },
    warning: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-800 dark:text-yellow-300',
      border: 'border-yellow-300 dark:border-yellow-700',
      dot: 'bg-yellow-500',
    },
    error: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-800 dark:text-red-300',
      border: 'border-red-300 dark:border-red-700',
      dot: 'bg-red-500',
    },
    info: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-800 dark:text-blue-300',
      border: 'border-blue-300 dark:border-blue-700',
      dot: 'bg-blue-500',
    },
    neutral: {
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-800 dark:text-gray-300',
      border: 'border-gray-300 dark:border-gray-600',
      dot: 'bg-gray-500',
    },
  };

  const config = statusConfig[status];

  const Badge = () => (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${config.bg} ${config.text} ${config.border} text-xs font-medium ${className}`}
    >
      {pulse && animationsEnabled ? (
        <motion.span
          className={`w-2 h-2 rounded-full ${config.dot}`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.7, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ) : (
        <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      )}
      {label}
    </div>
  );

  if (!animationsEnabled) {
    return <Badge />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="inline-block"
    >
      <Badge />
    </motion.div>
  );
};

export default StatusBadge;
