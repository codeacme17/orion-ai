import { AssistantAgent } from '@/agents'
import { DEV_LOGGER } from '@/lib/logger'
import { userMessage } from '@/messages'
import { deepseekModel } from '@/models'
import { configDotenv } from 'dotenv'
import { describe, expect, it } from 'vitest'

describe('assistant agent', () => {
  it('should generate an assistant agent', async () => {
    configDotenv()

    const agent = new AssistantAgent({
      name: 'assistant',
      systemMessage: 'hello',
      model: deepseekModel(),
    })

    expect(agent).toBeDefined()

    const res = await agent.model.create({
      messages: [userMessage('Hello, how are you?')],
    })

    DEV_LOGGER.INFO('response', res)
    expect(res).toBeDefined()
  })
})
