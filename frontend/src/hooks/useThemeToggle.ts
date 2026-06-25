import { useCallback, useEffect, useState } from 'react';
import { useUIStore } from '@/store/useUIStore';

type AnimationVariant = 'circle-blur' | 'rectangle';

function createCircleBlurSVG(start: string) {
  const positions: Record<string, { cx: string; cy: string }> = {
    'bottom-left': { cx: '0', cy: '40' },
    'bottom-right': { cx: '40', cy: '40' },
    center: { cx: '20', cy: '20' },
  };
  const { cx, cy } = positions[start] || positions.center;
  return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><defs><filter id="blur"><feGaussianBlur stdDeviation="2"/></filter></defs><circle cx="${cx}" cy="${cy}" r="18" fill="white" filter="url(%23blur)"/></svg>`;
}

function createAnimation(variant: AnimationVariant, start: string) {
  if (variant === 'rectangle') {
    const isTopDown = start === 'top-down';
    return {
      name: `rectangle-${start}`,
      css: `
        ::view-transition-group(root) {
          animation-duration: 0.7s;
          animation-timing-function: var(--expo-out);
        }
        ::view-transition-new(root) {
          animation-name: rect-reveal-${start};
        }
        ::view-transition-old(root),
        .dark::view-transition-old(root) {
          animation: none;
          z-index: -1;
        }
        .dark::view-transition-new(root) {
          animation-name: rect-reveal-${start};
        }
        @keyframes rect-reveal-${start} {
          from {
            clip-path: ${isTopDown ? 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)' : 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)'};
          }
          to {
            clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);
          }
        }
      `,
    };
  }

  const svg = createCircleBlurSVG(start);
  const origins: Record<string, string> = {
    'bottom-left': 'bottom left',
    'bottom-right': 'bottom right',
    center: 'center',
  };
  const origin = origins[start] || 'center';
  const name = `circle-blur-${start}`;

  return {
    name,
    css: `
      ::view-transition-group(root) {
        animation-timing-function: var(--expo-out);
      }
      ::view-transition-new(root) {
        mask: url('${svg}') ${start.replace('-', ' ')} / 0 no-repeat;
        mask-origin: content-box;
        animation: scale-${name} 1s;
        transform-origin: ${origin};
      }
      ::view-transition-old(root),
      .dark::view-transition-old(root) {
        animation: scale-${name} 1s;
        transform-origin: ${origin};
        z-index: -1;
      }
      @keyframes scale-${name} {
        to {
          mask-size: 350vmax;
        }
      }
    `,
  };
}

export function useThemeToggle(variant: AnimationVariant = 'rectangle') {
  const { theme, toggleTheme } = useUIStore();
  const [isDark, setIsDark] = useState(theme === 'dark');

  useEffect(() => {
    setIsDark(theme === 'dark');
  }, [theme]);

  const styleId = 'theme-transition-styles';

  const updateStyles = useCallback((css: string) => {
    let el = document.getElementById(styleId) as HTMLStyleElement;
    if (!el) {
      el = document.createElement('style');
      el.id = styleId;
      document.head.appendChild(el);
    }
    el.textContent = css;
  }, []);

  const animatedToggle = useCallback(() => {
    const isCurrentlyDark = useUIStore.getState().theme === 'dark';
    const start = isCurrentlyDark ? 'bottom-up' : 'top-down';

    setIsDark(!isCurrentlyDark);

    const animation = createAnimation(variant, start);
    updateStyles(animation.css);

    const doSwitch = () => {
      useUIStore.getState().toggleTheme();
    };

    if (!document.startViewTransition) {
      doSwitch();
      return;
    }

    document.startViewTransition(doSwitch);
  }, [updateStyles, variant]);

  return { isDark, animatedToggle };
}
