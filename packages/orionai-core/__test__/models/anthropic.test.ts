import { describe, it, expect, beforeEach } from 'vitest'
import { AnthropicModel } from '@/models/anthropic'
import { config as dotConfig } from 'dotenv'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { AssistantMessage, SystemMessage, UserMessage } from '@/messages'

describe('AnthropicModel', () => {
  let model: AnthropicModel

  dotConfig()

  const proxy = new HttpsProxyAgent(process.env.HTTPS_PROXY || '')

  beforeEach(() => {
    model = new AnthropicModel({
      anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
      httpAgent: proxy,
    })
  })

  it('should initialize the AnthropicModel correctly', () => {
    expect(model).toBeInstanceOf(AnthropicModel)
  })

  it('should throw an error if no API key is provided', () => {
    const originalApiKey = process.env.ANTHROPIC_API_KEY
    process.env.ANTHROPIC_API_KEY = ''
    expect(() => new AnthropicModel({})).toThrow('[orion-ai] Anthropic API key is required.')
    process.env.ANTHROPIC_API_KEY = originalApiKey
  })

  it('should successfully call the complete method and return a response', async () => {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('Skipping test: No Anthropic API key available')
      return
    }

    console.log([
      new SystemMessage('you are a helpful assistant'),
      new UserMessage('hello, how are you?'),
    ])

    const response = await model.create({
      messages: [
        new SystemMessage('you are a helpful assistant'),
        new UserMessage('hello, how are you?'),
      ],
    })

    expect(response).toBeTypeOf('string')
    expect(response).not.toBe('')
    console.log('Anthropic response:', response)
  }, 30000) // 设置较长的超时时间
})
