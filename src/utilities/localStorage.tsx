export function getFromLocalStorage(key: string) {
  try {
    const value = window.localStorage.getItem(key)
    if (value) {
      return JSON.parse(value)
    }
    return null
  } catch {
    return null
  }
}

export function setToLocalStorage(key: string, value: any) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

export function removeFromLocalStorage(key: string) {
  window.localStorage.removeItem(key)
}
