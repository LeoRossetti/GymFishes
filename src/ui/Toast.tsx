import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

const ToastContext = createContext<(msg: string) => void>(() => {})

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null)
  const reduced = useReducedMotion() ?? false
  const timer = useRef<number | undefined>(undefined)
  const show = useCallback((m: string) => {
    setMsg(m)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setMsg(null), 4000)
  }, [])
  return (
    <ToastContext.Provider value={show}>
      {children}
      <AnimatePresence>
        {msg ? (
          <motion.div
            key="toast"
            role="status"
            initial={{ opacity: 0, y: reduced ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduced ? 0 : 8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed bottom-28 left-1/2 z-50 -translate-x-1/2 w-max max-w-[calc(100%-32px)] text-center rounded-[99px]
                       border border-line bg-surface-2 px-4 py-3 text-[13px] text-ink"
          >
            {msg}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </ToastContext.Provider>
  )
}
