import { z } from 'zod'
import { describe, it, expect, beforeEach } from 'vitest'
import { openaiModel, OpenAIModel } from '@/models/openai'
import { config as dotConfig } from 'dotenv'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { AssistantMessage, SystemMessage, userMessage, UserMessage } from '@/messages'
import { DEV_LOGGER } from '@/lib/logger'
import { functionTool } from '@/tools/function'
import { mcpStdioTools } from '@/tools'

describe('OpenAIModel', () => {
  let model: OpenAIModel

  dotConfig()

  const proxy = new HttpsProxyAgent(process.env.HTTPS_PROXY || '')

  beforeEach(() => {
    model = new OpenAIModel({
      apiKey: process.env.OPENAI_API_KEY || '',
      httpAgent: proxy,
    })
  })

  it('should initialize the OpenAIModel correctly (by class)', () => {
    expect(model).toBeInstanceOf(OpenAIModel)
  })

  it('should initialize the OpenAIModel correctly (by function)', () => {
    const fModel = openaiModel({
      apiKey: process.env.OPENAI_API_KEY || '',
      httpAgent: proxy,
    })

    expect(fModel).toBeInstanceOf(OpenAIModel)
  })

  it('should throw an error if no API key is provided', () => {
    // Temporarily override the environment variable
    const originalApiKey = process.env.OPENAI_API_KEY
    process.env.OPENAI_API_KEY = ''

    expect(() => new OpenAIModel({ apiKey: '', model: 'gpt-4o-mini' })).toThrow(
      '[orion-ai] OpenAI API key is required.',
    )

    // Restore the original environment variable
    process.env.OPENAI_API_KEY = originalApiKey
  })

  it('should successfully call the complete method and return a response', async () => {
    const response = await model.create({
      messages: [
        new SystemMessage('You are a super frontend master, please reply to me in English'),
        new UserMessage('Please give me a debounce function'),
        new AssistantMessage('Sure, here is a debounce function'),
        new UserMessage(
          'Please first tell me your identity, then tell me what you answered to my last question',
        ),
      ],
    })

    console.log('response', response)

    expect(response.content).toBeTypeOf('string')
    expect(response.content).not.toBe('')
  })

  it('test image can be uploaded', async () => {
    const message = userMessage({
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
    })

    const response = await model.create({
      model: 'gpt-4o-mini',
      messages: [message],
    })

    DEV_LOGGER.SUCCESS('response', response.content)
    expect(response.content).toBeTypeOf('string')
    expect(response).not.toBe('')
  })

  it('should use a tool and give the result', async () => {
    const tool = functionTool({
      name: 'weather_tool',
      description: 'use this tool to get the weather',
      schema: z.object({
        city: z.string().describe('The city to get weather for'),
      }),
      execute: async ({ city }) => `The weather in ${city} is sunny`,
    })

    const response = await model.create({
      messages: [new UserMessage(`hi what the temperature like in Hangzhou?`)],
      tools: [tool],
    })

    DEV_LOGGER.SUCCESS('response', response)
    expect(response).not.toBe('')
  })

  it('should create a streaming chat completion', async () => {
    const response = await model.create({
      messages: [new UserMessage('Tell me about machine learning in 3 sentences')],
      stream: true,
    })

    let result = ''
    for await (const chunk of response) {
      if (chunk.type === 'response.output_text.delta') {
        result += chunk.delta
      }
    }

    expect(result).not.toBe('')
  })

  it('should support funciton call in streaming', async () => {
    const tool = functionTool({
      name: 'weather_tool',
      description: 'use this tool to get the weather',
      schema: z.object({
        city: z.string().describe('The city to get weather for'),
      }),
      execute: async ({ city }) => `The weather in ${city} is sunny`,
    })

    const response = await model.create({
      messages: [new UserMessage(`hi what the temperature like in Hangzhou?`)],
      tools: [tool],
      stream: true,
    })

    let functionCallArguments = ''
    for await (const chunk of response) {
      if (chunk.type === 'response.function_call_arguments.delta') {
        functionCallArguments += (chunk as any).delta
      }
    }

    const toolResult = await tool.run(functionCallArguments)

    console.log('toolResult', toolResult)
    expect(toolResult).not.toBe('')
  })

  it('should support mcp tool', async () => {
    const tools = await mcpStdioTools(
      {
        toolNamePrefix: 'everything',
        clientName: 'everything-client',
        clientVersion: '1.0.0',
        verbose: true,
      },
      {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-everything'],
      },
    )

    console.log('[tools] ', tools)

    const response = await model.create({
      messages: [new UserMessage('use echo tool to echo "hello"')],
      tools: tools,
    })

    DEV_LOGGER.SUCCESS('response', response)
    expect(response).not.toBe('')
  })
})
