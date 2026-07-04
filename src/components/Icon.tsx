interface IconProps {
  name: string;
  className?: string;
  filled?: boolean;
}

export function Icon({ name, className, filled }: IconProps) {
  return (
    <span
      className={className ? `material-symbols-outlined ${className}` : "material-symbols-outlined"}
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
      aria-hidden
    >
      {name}
    </span>
  );
}
