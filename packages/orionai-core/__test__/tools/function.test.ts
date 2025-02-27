import { z } from 'zod'
import { describe, it } from 'vitest'
import { FunctionTool } from '@/tools/function'

describe('base tool', () => {
  it('should run', () => {
    // Test implementation goes here

    const tool = new FunctionTool({
      description: 'it is a test tool',
      func: async (args) => {
        console.log('test', args.location)
        return 'test'
      },
      name: 'test',
      schema: z.object({
        location: z.string().describe('it is a location of user'),
      }),
    })

    console.log('tool', tool)

    tool.run({
      location: 'beijing',
    })
  })
})
