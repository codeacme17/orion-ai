import { describe, it, expect } from 'vitest'
import { createAgent } from '../src/orion'

describe('Agent', () => {
  it('should create an agent', async () => {
    const agent = await createAgent()
    const result = await agent.invoke([{ role: 'user', content: 'hi' }])
    expect(result).toBe('hi')
  })
})
