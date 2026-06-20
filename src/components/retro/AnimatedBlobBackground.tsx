import { motion } from "framer-motion";
import { DEFAULT_PALETTE } from "../../lib/genrePalettes";

interface AnimatedBlobBackgroundProps {
  palette?: string[];
  reducedMotion?: boolean;
}

const BLOB_PATHS = [
  "M40.5,-62.7C53,-53.4,63.7,-41.2,69.3,-26.8C74.9,-12.4,75.3,4.1,68.9,18.1C62.5,32.1,49.3,43.5,35.1,52.1C20.9,60.6,5.9,66.2,-8.7,65.1C-23.3,64,-37.5,56.2,-48.5,44.8C-59.5,33.4,-67.2,18.4,-68.8,2.4C-70.4,-13.6,-65.8,-30.5,-55.5,-42.9C-45.2,-55.3,-29.3,-63.2,-13.6,-65.6C2.1,-68,17.9,-64.9,31.8,-56.4Z",
  "M32.4,-49.2C45.3,-42.1,61.7,-39.2,69.4,-29.5C77.1,-19.9,76.1,-3.4,70,10.8C63.9,25,52.8,36.9,40.3,47.1C27.8,57.3,13.9,65.8,-1.5,68.5C-16.9,71.1,-33.7,67.8,-46.1,58.2C-58.5,48.6,-66.4,32.7,-69.3,15.7C-72.3,-1.3,-70.4,-19.5,-61.7,-33.1C-53,-46.7,-37.6,-55.7,-22.5,-59.8C-7.5,-63.9,7.3,-63.1,19.5,-56.8Z",
  "M33.7,-50.6C47.7,-43.3,65.6,-40.2,71.8,-29.9C78,-19.6,72.4,-2.1,65.1,12.8C57.8,27.7,48.7,40,36.9,49.5C25.1,59,10.5,65.7,-3.2,63.9C-17,62.2,-29.9,52,-39.6,40.1C-49.3,28.2,-55.7,14.6,-58.1,-0.8C-60.5,-16.2,-58.9,-32.4,-50.1,-42.5C-41.4,-52.5,-25.6,-56.4,-10.8,-56.2C4,-56,18.8,-51.7,33.7,-50.6Z",
];

export function AnimatedBlobBackground({ palette = DEFAULT_PALETTE, reducedMotion = false }: AnimatedBlobBackgroundProps) {

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      <svg
        className="absolute w-[120%] h-[120%] -top-[10%] -left-[10%]"
        viewBox="-100 -100 200 200"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="blobGrad" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor={palette[0]} stopOpacity={0.3} />
            <stop offset="60%" stopColor={palette[1] ?? palette[0]} stopOpacity={0.15} />
            <stop offset="100%" stopColor={palette[2] ?? palette[0]} stopOpacity={0} />
          </radialGradient>
        </defs>
        <motion.path
          d={BLOB_PATHS[0]}
          fill="url(#blobGrad)"
          animate={reducedMotion ? {} : { d: BLOB_PATHS, rotate: 360 }}
          transition={{
            d: { duration: 8, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" },
            rotate: { duration: 30, ease: "linear", repeat: Infinity },
          }}
          style={{ transformOrigin: "center" }}
        />
        <motion.path
          d={BLOB_PATHS[1]}
          fill="url(#blobGrad)"
          animate={reducedMotion ? {} : { d: BLOB_PATHS.slice().reverse(), rotate: -360 }}
          transition={{
            d: { duration: 10, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" },
            rotate: { duration: 40, ease: "linear", repeat: Infinity },
          }}
          style={{ transformOrigin: "center" }}
          opacity={0.6}
        />
      </svg>
    </div>
  );
}
