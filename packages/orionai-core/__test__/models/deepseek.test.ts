import { describe, it, expect } from 'vitest'
import { DeepSeekModel, type IDeepSeekModelFields, type IDeepSeekCompleteParams } from '@/models'
import { UserMessage } from '@/messages'
import { config as dotConfig } from 'dotenv'

describe('DeepSeekModel', () => {
  it('should throw an error if no API key is provided', () => {
    const invalidConfig = { model: 'deepseek-chat' } as IDeepSeekModelFields
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
    expect(result).toBeTypeOf('string')
    expect(result).not.toBe('')
  })
})
