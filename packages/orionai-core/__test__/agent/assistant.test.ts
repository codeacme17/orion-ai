import { AssistantAgent } from '@/agents'
import { openaiModel } from '@/models'
import { describe, it } from 'vitest'

describe('assistant agent', () => {
  it('should generate an assistant agent', () => {
    const agent = new AssistantAgent({
      name: 'assistant',
      systemMessage: 'hello',
      model: openaiModel({}),
    })
  })
})
