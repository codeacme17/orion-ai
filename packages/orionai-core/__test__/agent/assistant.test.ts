import { AssistantAgent } from '@/agents'
import { describe, it } from 'vitest'

describe('assistant agent', () => {
  it('should generate an assistant agent', () => {
    const agent = new AssistantAgent({
      name: '',
      systemMessage: 'hello',
    })
  })
})
