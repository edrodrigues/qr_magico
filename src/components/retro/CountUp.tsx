import { motion, useTransform, useMotionValue } from "framer-motion";
import { useEffect } from "react";

interface CountUpProps {
  end: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export function CountUp({ end, suffix = "", prefix = "", className }: CountUpProps) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));

  useEffect(() => {
    count.set(0);
    const timeout = setTimeout(() => count.set(end), 100);
    return () => clearTimeout(timeout);
  }, [end, count]);

  return (
    <motion.span className={className}>
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </motion.span>
  );
}
