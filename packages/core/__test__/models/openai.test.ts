import { z } from 'zod'
import { describe, it, expect, beforeEach } from 'vitest'
import { createOpenAIModel } from '@orion-ai/openai'
import { config as dotConfig } from 'dotenv'
import { generateText, streamText, type LanguageModel } from 'ai'
import { SystemMessage, UserMessage, AssistantMessage } from '@/messages'
import { DEV_LOGGER } from '@/lib/logger'
import { functionTool } from '@/tools/function'
import { convertMessagesToAISDK, convertToolsToAISDK } from '@/models/adapters'

describe('OpenAI Model', () => {
  let model: LanguageModel

  dotConfig()

  beforeEach(() => {
    model = createOpenAIModel({
      apiKey: process.env.OPENAI_API_KEY || '',
      model: 'gpt-4o-mini',
    })
  })

  it('should initialize the OpenAI model correctly', () => {
    expect(model).toBeDefined()
    expect(typeof model).toBe('object')
  })

  it('should initialize with custom model', () => {
    const customModel = createOpenAIModel({
      apiKey: process.env.OPENAI_API_KEY || '',
      model: 'gpt-4o',
    })

    expect(customModel).toBeDefined()
  })

  it('should successfully generate text', async () => {
    if (!process.env.OPENAI_API_KEY) {
      console.log('Skipping test - no API key')
      return
    }

    const messages = convertMessagesToAISDK([
      new SystemMessage('You are a super frontend master, please reply to me in English'),
      new UserMessage('Please give me a debounce function'),
      new AssistantMessage('Sure, here is a debounce function'),
      new UserMessage(
        'Please first tell me your identity, then tell me what you answered to my last question',
      ),
    ])

    const response = await generateText({
      model,
      messages,
    })

    console.log('response', response)

    expect(response.text).toBeTypeOf('string')
    expect(response.text).not.toBe('')
  })

  it('test image can be uploaded', async () => {
    if (!process.env.OPENAI_API_KEY) {
      console.log('Skipping test - no API key')
      return
    }

    const messages = convertMessagesToAISDK([
      new UserMessage({
        content: [
          {
            type: 'input_text',
            text: 'Please tell me what you see in this image',
          },
          {
            type: 'input_image',
            image_url:
              'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png',
          },
        ],
      }),
    ])

    const response = await generateText({
      model,
      messages,
    })

    DEV_LOGGER.SUCCESS('response', response.text)
    expect(response.text).toBeTypeOf('string')
    expect(response.text).not.toBe('')
  })

  it('should use a tool and give the result', async () => {
    if (!process.env.OPENAI_API_KEY) {
      console.log('Skipping test - no API key')
      return
    }

    const tool = functionTool({
      name: 'weather_tool',
      description: 'use this tool to get the weather',
      schema: z.object({
        city: z.string().describe('The city to get weather for'),
      }),
      execute: async ({ city }) => `The weather in ${city} is sunny`,
    })

    const messages = convertMessagesToAISDK([
      new UserMessage(`hi what the temperature like in Hangzhou?`),
    ])

    const tools = convertToolsToAISDK([tool])

    const response = await generateText({
      model,
      messages,
      tools,
    })

    DEV_LOGGER.SUCCESS('response', response)
    expect(response.text).not.toBe('')
  })

  it('should create a streaming chat completion', async () => {
    if (!process.env.OPENAI_API_KEY) {
      console.log('Skipping test - no API key')
      return
    }

    const messages = convertMessagesToAISDK([
      new UserMessage('Tell me about machine learning in 3 sentences'),
    ])

    const result = streamText({
      model,
      messages,
    })

    let fullText = ''
    for await (const chunk of result.textStream) {
      fullText += chunk
    }

    expect(fullText).not.toBe('')
  })

  it('should support function call in streaming', async () => {
    if (!process.env.OPENAI_API_KEY) {
      console.log('Skipping test - no API key')
      return
    }

    const tool = functionTool({
      name: 'weather_tool',
      description: 'use this tool to get the weather',
      schema: z.object({
        city: z.string().describe('The city to get weather for'),
      }),
      execute: async ({ city }) => `The weather in ${city} is sunny`,
    })

    const messages = convertMessagesToAISDK([
      new UserMessage(`hi what the temperature like in Hangzhou?`),
    ])

    const tools = convertToolsToAISDK([tool])

    const result = streamText({
      model,
      messages,
      tools,
    })

    let hasToolCalls = false
    for await (const chunk of result.fullStream) {
      if (chunk.type === 'tool-call') {
        hasToolCalls = true
        console.log('Tool call:', chunk)
      }
    }

    // Either we get text or tool calls
    const finalResult = await result
    expect(finalResult.text || hasToolCalls).toBeTruthy()
  })
})
