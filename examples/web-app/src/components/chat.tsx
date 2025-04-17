import { useState } from 'react'
import { useChatStore } from '@/store/chat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { assistantAgent, deepseekModel, assistantMessage, userMessage } from '@orion-ai/core'

// 创建 OpenAI 模型实例
const model = deepseekModel({
  apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY,
  debug: true,
  dangerouslyAllowBrowser: true,
})

// 创建 Orion AI 助手实例
const assistant = assistantAgent({
  name: 'AI Assistant',
  systemMessage: 'You are a helpful AI assistant.',
  model,
  debug: true,
})

export const Chat = () => {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { messages, addMessage } = useChatStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    // 添加用户消息
    const userMsg = {
      content: input,
      role: 'user' as const,
    }
    addMessage(userMsg)
    setInput('')

    setIsLoading(true)
    try {
      // 调用 Orion AI 处理消息
      const response = await assistant.invoke([
        userMessage(input),
        ...messages.map((msg) =>
          msg.role === 'user'
            ? userMessage(msg.content)
            : assistantMessage({ content: msg.content }),
        ),
      ])

      // 添加 AI 响应
      addMessage({
        content: response,
        role: 'assistant',
      })
    } catch (error) {
      console.error('Error getting AI response:', error)
      addMessage({
        content: 'Sorry, there was an error processing your message.',
        role: 'assistant',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[600px] w-full max-w-2xl mx-auto p-4">
      <ScrollArea className="flex-1 rounded-md border p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex items-start gap-2 max-w-[80%] ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <Avatar>
                  <AvatarImage
                    src={message.role === 'user' ? '/user-avatar.png' : '/ai-avatar.png'}
                  />
                  <AvatarFallback>{message.role === 'user' ? 'U' : 'AI'}</AvatarFallback>
                </Avatar>
                <div
                  className={`rounded-lg px-4 py-2 ${
                    message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1"
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send'}
        </Button>
      </form>
    </div>
  )
}
