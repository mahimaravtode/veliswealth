import { motion, AnimatePresence } from "framer-motion";
import { FinLeapLogo } from "./FinLeapLogo";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        <motion.div
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.2,
          }}
          onAnimationComplete={onComplete}
          className="relative"
        >
          <motion.div
            className="absolute inset-0 rounded-2xl bg-primary/10 blur-xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <div className="relative p-6 bg-primary rounded-2xl shadow-lg shadow-primary/25">
            <FinLeapLogo className="h-16 w-16 text-primary-foreground" />
          </div>
        </motion.div>

        <motion.div
          className="mt-6 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            FinLeap
          </h1>
          <motion.div
            className="mt-4 flex gap-1.5 justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-primary"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
