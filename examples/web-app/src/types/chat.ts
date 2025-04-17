export type Message = {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: number
}

export type ChatState = {
  messages: Message[]
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  clearMessages: () => void
}
