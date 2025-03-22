import { z } from 'zod'
import { describe, it } from 'vitest'
import { functionTool, FunctionTool } from '@/tools/function'
import { DeepSeekModel } from '@/models'
import { systemMessage, userMessage, UserMessage } from '@/messages'
import dotenv from 'dotenv'
import type { BaseTool } from '@/tools'
import { DEV_LOGGER } from '@/lib/logger'

describe('base tool', () => {
  it('should run', () => {
    const tool = new FunctionTool({
      name: 'test',
      description: 'it is a test tool',
      schema: z.object({
        location: z.string().describe('it is a location of user'),
      }),
      execute: async (args) => {
        DEV_LOGGER.INFO('test', args.location)
        return 'test'
      },
    })

    DEV_LOGGER.SUCCESS('tool', tool)

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
      execute: async (args) => {
        DEV_LOGGER.INFO('test', args.location)
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

    DEV_LOGGER.SUCCESS('tool res ===>', toolRes)
  })

  it('should return 2 tools', async () => {
    dotenv.config()

    const weatherTool = new FunctionTool({
      name: 'get_weather',
      description: '获取指定地点的天气信息',
      schema: z.object({
        location: z.string().describe('用户查询的地点'),
      }),
      execute: async (args) => {
        return `${args.location}的天气是晴天，温度25度`
      },
    })

    const locationTool = functionTool({
      name: 'get_location_info',
      description: '获取地点的详细信息，如人口、面积等',
      schema: z.object({
        location: z.string().describe('需要查询信息的地点'),
      }),
      execute: async (args) => {
        return `${args.location}是中国的首都，人口约2100万`
      },
    })

    const tools = [weatherTool, locationTool]

    const llm = new DeepSeekModel()

    const res = await llm.create({
      messages: [
        systemMessage('you are a helpful assistant'),
        userMessage('我需要知道北京的天气情况和北京的地理信息，请分别使用相应工具查询'),
      ],
      tools,
    })

    DEV_LOGGER.SUCCESS('res ===>', res)
  })
})
