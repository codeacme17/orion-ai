import { create } from 'zustand'
import { ChatState } from '@/types/chat'
import { v4 as uuidv4 } from 'uuid'

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: uuidv4(),
          timestamp: Date.now(),
        },
      ],
    })),
  clearMessages: () => set({ messages: [] }),
}))
