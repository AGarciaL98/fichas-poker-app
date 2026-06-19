// Abstraction over clipboard — swap body for @capacitor/clipboard when going native:
// import { Clipboard } from '@capacitor/clipboard'
// export async function copyToClipboard(text) { await Clipboard.write({ string: text }) }

export async function copyToClipboard(text) {
  return navigator.clipboard.writeText(text)
}

export async function pasteFromClipboard() {
  return navigator.clipboard.readText()
}
