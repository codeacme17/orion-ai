import { DEV_LOGGER } from '@/lib/logger'
import { assistantMessage, UserMessage, userMessage } from '@/messages'
import { mcpSseTools, mcpStdioTools } from '@/tools'
import { describe, expect, it } from 'vitest'
import { config as dotConfig } from 'dotenv'

describe('tool message', () => {
  dotConfig()

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
})
