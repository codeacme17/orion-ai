import { DEV_LOGGER } from '@/lib/logger'
import { ToolMessage } from '@/messages'
import { describe, expect, it } from 'vitest'

describe('tool message', () => {
  it('should create a tool message', () => {
    const toolMessage = new ToolMessage({
      tool_call_id: '123',
      content: 'tool result',
    })
    DEV_LOGGER.SUCCESS('tool message', toolMessage)
    expect(toolMessage).toBeDefined()
  })
})
