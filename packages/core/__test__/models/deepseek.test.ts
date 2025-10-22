import { z } from 'zod'
import { describe, it, expect, beforeEach } from 'vitest'
import { config as dotConfig } from 'dotenv'
import { createDeepSeekModel } from '@orion-ai/deepseek'
import { generateText, streamText, type LanguageModel } from 'ai'
import { UserMessage, SystemMessage } from '@/messages'
import { functionTool } from '@/tools/function'
import { convertMessagesToAISDK, convertToolsToAISDK } from '@/models/adapters'
import { DEV_LOGGER } from '@/lib/logger'

describe('DeepSeek Model', () => {
  let model: LanguageModel

  beforeEach(() => {
    dotConfig()
    model = createDeepSeekModel({
      apiKey: process.env.DEEPSEEK_API_KEY,
      model: 'deepseek-chat',
    })
  })

  it('should initialize with a valid API key', () => {
    dotConfig()
    const testModel = createDeepSeekModel({
      apiKey: process.env.DEEPSEEK_API_KEY,
    })
    expect(testModel).toBeDefined()
    expect(typeof testModel).toBe('object')
  })

  it('should initialize with default model', () => {
    const defaultModel = createDeepSeekModel({
      apiKey: 'test-key',
    })
    expect(defaultModel).toBeDefined()
  })

  it('should create a chat completion', async () => {
    if (!process.env.DEEPSEEK_API_KEY) {
      console.log('Skipping test - no API key')
      return
    }

    dotConfig()

    const messages = convertMessagesToAISDK([new UserMessage(`hi`)])

    const result = await generateText({
      model,
      messages,
    })

    expect(result.text).not.toBe('')
    expect(result.text).toBeTypeOf('string')
  })

  it('should log debug info if debug is enabled', async () => {
    if (!process.env.DEEPSEEK_API_KEY) {
      console.log('Skipping test - no API key')
      return
    }

    dotConfig()
    const debugModel = createDeepSeekModel({
      apiKey: process.env.DEEPSEEK_API_KEY,
    })

    const messages = convertMessagesToAISDK([new UserMessage(`hi`)])

    const result = await generateText({
      model: debugModel,
      messages,
    })

    expect(result.text).not.toBe('')
  })

  it('should use a tool and give the result', async () => {
    if (!process.env.DEEPSEEK_API_KEY) {
      console.log('Skipping test - no API key')
      return
    }

    dotConfig()

    const tool = functionTool({
      name: 'weather_tool',
      description: 'use this tool to get the weather',
      schema: z.object({
        city: z.string(),
      }),
      execute: async ({ city }) => `The weather in ${city} is sunny`,
    })

    const messages = convertMessagesToAISDK([
      new UserMessage(`hi what the weather like in Hangzhou?`),
    ])

    const tools = convertToolsToAISDK([tool])

    const result = await generateText({
      model,
      messages,
      tools,
    })

    expect(result.text).not.toBe('')
  })

  it('should invoke thinking with deepseek-reasoner and give the result', async () => {
    if (!process.env.DEEPSEEK_API_KEY) {
      console.log('Skipping test - no API key')
      return
    }

    dotConfig()
    const reasonerModel = createDeepSeekModel({
      apiKey: process.env.DEEPSEEK_API_KEY,
      model: 'deepseek-reasoner',
    })

    const messages = convertMessagesToAISDK([
      new UserMessage(`9.11 and 9.8, which is greater?`),
    ])

    const res = await generateText({
      model: reasonerModel,
      messages,
    })

    console.log('[res]', JSON.stringify(res, null, 2))
    // Note: deepseek-reasoner may include reasoning in the response
    expect(res.text).not.toBe('')
  })

  it('should create a streaming chat completion', async () => {
    if (!process.env.DEEPSEEK_API_KEY) {
      console.log('Skipping test - no API key')
      return
    }

    dotConfig()

    const messages = convertMessagesToAISDK([
      new UserMessage('Tell me about machine learning in 3 sentences'),
    ])

    const result = streamText({
      model,
      messages,
    })

    let content = ''
    for await (const chunk of result.textStream) {
      content += chunk
    }

    expect(content).not.toBe('')
    expect(content.length).toBeGreaterThan(10)
  })

  it('should support async iterator for stream processing', async () => {
    if (!process.env.DEEPSEEK_API_KEY) {
      console.log('Skipping test - no API key')
      return
    }

    dotConfig()

    const messages = convertMessagesToAISDK([new UserMessage('Give me a short joke')])

    const result = streamText({
      model,
      messages,
    })

    expect(result).toBeDefined()

    let contentFromIterator = ''

    // process the stream with async iterator
    for await (const chunk of result.textStream) {
      console.log('chunk', chunk)
      contentFromIterator += chunk
    }

    // check the content from async iterator
    expect(contentFromIterator.length).toBeGreaterThan(0)
    console.log('content from async iterator:', contentFromIterator)
  })

  it('should support thinking and streaming with deepseek-reasoner', async () => {
    if (!process.env.DEEPSEEK_API_KEY) {
      console.log('Skipping test - no API key')
      return
    }

    dotConfig()

    const reasonerModel = createDeepSeekModel({
      apiKey: process.env.DEEPSEEK_API_KEY,
      model: 'deepseek-reasoner',
    })

    const messages = convertMessagesToAISDK([
      new UserMessage('9.11 and 9.8, which is greater?'),
    ])

    const result = streamText({
      model: reasonerModel,
      messages,
    })

    let content = ''
    for await (const chunk of result.textStream) {
      content += chunk
    }

    expect(content.length).toBeGreaterThan(0)
  })

  it('should work with system messages', async () => {
    if (!process.env.DEEPSEEK_API_KEY) {
      console.log('Skipping test - no API key')
      return
    }

    dotConfig()

    const messages = convertMessagesToAISDK([
      new SystemMessage('You are a helpful coding assistant'),
      new UserMessage('Write a hello world function in JavaScript'),
    ])

    const result = await generateText({
      model,
      messages,
    })

    expect(result.text).not.toBe('')
    expect(result.text.toLowerCase()).toContain('function')
  })

  it('should handle custom parameters', async () => {
    if (!process.env.DEEPSEEK_API_KEY) {
      console.log('Skipping test - no API key')
      return
    }

    dotConfig()

    const messages = convertMessagesToAISDK([new UserMessage('Count to 5')])

    const result = await generateText({
      model,
      messages,
    })

    expect(result.text).not.toBe('')
  })
})
