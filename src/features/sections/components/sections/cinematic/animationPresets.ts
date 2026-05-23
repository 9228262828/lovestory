import type { Variants } from 'framer-motion'

const cinematicEase: [number, number, number, number] = [0.22, 1, 0.36, 1]

export const cinematicEasing = cinematicEase

export const cinematicContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.24,
      delayChildren: 0.35,
    },
  },
}

export const cinematicFadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 1.1, ease: cinematicEase },
  },
}

export const cinematicSubtitleVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 1, ease: cinematicEase },
  },
}

export const cinematicButtonVariants: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.9, ease: cinematicEase, delay: 0.12 },
  },
}
