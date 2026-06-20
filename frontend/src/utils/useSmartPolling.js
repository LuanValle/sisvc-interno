import { useEffect } from 'react'

export function useSmartPolling(callback, options = 5000) {
  useEffect(() => {
    const config =
      typeof options === 'number'
        ? { intervalMs: options }
        : options

    const {
      intervalMs = 5000,
      runImmediately = true,
    } = config

    let timeoutId
    let isStopped = false
    let isRunning = false

    const schedule = () => {
      if (isStopped) return
      clearTimeout(timeoutId)
      timeoutId = setTimeout(run, intervalMs)
    }

    const run = async () => {
      if (document.hidden || isRunning || isStopped || navigator.onLine === false) {
        schedule()
        return
      }

      try {
        isRunning = true
        await callback()
      } finally {
        isRunning = false
        schedule()
      }
    }

    // Executa ao entrar na tela e depois respeita se a aba estiver ativa.
    if (runImmediately) {
      run()
    } else {
      schedule()
    }

    const runWhenAvailable = () => {
      if (!document.hidden) run()
    }

    document.addEventListener('visibilitychange', runWhenAvailable)
    window.addEventListener('focus', runWhenAvailable)
    window.addEventListener('online', runWhenAvailable)

    return () => {
      isStopped = true
      clearTimeout(timeoutId)
      document.removeEventListener('visibilitychange', runWhenAvailable)
      window.removeEventListener('focus', runWhenAvailable)
      window.removeEventListener('online', runWhenAvailable)
    }
  }, [callback, options])
}
