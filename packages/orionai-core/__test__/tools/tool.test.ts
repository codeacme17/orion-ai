import { DEV_LOGGER } from '@/lib/logger'
import { assistantMessage, ToolMessage, UserMessage, userMessage } from '@/messages'
import { describe, expect, it } from 'vitest'

describe('tool message', () => {
  it('should create a user message', () => {
    const res = userMessage('hello')
    DEV_LOGGER.SUCCESS('user message', res.content)
    expect(res).instanceOf(UserMessage)
  })

  it('should create a image user message', () => {
    const res = userMessage({
      content: [
        {
          type: 'text',
          text: 'hello',
        },
        {
          type: 'image_url',
          image_url: 'https://www.google.com',
        },
      ],
    })
    DEV_LOGGER.SUCCESS('user message', res.content)
    expect(res).instanceOf(UserMessage)
  })

  it('should craete a assistant message', () => {
    const res = assistantMessage({
      content: 'hello',
    })
    DEV_LOGGER.SUCCESS('assistant message', res)
    expect(res).toBeDefined()
  })

  it('should create a tool message', () => {
    const toolMessage = new ToolMessage({
      tool_call_id: '123',
      content: 'tool result',
    })
    DEV_LOGGER.SUCCESS('tool message', toolMessage)
    expect(toolMessage).toBeDefined()
  })
})
