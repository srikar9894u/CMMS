import { motion } from 'framer-motion';
import { useUIEngine } from '../../context/UIEngineContext';
import { ReactNode } from 'react';

interface AnimatedListProps {
  children: ReactNode[];
  className?: string;
  staggerDelay?: number;
}

const AnimatedList: React.FC<AnimatedListProps> = ({
  children,
  className = '',
  staggerDelay = 0.05,
}) => {
  const { animationsEnabled } = useUIEngine();

  // If animations are disabled, render regular list
  if (!animationsEnabled) {
    return <div className={className}>{children}</div>;
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children.map((child, index) => (
        <motion.div key={index} variants={item}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

export default AnimatedList;
