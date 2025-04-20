export type Message = {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: number
}

export type ChatState = {
  messages: Message[]
  addMessage: (message: Message) => void
  updateMessage: (message: Message) => void
  clearMessages: () => void
}
