import { z } from 'zod'
import { describe, it, expect } from 'vitest'
import { config as dotConfig } from 'dotenv'

import { DeepSeekModel, type IDeepSeekModelConfig, type IDeepSeekCompleteParams } from '@/models'
import { UserMessage } from '@/messages'
import { functionTool } from '@/tools/function'

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

    const model = new DeepSeekModel()
    const body: IDeepSeekCompleteParams = {
      messages: [new UserMessage(`hi`)],
    }

    const result = await model.create(body)
    expect(result).not.toBe('')
  })

  it('should log debug info if debug is enabled', async () => {
    dotConfig()
    const model = new DeepSeekModel({ debug: true })
    const body: IDeepSeekCompleteParams = {
      messages: [new UserMessage(`hi`)],
    }
    await model.create(body)
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
    expect(result).not.toBe
  })

  it('should invoke thinking and give the result', async () => {
    dotConfig()
    const model = new DeepSeekModel({
      model: 'deepseek-reasoner',
    })
    const body: IDeepSeekCompleteParams = {
      messages: [new UserMessage(`9.11 and 9.8, which is greater?`)],
    }

    const res = await model.create(body)
    console.log('[res]', JSON.stringify(res, null, 2))
    expect(res.thought).not.toBe('')
  })
})
