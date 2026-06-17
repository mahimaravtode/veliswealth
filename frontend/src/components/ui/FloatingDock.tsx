import { cn } from "@/lib/utils";
import { IconLayoutNavbarCollapse } from "@tabler/icons-react";
import {
  AnimatePresence,
  MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

interface DockItem {
  title: string;
  icon: React.ReactNode;
  href: string;
}

export const FloatingDock = ({
  items,
  desktopClassName,
  mobileClassName,
}: {
  items: DockItem[];
  desktopClassName?: string;
  mobileClassName?: string;
}) => {
  return (
    <>
      <FloatingDockDesktop items={items} className={desktopClassName} />
      <FloatingDockMobile items={items} className={mobileClassName} />
    </>
  );
};

const FloatingDockMobile = ({
  items,
  className,
}: {
  items: DockItem[];
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <div className={cn("fixed bottom-6 right-6 z-50 block md:hidden", className)}>
      <AnimatePresence>
        {open && (
          <motion.div
            layoutId="nav"
            className="absolute inset-x-0 bottom-full mb-3 flex flex-col-reverse gap-2 items-center"
          >
            {items.map((item, idx) => {
              const active = location.pathname === item.href;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{
                    opacity: 0,
                    y: 10,
                    scale: 0.8,
                    transition: { delay: idx * 0.05 },
                  }}
                  transition={{ delay: (items.length - 1 - idx) * 0.05 }}
                >
                  <Link
                    to={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg transition-colors duration-200",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-muted-foreground border border-border/50"
                    )}
                  >
                    <div className="h-5 w-5">{item.icon}</div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        onClick={() => setOpen(!open)}
        whileTap={{ scale: 0.9 }}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-all duration-300",
          open
            ? "bg-primary text-primary-foreground rotate-45"
            : "bg-card text-foreground border border-border/50"
        )}
      >
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <IconLayoutNavbarCollapse className="h-6 w-6" />
        </motion.div>
      </motion.button>
    </div>
  );
};

const FloatingDockDesktop = ({
  items,
  className,
}: {
  items: DockItem[];
  className?: string;
}) => {
  const mouseX = useMotionValue(Infinity);
  const location = useLocation();

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 mx-auto hidden h-16 items-end gap-2 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 shadow-xl shadow-black/5 px-4 pb-3 md:flex",
        className
      )}
    >
      {items.map((item) => (
        <IconContainer
          mouseX={mouseX}
          key={item.title}
          active={location.pathname === item.href}
          {...item}
        />
      ))}
    </motion.div>
  );
};

function IconContainer({
  mouseX,
  title,
  icon,
  href,
  active,
}: {
  mouseX: MotionValue;
  title: string;
  icon: React.ReactNode;
  href: string;
  active: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthTransform = useTransform(distance, [-150, 0, 150], [40, 70, 40]);
  const heightTransform = useTransform(distance, [-150, 0, 150], [40, 70, 40]);
  const widthTransformIcon = useTransform(distance, [-150, 0, 150], [20, 36, 20]);
  const heightTransformIcon = useTransform(distance, [-150, 0, 150], [20, 36, 20]);

  const width = useSpring(widthTransform, { mass: 0.1, stiffness: 150, damping: 12 });
  const height = useSpring(heightTransform, { mass: 0.1, stiffness: 150, damping: 12 });
  const widthIcon = useSpring(widthTransformIcon, { mass: 0.1, stiffness: 150, damping: 12 });
  const heightIcon = useSpring(heightTransformIcon, { mass: 0.1, stiffness: 150, damping: 12 });

  const [hovered, setHovered] = useState(false);

  return (
    <Link to={href}>
      <motion.div
        ref={ref}
        style={{ width, height }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "relative flex aspect-square items-center justify-center rounded-full transition-colors duration-200",
          active
            ? "bg-primary/20"
            : "bg-muted/60 hover:bg-muted"
        )}
      >
        {active && (
          <motion.div
            layoutId="activeTab"
            className="absolute inset-0 rounded-full bg-primary/15"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 2, x: "-50%" }}
              className="absolute -top-10 left-1/2 z-50 w-fit whitespace-pre rounded-xl border border-border/50 bg-card/95 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold shadow-lg"
            >
              {title}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          style={{ width: widthIcon, height: heightIcon }}
          className={cn(
            "flex items-center justify-center transition-colors duration-200",
            active ? "text-primary" : "text-muted-foreground"
          )}
        >
          {icon}
        </motion.div>
      </motion.div>
    </Link>
  );
}
