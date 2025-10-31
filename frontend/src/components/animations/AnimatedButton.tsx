import { motion, HTMLMotionProps } from 'framer-motion';
import { useUIEngine } from '../../context/UIEngineContext';
import { ReactNode } from 'react';

interface AnimatedButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: ReactNode;
  className?: string;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  className = '',
  ...props
}) => {
  const { currentTheme, animationsEnabled } = useUIEngine();

  // If animations are disabled, render regular button
  if (!animationsEnabled) {
    return <button className={className} {...(props as any)}>{children}</button>;
  }

  const tapAnimation = currentTheme.animations.buttonTap as any;

  return (
    <motion.button
      whileTap={tapAnimation.whileTap}
      whileHover={tapAnimation.whileHover}
      transition={tapAnimation.transition}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default AnimatedButton;
