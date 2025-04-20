import { create } from 'zustand'
import { ChatState, Message } from '@/types/chat'
import { v4 as uuidv4 } from 'uuid'

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  addMessage: (message: Message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: message.id || uuidv4(),
          timestamp: message.timestamp || Date.now(),
        },
      ],
    })),
  updateMessage: (message: Message) =>
    set((state) => ({
      messages: state.messages.map((msg) => (msg.id === message.id ? message : msg)),
    })),
  clearMessages: () => set({ messages: [] }),
}))
