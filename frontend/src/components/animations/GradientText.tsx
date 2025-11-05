import { motion } from 'framer-motion';
import { useUIEngine } from '../../context/UIEngineContext';
import { ReactNode } from 'react';

interface GradientTextProps {
  children: ReactNode;
  from?: string;
  via?: string;
  to?: string;
  className?: string;
  animate?: boolean;
}

const GradientText: React.FC<GradientTextProps> = ({
  children,
  from = 'from-blue-500',
  via = 'via-purple-500',
  to = 'to-pink-500',
  className = '',
  animate = true,
}) => {
  const { animationsEnabled } = useUIEngine();

  const gradientClass = `bg-gradient-to-r ${from} ${via} ${to} bg-clip-text text-transparent`;

  if (!animationsEnabled || !animate) {
    return <span className={`${gradientClass} ${className}`}>{children}</span>;
  }

  return (
    <motion.span
      className={`${gradientClass} ${className}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.span>
  );
};

export default GradientText;
