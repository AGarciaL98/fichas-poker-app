// Abstraction over key-value storage — swap body for @capacitor/preferences when going native:
// import { Preferences } from '@capacitor/preferences'
// export async function getItem(key) { const { value } = await Preferences.get({ key }); return value }
// export async function setItem(key, value) { await Preferences.set({ key, value }) }

export function getItem(key) {
  return sessionStorage.getItem(key)
}

export function setItem(key, value) {
  sessionStorage.setItem(key, value)
}
