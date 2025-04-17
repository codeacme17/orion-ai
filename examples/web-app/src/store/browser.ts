import { create } from 'zustand'

interface BrowserState {
  isOpen: boolean
  url: string
  openBrowser: (url: string) => void
  closeBrowser: () => void
}

export const useBrowserStore = create<BrowserState>((set) => ({
  isOpen: false,
  url: '',
  openBrowser: (url) => set({ isOpen: true, url }),
  closeBrowser: () => set({ isOpen: false, url: '' }),
}))
