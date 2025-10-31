import { motion, HTMLMotionProps } from 'framer-motion';
import { useUIEngine } from '../../context/UIEngineContext';
import { ReactNode } from 'react';

interface AnimatedCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  className?: string;
  enableHover?: boolean;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className = '',
  enableHover = true,
  ...props
}) => {
  const { currentTheme, animationsEnabled } = useUIEngine();

  // If animations are disabled, render regular div
  if (!animationsEnabled) {
    return <div className={className}>{children}</div>;
  }

  const hoverAnimation = enableHover ? (currentTheme.animations.cardHover as any) : {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={hoverAnimation.whileHover}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard;
