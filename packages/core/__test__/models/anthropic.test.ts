import { z } from 'zod'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AnthropicModel, anthropicModel } from '@/models/anthropic'
import { config as dotConfig } from 'dotenv'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { AssistantMessage, SystemMessage, UserMessage } from '@/messages'
import { functionTool } from '@/tools/function'

// Mock Anthropic SDK for unit tests
vi.mock('@anthropic-ai/sdk', () => {
  const mockMessage = {
    id: 'msg_test',
    type: 'message',
    role: 'assistant',
    content: [
      {
        type: 'text',
        text: 'Hello! I am a helpful assistant. How can I help you today?',
      },
    ],
    model: 'claude-3-5-sonnet-20240620',
    stop_reason: 'end_turn',
    usage: {
      input_tokens: 10,
      output_tokens: 15,
    },
  }

  const mockToolUseMessage = {
    id: 'msg_tool_test',
    type: 'message',
    role: 'assistant',
    content: [
      {
        type: 'tool_use',
        id: 'tool_call_test',
        name: 'test_tool',
        input: { param: 'value' },
      },
    ],
    model: 'claude-3-5-sonnet-20240620',
    stop_reason: 'tool_use',
    usage: {
      input_tokens: 20,
      output_tokens: 5,
    },
  }

  return {
    default: class MockAnthropic {
      constructor(config: any) {}

      messages = {
        create: vi.fn().mockImplementation((params: any) => {
          if (params.tools && params.tools.length > 0) {
            return Promise.resolve(mockToolUseMessage)
          }
          if (params.stream) {
            // Mock stream response
            const mockStream = {
              [Symbol.asyncIterator]: async function* () {
                yield { type: 'message_start', message: { ...mockMessage, content: [] } }
                yield {
                  type: 'content_block_start',
                  index: 0,
                  content_block: { type: 'text', text: '' },
                }
                yield {
                  type: 'content_block_delta',
                  index: 0,
                  delta: { type: 'text_delta', text: 'Hello' },
                }
                yield {
                  type: 'content_block_delta',
                  index: 0,
                  delta: { type: 'text_delta', text: '! How can I help?' },
                }
                yield { type: 'content_block_stop', index: 0 }
                yield { type: 'message_delta', delta: { stop_reason: 'end_turn' } }
                yield { type: 'message_stop' }
              },
            }
            return Promise.resolve(mockStream)
          }
          return Promise.resolve(mockMessage)
        }),
      }
    },
  }
})

describe('AnthropicModel', () => {
  let model: AnthropicModel

  dotConfig()

  const proxy = process.env.HTTPS_PROXY ? new HttpsProxyAgent(process.env.HTTPS_PROXY) : undefined

  beforeEach(() => {
    // Clear any mocks
    vi.clearAllMocks()

    model = new AnthropicModel({
      anthropicApiKey: process.env.ANTHROPIC_API_KEY || 'test-api-key',
      httpAgent: proxy,
      debug: true,
    })
  })

  describe('Initialization', () => {
    it('should initialize the AnthropicModel correctly via class constructor', () => {
      expect(model).toBeInstanceOf(AnthropicModel)
      expect(model.apiType).toBe('chat_completion')
    })

    it('should initialize the AnthropicModel correctly via factory function', () => {
      const fModel = anthropicModel({
        anthropicApiKey: 'test-api-key',
        httpAgent: proxy,
      })

      expect(fModel).toBeInstanceOf(AnthropicModel)
      expect(fModel.apiType).toBe('chat_completion')
    })

    it('should throw an error if no API key is provided', () => {
      // Mock environment variable temporarily
      const originalApiKey = process.env.ANTHROPIC_API_KEY
      delete process.env.ANTHROPIC_API_KEY

      expect(() => new AnthropicModel({})).toThrow('[orion-ai] Anthropic API key is required.')

      // Restore environment variable
      if (originalApiKey) {
        process.env.ANTHROPIC_API_KEY = originalApiKey
      }
    })

    it('should use default model and max_tokens when not specified', () => {
      const testModel = new AnthropicModel({ anthropicApiKey: 'test-key' })
      expect(testModel).toBeInstanceOf(AnthropicModel)
    })
  })

  describe('Message Creation', () => {
    it('should successfully call the create method and return a response', async () => {
      const response = await model.create({
        messages: [
          new SystemMessage('You are a helpful assistant'),
          new UserMessage('Hello, how are you?'),
        ],
      })

      expect(response).toHaveProperty('content')
      expect(response).toHaveProperty('finish_reason')
      expect(response).toHaveProperty('tool_calls')
      expect(response.content).toBe('Hello! I am a helpful assistant. How can I help you today?')
      expect(response.finish_reason).toBe('end_turn')
      expect(response.usage).toEqual({
        prompt_tokens: 10,
        completion_tokens: 15,
        total_tokens: 25,
      })
    })

    it('should handle conversation with multiple messages', async () => {
      const response = await model.create({
        messages: [
          new SystemMessage('You are a frontend expert'),
          new UserMessage('What is React?'),
          new AssistantMessage('React is a JavaScript library'),
          new UserMessage('Tell me more about hooks'),
        ],
      })

      expect(response.content).toBeTypeOf('string')
      expect(response.content).not.toBe('')
    })

    it('should handle custom model parameter', async () => {
      const response = await model.create({
        model: 'claude-3-haiku-20240307',
        messages: [new UserMessage('Hello')],
      })

      expect(response.content).toBeTypeOf('string')
    })

    it('should handle custom max_tokens parameter', async () => {
      const response = await model.create({
        messages: [new UserMessage('Write a long story')],
        max_tokens: 1000,
      })

      expect(response.content).toBeTypeOf('string')
    })

    it('should throw error when stream is true in create method', async () => {
      await expect(
        model.create({
          messages: [new UserMessage('Hello')],
          stream: true,
        }),
      ).rejects.toThrow('For streaming, use createStream method instead')
    })
  })

  describe('Tool Usage', () => {
    it('should handle tool calls correctly', async () => {
      const tool = functionTool({
        name: 'test_tool',
        description: 'A test tool',
        schema: z.object({
          param: z.string().describe('Test parameter'),
        }),
        execute: async ({ param }) => `Tool executed with: ${param}`,
      })

      const response = await model.create({
        messages: [new UserMessage('Use the test tool')],
        tools: [tool],
      })

      expect(response.tool_calls).toHaveLength(1)
      expect(response.tool_calls[0]).toEqual({
        id: 'tool_call_test',
        type: 'function',
        function: {
          name: 'test_tool',
          arguments: JSON.stringify({ param: 'value' }),
        },
      })
    })

    it('should handle multiple tools', async () => {
      const tool1 = functionTool({
        name: 'tool1',
        description: 'First tool',
        schema: z.object({
          input: z.string(),
        }),
        execute: async ({ input }) => `Tool1: ${input}`,
      })

      const tool2 = functionTool({
        name: 'tool2',
        description: 'Second tool',
        schema: z.object({
          data: z.number(),
        }),
        execute: async ({ data }) => `Tool2: ${data}`,
      })

      const response = await model.create({
        messages: [new UserMessage('Use available tools')],
        tools: [tool1, tool2],
      })

      expect(response).toHaveProperty('tool_calls')
    })
  })

  describe('Streaming', () => {
    it('should create a streaming response', async () => {
      const stream = await model.createStream({
        messages: [new UserMessage('Tell me a story')],
      })

      expect(stream).toBeDefined()
      expect(typeof stream[Symbol.asyncIterator]).toBe('function')

      // Test streaming iteration
      const chunks: any[] = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      expect(chunks.length).toBeGreaterThan(0)
      expect(chunks[0]).toHaveProperty('type')
    })

    it('should handle streaming with tools', async () => {
      const tool = functionTool({
        name: 'stream_tool',
        description: 'Tool for streaming',
        schema: z.object({
          query: z.string(),
        }),
        execute: async ({ query }) => `Streaming result for: ${query}`,
      })

      const stream = await model.createStream({
        messages: [new UserMessage('Use the stream tool')],
        tools: [tool],
      })

      expect(stream).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      // Mock an API error
      const errorModel = new AnthropicModel({ anthropicApiKey: 'test-key' })

      // Override the mock to throw an error
      vi.mocked(errorModel['anthropic'].messages.create).mockRejectedValueOnce(
        new Error('API Error: Rate limit exceeded'),
      )

      await expect(
        errorModel.create({
          messages: [new UserMessage('This should fail')],
        }),
      ).rejects.toThrow('API Error: Rate limit exceeded')
    })

    it('should handle malformed responses', async () => {
      // This test would be more relevant with real API calls
      // For now, we ensure the parseResult method handles edge cases
      const malformedResult = {
        id: 'test',
        type: 'message',
        role: 'assistant',
        content: [],
        model: 'claude-3-5-sonnet-20240620',
        stop_reason: null,
        usage: null,
      } as any

      const parsed = model['parseResult'](malformedResult)
      expect(parsed.content).toBe('')
      expect(parsed.tool_calls).toEqual([])
      expect(parsed.usage).toBeUndefined()
    })
  })

  describe('Configuration', () => {
    it('should respect debug configuration', async () => {
      const debugModel = new AnthropicModel({
        anthropicApiKey: 'test-key',
        debug: true,
      })

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await debugModel.create({
        messages: [new UserMessage('Hello')],
      })

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should handle proxy configuration', () => {
      const proxyModel = new AnthropicModel({
        anthropicApiKey: 'test-key',
        httpAgent: proxy,
      })

      expect(proxyModel).toBeInstanceOf(AnthropicModel)
    })
  })

  describe('Message Parsing', () => {
    it('should correctly parse system messages', async () => {
      const response = await model.create({
        messages: [new SystemMessage('You are a helpful assistant'), new UserMessage('Hello')],
      })

      expect(response.content).toBeTypeOf('string')
    })

    it('should handle messages without system prompt', async () => {
      const response = await model.create({
        messages: [
          new UserMessage('Hello'),
          new AssistantMessage('Hi there!'),
          new UserMessage('How are you?'),
        ],
      })

      expect(response.content).toBeTypeOf('string')
    })

    it('should handle empty content arrays', () => {
      const result = {
        id: 'test',
        type: 'message',
        role: 'assistant',
        content: [],
        model: 'claude-3-5-sonnet-20240620',
        stop_reason: 'end_turn',
        usage: { input_tokens: 5, output_tokens: 0 },
      } as any

      const parsed = model['parseResult'](result)
      expect(parsed.content).toBe('')
      expect(parsed.tool_calls).toEqual([])
    })
  })
})

// Integration tests (only run when API key is available)
describe('AnthropicModel Integration Tests', () => {
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY

  if (!hasApiKey) {
    it.skip('Skipping integration tests - no API key provided', () => {})
    return
  }

  let realModel: AnthropicModel

  beforeEach(() => {
    realModel = new AnthropicModel({
      anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
      httpAgent: process.env.HTTPS_PROXY ? new HttpsProxyAgent(process.env.HTTPS_PROXY) : undefined,
    })
  })

  it('should make a real API call', async () => {
    const response = await realModel.create({
      messages: [
        new SystemMessage('You are a helpful assistant. Respond briefly.'),
        new UserMessage('Say hello'),
      ],
    })

    expect(response.content).toBeTypeOf('string')
    expect(response.content.length).toBeGreaterThan(0)
    expect(response.finish_reason).toBeTypeOf('string')
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

    const response = await realModel.create({
      messages: [new UserMessage('What is the weather like in Paris?')],
      tools: [weatherTool],
    })

    expect(response).toBeDefined()
    // The model might or might not use the tool, but the response should be valid
    expect(typeof response.content === 'string' || response.tool_calls.length > 0).toBe(true)
  }, 30000)
})
