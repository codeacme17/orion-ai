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

    DEV_LOGGER.SUCCESS('assistant agent', 'created', agent)

    expect(agent).toBeDefined()
  })

  it('should update the system message', async () => {
    configDotenv()

    const agent = new AssistantAgent({
      name: 'assistant',
      systemMessage: 'hello',
      model: deepseekModel(),
    })

    agent.updateSystemMessage('world')

    DEV_LOGGER.SUCCESS('assistant agent', 'updated', agent)

    expect(agent.systemMessage).toBe('world')
  })
})
