import { describe, it, expect } from 'vitest'
import { DeepSeekModel, type IDeepSeekModelConfig, type IDeepSeekCompleteParams } from '@/models'
import { UserMessage } from '@/messages'
import { config as dotConfig } from 'dotenv'
import { functionTool } from '@/tools/function'
import { z } from 'zod'
import { DEV_LOGGER } from '@/lib/logger'

describe('DeepSeekModel', () => {
  it('should throw an error if no API key is provided', () => {
    const invalidConfig = { model: 'deepseek-chat' } as IDeepSeekModelConfig
    expect(() => new DeepSeekModel(invalidConfig)).toThrowError(
      '[orion-ai] DeepSeek API key is required.',
    )
  })

  it('should initialize with a valid API key', () => {
    dotConfig()
    const model = new DeepSeekModel()
    expect(model).toBeInstanceOf(DeepSeekModel)
  })

  it('should create a chat completion', async () => {
    dotConfig()
    console.log('DEEPSEEK_API_KEY', process.env.DEEPSEEK_API_KEY)
    const model = new DeepSeekModel()
    const body: IDeepSeekCompleteParams = {
      messages: [new UserMessage(`hi`)],
    }

    const result = await model.create(body)
    console.log('[orion] result', result)
    expect(result).not.toBe('')
  })

  it('should use a tool and give the result', async () => {
    dotConfig()
    const model = new DeepSeekModel()
    const tool = functionTool({
      name: 'weather_tool',
      description: 'use this tool to get the weather',
      schema: z.object({
        city: z.string(),
      }),
      execute: async ({ city }) => `The weather in ${city} is sunny`,
    })
    const body: IDeepSeekCompleteParams = {
      messages: [new UserMessage(`hi what the weather like in Hangzhou?`)],
      tools: [tool],
    }

    const result = await model.create(body)
    const res = await tool.run(result.tool_calls[0].function.arguments)
    DEV_LOGGER.SUCCESS('res', res)
    expect(result).not.toBe
  })
})
