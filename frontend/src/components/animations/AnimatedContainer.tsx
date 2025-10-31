import { motion, HTMLMotionProps } from 'framer-motion';
import { useUIEngine } from '../../context/UIEngineContext';
import { ReactNode } from 'react';

interface AnimatedContainerProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  animation?: 'fadeIn' | 'slideIn' | 'scaleIn';
  delay?: number;
  className?: string;
}

const AnimatedContainer: React.FC<AnimatedContainerProps> = ({
  children,
  animation = 'fadeIn',
  delay = 0,
  className = '',
  ...props
}) => {
  const { currentTheme, animationsEnabled } = useUIEngine();

  // If animations are disabled, render without motion
  if (!animationsEnabled) {
    return <div className={className}>{children}</div>;
  }

  const animationVariant = currentTheme.animations[animation] as any;

  return (
    <motion.div
      initial={animationVariant.initial}
      animate={animationVariant.animate}
      exit={animationVariant.exit}
      transition={{ ...animationVariant.transition, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedContainer;
