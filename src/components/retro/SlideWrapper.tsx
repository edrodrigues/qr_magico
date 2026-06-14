import type { ReactNode } from "react";

interface SlideWrapperProps {
  children: ReactNode;
  className?: string;
}

export function SlideWrapper({ children, className = "" }: SlideWrapperProps) {
  return (
    <div className={`flex flex-col items-center justify-center w-full h-full px-8 py-16 text-center ${className}`}>
      {children}
    </div>
  );
}
