import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

const ToastContext = createContext<(msg: string) => void>(() => {})

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const show = useCallback((m: string) => {
    setMsg(m)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setMsg(null), 4000)
  }, [])
  return (
    <ToastContext.Provider value={show}>
      {children}
      {msg ? (
        <div
          role="status"
          className="fixed bottom-28 left-1/2 z-50 -translate-x-1/2 rounded-[99px]
                     border border-line bg-surface-2 px-4 py-3 text-[13px] text-ink"
        >
          {msg}
        </div>
      ) : null}
    </ToastContext.Provider>
  )
}
