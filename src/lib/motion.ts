export const motionConfig = {
  reducedMotion: false,
  animationDuration: 300,
  staggerDelay: 50,
};

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function getMotionSettings() {
  if (typeof window === 'undefined') {
    return motionConfig;
  }

  return {
    ...motionConfig,
    reducedMotion: prefersReducedMotion(),
  };
}

export function shouldAnimate(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }

  return !prefersReducedMotion();
}