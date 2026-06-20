import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";

interface CountUpProps {
  end: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export function CountUp({ end, duration = 1.5, suffix = "", prefix = "", className }: CountUpProps) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));

  useEffect(() => {
    count.set(0);
    const controls = animate(count, end, { duration, ease: "easeOut" });
    return controls.stop;
  }, [end, duration, count]);

  return (
    <motion.span className={className}>
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </motion.span>
  );
}
