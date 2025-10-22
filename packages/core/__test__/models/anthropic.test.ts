import { z } from 'zod'
import { describe, it, expect, beforeEach } from 'vitest'
import { createAnthropicModel } from '@orion-ai/anthropic'
import { config as dotConfig } from 'dotenv'
import { generateText, streamText, type LanguageModel } from 'ai'
import { SystemMessage, UserMessage, AssistantMessage } from '@/messages'
import { functionTool } from '@/tools/function'
import { convertMessagesToAISDK, convertToolsToAISDK } from '@/models/adapters'

describe('Anthropic Model', () => {
  let model: LanguageModel

  dotConfig()

  beforeEach(() => {
    model = createAnthropicModel({
      apiKey: process.env.ANTHROPIC_API_KEY || 'test-api-key',
      model: 'claude-3-5-sonnet-20240620',
    })
  })

  describe('Initialization', () => {
    it('should initialize the Anthropic model correctly', () => {
      expect(model).toBeDefined()
      expect(typeof model).toBe('object')
    })

    it('should initialize with custom model', () => {
      const customModel = createAnthropicModel({
        apiKey: process.env.ANTHROPIC_API_KEY || 'test-key',
        model: 'claude-3-haiku-20240307',
      })

      expect(customModel).toBeDefined()
    })

    it('should use default model when not specified', () => {
      const defaultModel = createAnthropicModel({
        apiKey: 'test-key',
      })

      expect(defaultModel).toBeDefined()
    })
  })

  describe('Message Generation', () => {
    it('should successfully generate text', async () => {
      if (!process.env.ANTHROPIC_API_KEY) {
        console.log('Skipping test - no API key')
        return
      }

      const messages = convertMessagesToAISDK([
        new SystemMessage('You are a helpful assistant'),
        new UserMessage('Hello, how are you?'),
      ])

      const response = await generateText({
        model,
        messages,
      })

      expect(response.text).toBeDefined()
      expect(response.text).toBeTypeOf('string')
      expect(response.text.length).toBeGreaterThan(0)
    })

    it('should handle conversation with multiple messages', async () => {
      if (!process.env.ANTHROPIC_API_KEY) {
        console.log('Skipping test - no API key')
        return
      }

      const messages = convertMessagesToAISDK([
        new SystemMessage('You are a frontend expert'),
        new UserMessage('What is React?'),
        new AssistantMessage('React is a JavaScript library'),
        new UserMessage('Tell me more about hooks'),
      ])

      const response = await generateText({
        model,
        messages,
      })

      expect(response.text).toBeTypeOf('string')
      expect(response.text).not.toBe('')
    })

    it('should handle custom parameters', async () => {
      if (!process.env.ANTHROPIC_API_KEY) {
        console.log('Skipping test - no API key')
        return
      }

      const messages = convertMessagesToAISDK([new UserMessage('Write a haiku about code')])

      const response = await generateText({
        model,
        messages,
      })

      expect(response.text).toBeTypeOf('string')
    })
  })

  describe('Tool Usage', () => {
    it('should handle tool calls correctly', async () => {
      if (!process.env.ANTHROPIC_API_KEY) {
        console.log('Skipping test - no API key')
        return
      }

      const tool = functionTool({
        name: 'get_weather',
        description: 'Get weather information for a city',
        schema: z.object({
          city: z.string().describe('The city name'),
        }),
        execute: async ({ city }) => `The weather in ${city} is sunny and 22°C`,
      })

      const messages = convertMessagesToAISDK([
        new UserMessage('What is the weather like in Paris?'),
      ])

      const tools = convertToolsToAISDK([tool])

      const response = await generateText({
        model,
        messages,
        tools,
      })

      expect(response).toBeDefined()
      expect(typeof response.text === 'string').toBe(true)
    })

    it('should handle multiple tools', async () => {
      if (!process.env.ANTHROPIC_API_KEY) {
        console.log('Skipping test - no API key')
        return
      }

      const tool1 = functionTool({
        name: 'get_time',
        description: 'Get current time',
        schema: z.object({}),
        execute: async () => new Date().toISOString(),
      })

      const tool2 = functionTool({
        name: 'get_weather',
        description: 'Get weather',
        schema: z.object({
          city: z.string(),
        }),
        execute: async ({ city }) => `Sunny in ${city}`,
      })

      const messages = convertMessagesToAISDK([
        new UserMessage('What time is it and what is the weather in London?'),
      ])

      const tools = convertToolsToAISDK([tool1, tool2])

      const response = await generateText({
        model,
        messages,
        tools,
      })

      expect(response).toBeDefined()
    })
  })

  describe('Streaming', () => {
    it('should create a streaming response', async () => {
      if (!process.env.ANTHROPIC_API_KEY) {
        console.log('Skipping test - no API key')
        return
      }

      const messages = convertMessagesToAISDK([new UserMessage('Tell me a short story')])

      const result = streamText({
        model,
        messages,
      })

      let fullText = ''
      for await (const chunk of result.textStream) {
        fullText += chunk
      }

      expect(fullText.length).toBeGreaterThan(0)
    })

    it('should handle streaming with tools', async () => {
      if (!process.env.ANTHROPIC_API_KEY) {
        console.log('Skipping test - no API key')
        return
      }

      const tool = functionTool({
        name: 'calculate',
        description: 'Perform calculations',
        schema: z.object({
          operation: z.string(),
          a: z.number(),
          b: z.number(),
        }),
        execute: async ({ operation, a, b }) => {
          if (operation === 'add') return String(a + b)
          if (operation === 'multiply') return String(a * b)
          return '0'
        },
      })

      const messages = convertMessagesToAISDK([
        new UserMessage('What is 5 plus 3 and what is 4 times 2?'),
      ])

      const tools = convertToolsToAISDK([tool])

      const result = streamText({
        model,
        messages,
        tools,
      })

      const chunks: any[] = []
      for await (const chunk of result.fullStream) {
        chunks.push(chunk)
      }

      expect(chunks.length).toBeGreaterThan(0)
    })
  })

  describe('Configuration', () => {
    it('should handle custom baseURL', () => {
      const customModel = createAnthropicModel({
        apiKey: 'test-key',
        baseURL: 'https://custom-api.example.com',
      })

      expect(customModel).toBeDefined()
    })

    it('should work with environment variables', () => {
      // This test verifies the model can be created without explicit API key
      // when ANTHROPIC_API_KEY env var is set
      if (process.env.ANTHROPIC_API_KEY) {
        const envModel = createAnthropicModel({})
        expect(envModel).toBeDefined()
      }
    })
  })
})

// Integration tests (only run when API key is available)
describe('Anthropic Model Integration Tests', () => {
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY

  if (!hasApiKey) {
    it.skip('Skipping integration tests - no API key provided', () => {})
    return
  }

  let model: LanguageModel

  beforeEach(() => {
    model = createAnthropicModel({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    })
  })

  it('should make a real API call', async () => {
    const messages = convertMessagesToAISDK([
      new SystemMessage('You are a helpful assistant. Respond briefly.'),
      new UserMessage('Say hello'),
    ])

    const response = await generateText({
      model,
      messages,
    })

    expect(response.text).toBeTypeOf('string')
    expect(response.text.length).toBeGreaterThan(0)
  }, 30000)

  it('should work with real tools', async () => {
    const weatherTool = functionTool({
      name: 'get_weather',
      description: 'Get weather information for a city',
      schema: z.object({
        city: z.string().describe('The city name'),
        unit: z.enum(['celsius', 'fahrenheit']).optional().describe('Temperature unit'),
      }),
      execute: async ({ city, unit = 'celsius' }) => {
        return `The weather in ${city} is 22°${unit === 'celsius' ? 'C' : 'F'} and sunny.`
      },
    })

    const messages = convertMessagesToAISDK([
      new UserMessage('What is the weather like in Paris?'),
    ])

    const tools = convertToolsToAISDK([weatherTool])

    const response = await generateText({
      model,
      messages,
      tools,
    })

    expect(response).toBeDefined()
    expect(typeof response.text === 'string').toBe(true)
  }, 30000)
})
