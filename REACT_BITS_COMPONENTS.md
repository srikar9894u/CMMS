# React Bits Inspired Components for CMMS

This document describes the animated components inspired by React Bits that have been integrated into the CMMS application to enhance the user interface and user experience.

## 📦 Installed Components

### 1. **AnimatedCounter**
Smooth number animations for statistics and metrics.

```tsx
import { AnimatedCounter } from '../components/animations';

<AnimatedCounter
  value={125}
  duration={1}
  prefix="$"
  suffix=" items"
  className="text-3xl font-bold"
/>
```

**Props:**
- `value` (number): The number to display
- `duration` (number, optional): Animation duration in seconds (default: 1)
- `prefix` (string, optional): Text before the number
- `suffix` (string, optional): Text after the number
- `className` (string, optional): Additional CSS classes

**Use Cases:**
- Dashboard statistics (assets, work orders, inventory counts)
- Real-time metric displays
- Progress tracking

---

### 2. **Skeleton**
Loading placeholders with pulse animation.

```tsx
import { Skeleton } from '../components/animations';

<Skeleton variant="text" width="300px" height="20px" />
<Skeleton variant="rectangular" width="100%" height="100px" />
<Skeleton variant="circular" width="50px" />
```

**Props:**
- `variant` ('text' | 'rectangular' | 'circular'): Shape of the skeleton
- `width` (string | number): Width of the skeleton
- `height` (string | number): Height of the skeleton
- `className` (string, optional): Additional CSS classes

**Use Cases:**
- Page loading states
- Table data loading
- Card content placeholders

---

### 3. **ShimmerCard**
Full card shimmer effect for loading states.

```tsx
import { ShimmerCard } from '../components/animations';

<ShimmerCard height="h-32" className="mb-4" />
```

**Props:**
- `height` (string, optional): Tailwind height class (default: 'h-32')
- `className` (string, optional): Additional CSS classes

**Use Cases:**
- Dashboard card loading
- List item loading states
- Content placeholders

---

### 4. **StatusBadge**
Animated status indicators with optional pulse effect.

```tsx
import { StatusBadge } from '../components/animations';

<StatusBadge status="success" label="Operational" />
<StatusBadge status="error" label="Down" pulse={true} />
<StatusBadge status="warning" label="Maintenance" />
<StatusBadge status="info" label="In Progress" />
<StatusBadge status="neutral" label="Idle" />
```

**Props:**
- `status` ('success' | 'warning' | 'error' | 'info' | 'neutral'): Badge type
- `label` (string): Text to display
- `pulse` (boolean, optional): Enable pulse animation (default: false)
- `className` (string, optional): Additional CSS classes

**Use Cases:**
- Asset status indicators
- Work order priorities
- System health status
- PLC connection states

---

### 5. **ProgressBar**
Animated progress bars with smooth transitions.

```tsx
import { ProgressBar } from '../components/animations';

<ProgressBar value={75} showLabel={true} color="success" size="md" />
```

**Props:**
- `value` (number): Progress percentage (0-100)
- `showLabel` (boolean, optional): Show percentage label (default: false)
- `color` ('primary' | 'success' | 'warning' | 'error', optional): Bar color (default: 'primary')
- `size` ('sm' | 'md' | 'lg', optional): Bar height (default: 'md')
- `className` (string, optional): Additional CSS classes

**Use Cases:**
- Work order completion
- Maintenance task progress
- File upload progress
- System resource usage

---

### 6. **Toast Notifications**
Animated toast notifications with auto-dismiss.

```tsx
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/animations';

function MyComponent() {
  const { toasts, success, error, warning, info, removeToast } = useToast();

  const handleAction = () => {
    success('Operation completed successfully!');
    error('Something went wrong!', 5000); // Custom duration
    warning('Please check the configuration');
    info('New update available');
  };

  return (
    <>
      <button onClick={handleAction}>Show Toast</button>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}
```

**Toast Types:**
- `success`: Green toast for successful operations
- `error`: Red toast for errors
- `warning`: Yellow toast for warnings
- `info`: Blue toast for information

**Use Cases:**
- Form submission feedback
- Action confirmations
- Error notifications
- Real-time alerts

---

### 7. **GradientText**
Beautiful gradient text with animation.

```tsx
import { GradientText } from '../components/animations';

<GradientText
  from="from-blue-600"
  via="via-purple-600"
  to="to-pink-600"
>
  Dashboard
</GradientText>
```

**Props:**
- `children` (ReactNode): Text content
- `from` (string, optional): Starting gradient color (Tailwind class)
- `via` (string, optional): Middle gradient color (Tailwind class)
- `to` (string, optional): Ending gradient color (Tailwind class)
- `animate` (boolean, optional): Enable entrance animation (default: true)
- `className` (string, optional): Additional CSS classes

**Use Cases:**
- Page headings
- Hero titles
- Feature highlights
- Brand elements

---

### 8. **PulseIcon**
Icon with subtle pulse animation.

```tsx
import { PulseIcon } from '../components/animations';

<PulseIcon pulse={true}>
  <span className="text-2xl">🔧</span>
</PulseIcon>
```

**Props:**
- `children` (ReactNode): Icon or content to animate
- `pulse` (boolean, optional): Enable pulse animation (default: true)
- `className` (string, optional): Additional CSS classes

**Use Cases:**
- Status indicators
- Alert icons
- Live data indicators
- Attention grabbers

---

## 🎨 Dashboard Integration

The dashboard has been enhanced with these components:

1. **Gradient heading** with animated entrance
2. **Animated counters** for all statistics
3. **Status badges** for asset/work order states with pulse effects
4. **Pulsing icons** for visual interest
5. **Shimmer loading cards** during data fetch
6. **Skeleton loaders** for smooth loading experience

## 🚀 Benefits

### Performance
- All components respect the `animationsEnabled` setting from UIEngineContext
- Animations can be disabled for better performance on low-end devices
- Minimal dependencies (uses existing framer-motion)

### User Experience
- Smooth, professional animations
- Clear visual feedback
- Better loading states
- Attention-grabbing for critical information (pulse on errors)

### Developer Experience
- Easy to use with simple props
- TypeScript support
- Consistent API across components
- Well-documented with examples

## 📝 Best Practices

1. **Use AnimatedCounter** for any numeric data that changes
2. **Use StatusBadge** with `pulse={true}` for critical alerts only
3. **Always provide loading states** with Skeleton or ShimmerCard
4. **Use Toast notifications** sparingly for important user feedback
5. **GradientText** works best for large headings, not body text
6. **PulseIcon** should be used for icons that need attention

## 🔧 Configuration

All components automatically:
- Support light/dark mode through Tailwind
- Respect animation preferences from UIEngineContext
- Work with the existing theme system
- Are fully responsive

## 📚 Additional Resources

- [React Bits Official Site](https://reactbits.dev/)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Tailwind CSS Gradients](https://tailwindcss.com/docs/gradient-color-stops)

---

**Created:** 2025-01-03
**Last Updated:** 2025-01-03
**Version:** 1.0.0
