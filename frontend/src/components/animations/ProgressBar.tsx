import { motion } from 'framer-motion';
import { useUIEngine } from '../../context/UIEngineContext';

interface ProgressBarProps {
  value: number; // 0-100
  showLabel?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  showLabel = false,
  color = 'primary',
  size = 'md',
  className = '',
}) => {
  const { animationsEnabled } = useUIEngine();

  const colorConfig = {
    primary: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  };

  const sizeConfig = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className={`w-full ${className}`}>
      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${sizeConfig[size]}`}>
        {animationsEnabled ? (
          <motion.div
            className={`${sizeConfig[size]} ${colorConfig[color]} rounded-full`}
            initial={{ width: '0%' }}
            animate={{ width: `${clampedValue}%` }}
            transition={{
              duration: 0.8,
              ease: 'easeOut',
            }}
          />
        ) : (
          <div
            className={`${sizeConfig[size]} ${colorConfig[color]} rounded-full`}
            style={{ width: `${clampedValue}%` }}
          />
        )}
      </div>
      {showLabel && (
        <motion.div
          className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-right"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {clampedValue}%
        </motion.div>
      )}
    </div>
  );
};

export default ProgressBar;
