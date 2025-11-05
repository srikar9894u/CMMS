import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { useUIEngine } from '../../context/UIEngineContext';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1,
  className = '',
  prefix = '',
  suffix = '',
}) => {
  const { animationsEnabled } = useUIEngine();
  const [displayValue, setDisplayValue] = useState(0);

  const spring = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
  });

  const display = useTransform(spring, (current) =>
    Math.round(current).toLocaleString()
  );

  useEffect(() => {
    if (animationsEnabled) {
      spring.set(value);
    } else {
      setDisplayValue(value);
    }
  }, [value, spring, animationsEnabled]);

  useEffect(() => {
    const unsubscribe = display.on('change', (latest) => {
      setDisplayValue(parseFloat(latest.replace(/,/g, '')));
    });
    return unsubscribe;
  }, [display]);

  if (!animationsEnabled) {
    return (
      <span className={className}>
        {prefix}
        {value.toLocaleString()}
        {suffix}
      </span>
    );
  }

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </motion.span>
  );
};

export default AnimatedCounter;
