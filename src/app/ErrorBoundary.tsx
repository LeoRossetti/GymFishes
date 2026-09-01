import { Component, type ErrorInfo, type ReactNode } from 'react'
import { STRINGS } from '@/lib/strings'
import { Button } from '@/ui/Button'

type Props = { children: ReactNode }
type State = { failed: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[GymFishes]', error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="px-4 pt-16 text-center">
        <p className="mb-6 text-[15px] text-ink-2">{STRINGS.erro.abaQuebrou}</p>
        <Button onClick={() => window.location.reload()}>{STRINGS.erro.recarregar}</Button>
      </div>
    )
  }
}
