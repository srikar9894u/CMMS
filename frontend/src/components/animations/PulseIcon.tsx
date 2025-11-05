import { motion } from 'framer-motion';
import { useUIEngine } from '../../context/UIEngineContext';
import { ReactNode } from 'react';

interface PulseIconProps {
  children: ReactNode;
  pulse?: boolean;
  className?: string;
}

const PulseIcon: React.FC<PulseIconProps> = ({
  children,
  pulse = true,
  className = '',
}) => {
  const { animationsEnabled } = useUIEngine();

  if (!animationsEnabled || !pulse) {
    return <span className={className}>{children}</span>;
  }

  return (
    <motion.span
      className={className}
      animate={{
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.span>
  );
};

export default PulseIcon;
