import { useState } from 'react'
import { useChatStore } from '@/store/chat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export const Chat = () => {
  const [input, setInput] = useState('')
  const { messages, addMessage } = useChatStore()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    addMessage({
      content: input,
      role: 'user',
    })

    // TODO: Add AI response logic here
    addMessage({
      content: 'This is a placeholder response from the AI.',
      role: 'assistant',
    })

    setInput('')
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
        />
        <Button type="submit">Send</Button>
      </form>
    </div>
  )
}
