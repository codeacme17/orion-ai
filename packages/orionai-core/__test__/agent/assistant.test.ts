import { AssistantAgent } from '@/agents'
import { DEV_LOGGER } from '@/lib/logger'
import { userMessage } from '@/messages'
import { deepseekModel } from '@/models'
import { FunctionTool, functionTool } from '@/tools/function'
import { configDotenv } from 'dotenv'
import { beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

describe('assistant agent', () => {
  beforeEach(() => {
    configDotenv()
  })

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

  it('should invoke the assistant agent', async () => {
    configDotenv()

    const agent = new AssistantAgent({
      name: 'assistant',
      systemMessage: 'your name is bob',
      model: deepseekModel(),
    })

    const result = await agent.invoke([userMessage('hello, what is your name?')])

    DEV_LOGGER.SUCCESS('assistant agent', result)

    expect(result).toBeDefined()
  })

  it('should use tool and give the result', async () => {
    const agent = new AssistantAgent({
      name: 'assistant',
      systemMessage: 'you are an useful assistant, you can use tools',
      model: deepseekModel(),
      tools: [
        functionTool({
          name: 'location_weather',
          description: 'this tool can get the weather of a location',
          schema: z.object({
            location: z.string().describe('the location to get the weather'),
          }),
          execute: async (args) => {
            DEV_LOGGER.INFO('test', args.location)
            return `thie weather in ${args.location} windy`
          },
        }),
        functionTool({
          name: 'location_time',
          description: 'this tool can get the time of a location',
          schema: z.object({
            location: z.string().describe('the location to get the time'),
          }),
          execute: async (args) => {
            DEV_LOGGER.INFO('test', args.location)
            return `the time in ${args.location} 12:00`
          },
        }),
      ],
    })

    const result = await agent.invoke([
      userMessage('can you give me the weather in beijing? and the time?'),
    ])

    DEV_LOGGER.SUCCESS('assistant agent', result)
    expect(result).toBeDefined()
  })
})
