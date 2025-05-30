import { useState } from 'react'
import { useChatStore } from '@/store/chat'
import { useBrowserStore } from '@/store/browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  assistantAgent,
  assistantMessage,
  userMessage,
  functionTool,
  DeepseekModel,
  // DeepseekModel,
} from '@orion-ai/core'
import { Browser } from './Browser'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'

const deepseekModel = new DeepseekModel({
  apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY,
  debug: true,
  dangerouslyAllowBrowser: true,
})

// const openaiModel = new OpenAIModel({
//   apiKey: import.meta.env.VITE_OPENAI_API_KEY,
//   debug: true,
//   dangerouslyAllowBrowser: true,
// })

const assistant = assistantAgent({
  name: 'AI Assistant',
  systemMessage: 'You are a helpful AI assistant.',
  model: deepseekModel,
  stream: true,
  debug: true,
  tools: [
    functionTool({
      name: 'open_browser',
      description: 'Open a browser window to display a webpage',
      schema: z.object({
        url: z.string().describe('The URL to open in the browser'),
      }),
      execute: async (input) => {
        console.log('input', input)
        const { openBrowser } = useBrowserStore.getState()
        openBrowser(input.url)
        return 'Browser opened'
      },
    }),
  ],
})

export const Chat = () => {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { messages, addMessage, updateMessage } = useChatStore()
  const { isOpen, url, closeBrowser } = useBrowserStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMsg = {
      content: input,
      role: 'user' as const,
      id: uuidv4(),
      timestamp: Date.now(),
    }
    addMessage(userMsg)
    setInput('')

    setIsLoading(true)
    try {
      const response = assistant.invokeStream([
        userMessage(input),
        ...messages.map((msg) =>
          msg.role === 'user'
            ? userMessage(msg.content)
            : assistantMessage({ content: msg.content }),
        ),
      ])

      const id = uuidv4()
      const timestamp = Date.now()
      addMessage({
        id,
        content: '',
        role: 'assistant',
        timestamp: Date.now(),
      })

      let content = ''

      for await (const chunk of response) {
        console.log('CLIENT CHUNK \n ========= \n', chunk, '\n =========')
        if (chunk.type === 'invoke.text.content') content += chunk.content
        updateMessage({
          content,
          role: 'assistant',
          id,
          timestamp,
        })
      }

      // addMessage({
      //   content: response,
      //   role: 'assistant',
      // })
    } catch (error) {
      console.error('Error getting AI response:', error)
      addMessage({
        content: 'Sorry, there was an error processing your message.',
        role: 'assistant',
        id: messages[messages.length - 1].id || '',
        timestamp: messages[messages.length - 1].timestamp || 0,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-[600px] w-full max-w-4xl mx-auto p-4 gap-4 w-max-[600px]">
      <div className="flex flex-col flex-1">
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
                    className={`rounded-lg px-4 py-2 max-w-[500px] ${
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
      {isOpen && (
        <div className="w-1/2 rounded-md border">
          <Browser url={url} onClose={closeBrowser} />
        </div>
      )}
    </div>
  )
}
