import { z } from 'zod'
import { describe, it } from 'vitest'
import { FunctionTool } from '@/tools/function'
import { DeepSeekModel } from '@/models'
import { UserMessage } from '@/messages'
import dotenv from 'dotenv'

describe('base tool', () => {
  it('should run', () => {
    const tool = new FunctionTool({
      name: 'test',
      description: 'it is a test tool',
      schema: z.object({
        location: z.string().describe('it is a location of user'),
      }),
      func: async (args) => {
        console.log('test', args.location)
        return 'test'
      },
    })

    console.log('tool', tool)

    tool.run({
      location: 'beijing',
    })
  })

  it('should run in llm', async () => {
    dotenv.config()

    const tool = new FunctionTool({
      name: 'test',
      description: 'it is a test tool',
      schema: z.object({
        location: z.string().describe('it is a location of user'),
      }),
      func: async (args) => {
        console.log('test', args.location)
        return 'test'
      },
    })

    const tools: any = [tool]

    const llm = new DeepSeekModel()

    const res = await llm.create({
      messages: [
        new UserMessage({
          content: 'what is the weather in beijing?',
        }),
      ],
      tools,
    })

    const toolRes = await tool.run(res.tool_calls[0].function.arguments)

    console.log('tool res ===>', toolRes)
  })
})
