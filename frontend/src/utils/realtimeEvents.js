export const REQUESTS_CHANGED_EVENT = 'requests:changed'
export const AGENDA_CHANGED_EVENT = 'agenda:changed'

const dispatchBrowserEvent = (eventName) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(eventName))

  try {
    window.localStorage.setItem(`realtime:${eventName}`, String(Date.now()))
  } catch {
    // Se o navegador bloquear localStorage, o evento da aba atual ainda funciona.
  }
}

export const notifyRequestsChanged = () => {
  dispatchBrowserEvent(REQUESTS_CHANGED_EVENT)
}

export const notifyAgendaChanged = () => {
  dispatchBrowserEvent(AGENDA_CHANGED_EVENT)
}

export const subscribeRealtimeEvent = (eventName, callback) => {
  if (typeof window === 'undefined') return () => {}

  const handleStorage = (event) => {
    if (event.key === `realtime:${eventName}`) callback()
  }

  window.addEventListener(eventName, callback)
  window.addEventListener('storage', handleStorage)

  return () => {
    window.removeEventListener(eventName, callback)
    window.removeEventListener('storage', handleStorage)
  }
}
