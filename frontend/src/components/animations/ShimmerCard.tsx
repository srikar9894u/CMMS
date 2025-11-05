import { motion } from 'framer-motion';
import { useUIEngine } from '../../context/UIEngineContext';

interface ShimmerCardProps {
  className?: string;
  height?: string;
}

const ShimmerCard: React.FC<ShimmerCardProps> = ({
  className = '',
  height = 'h-32',
}) => {
  const { animationsEnabled } = useUIEngine();

  const baseClasses = `${height} bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 rounded-lg overflow-hidden relative`;

  if (!animationsEnabled) {
    return <div className={`${baseClasses} ${className}`} />;
  }

  return (
    <div className={`${baseClasses} ${className}`}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
};

export default ShimmerCard;
