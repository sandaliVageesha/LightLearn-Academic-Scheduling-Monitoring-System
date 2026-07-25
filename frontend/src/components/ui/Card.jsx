import { motion } from 'framer-motion';

export default function Card({
  children,
  className = '',
  hover = false,
  as = 'div',
  padding = 'p-7',
  ...props
}) {
  const Comp = motion[as] ?? motion.div;

  return (
    <Comp
      whileHover={hover ? { y: -4, boxShadow: '0 28px 52px -24px rgba(26,40,63,0.28)' } : {}}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={`bg-surface/70 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-3xl shadow-glass ${padding} ${className}`}
      {...props}
    >
      {children}
    </Comp>
  );
}
