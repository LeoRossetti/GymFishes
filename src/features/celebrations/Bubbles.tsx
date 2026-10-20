import { motion } from 'motion/react'
import { bubbleField } from './bubbleField'

const FIELD = bubbleField()

/**
 * The bubbles behind a celebration (spec §7): a seeded, irregular field of thin rings with a
 * translucent fill and the small highlight that makes a flat bubble read as one. Each starts
 * just below the screen, fades in, drifts sideways as it rises, and swells a touch as it fades
 * out at the top. Not rendered under reduced motion.
 */
export function Bubbles() {
  return (
    <>
      {FIELD.map((b, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="absolute rounded-full border-water-hi bg-water/15"
          style={{ left: `${b.left}%`, bottom: -b.size, width: b.size, height: b.size, borderWidth: b.size > 12 ? 1.5 : 1 }}
          initial={{ y: 0, x: 0, opacity: 0, scale: 0.8 }}
          animate={{
            y: -b.rise,
            x: [0, b.sway, -b.sway * 0.6, b.sway * 0.4, 0],
            opacity: [0, 0.9, 0.9, 0.9, 0],
            scale: [0.8, 1, 1, 1, 1.15],
          }}
          transition={{
            duration: b.duration,
            delay: b.delay,
            ease: 'easeOut',
            x: { duration: b.duration, delay: b.delay, ease: 'easeInOut' },
          }}
        >
          <span className="absolute left-[22%] top-[16%] h-[24%] w-[24%] rounded-full bg-ink" />
        </motion.span>
      ))}
    </>
  )
}
