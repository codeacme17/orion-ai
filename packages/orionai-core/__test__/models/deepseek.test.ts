import { z } from 'zod'
import { describe, it, expect, beforeEach } from 'vitest'
import { config as dotConfig } from 'dotenv'

import { DeepSeekModel, type IDeepSeekModelConfig } from '@/models'
import { userMessage, UserMessage } from '@/messages'
import { functionTool } from '@/tools/function'
import { mcpTool } from '@/tools'
import { DEV_LOGGER } from '@/lib/logger'

describe('DeepSeekModel', () => {
  let model: DeepSeekModel

  beforeEach(() => {
    dotConfig()
    model = new DeepSeekModel()
  })

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

    const result = await model.create({
      messages: [new UserMessage(`hi`)],
    })
    expect(result).not.toBe('')
  })

  it('should log debug info if debug is enabled', async () => {
    dotConfig()
    const model = new DeepSeekModel({ debug: true })

    await model.create({
      messages: [new UserMessage(`hi`)],
    })
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

    const result = await model.create({
      messages: [new UserMessage(`hi what the weather like in Hangzhou?`)],
      tools: [tool],
    })
    const res = await tool.run(result.tool_calls[0].function.arguments)
    expect(result).not.toBe('')
  })

  it('should invoke thinking and give the result', async () => {
    dotConfig()
    const model = new DeepSeekModel({
      model: 'deepseek-reasoner',
    })

    const res = await model.create({
      messages: [new UserMessage(`9.11 and 9.8, which is greater?`)],
    })
    console.log('[res]', JSON.stringify(res, null, 2))
    expect(res.thought).not.toBe('')
  })

  it('should create a streaming chat completion', async () => {
    dotConfig()

    const model = new DeepSeekModel({ debug: true })

    const result = await model.create({
      messages: [new UserMessage('Tell me about machine learning in 3 sentences')],
      stream: true,
    })
    let content = ''
    for await (const chunk of result) {
      if (chunk.choices[0]?.delta?.content) {
        content += chunk.choices[0].delta.content
      }
    }
    expect(content).not.toBe('')
    expect(content.length).toBeGreaterThan(10)
  })

  it('should support async iterator for stream processing', async () => {
    dotConfig()

    const model = new DeepSeekModel({ debug: true })

    // get a new stream for each test
    const stream = await model.create({
      messages: [new UserMessage('Give me a short joke')],
      stream: true,
    })

    expect(stream).toBeDefined()

    let contentFromIterator = ''

    // process the stream with async iterator
    for await (const chunk of stream) {
      if (chunk.choices[0]?.delta?.content) {
        console.log('chunk', chunk.choices[0].delta.content)
        contentFromIterator += chunk.choices[0].delta.content
      }
    }

    // check the content from async iterator
    expect(contentFromIterator.length).toBeGreaterThan(0)
    console.log('content from async iterator:', contentFromIterator)
  })

  it('should support thinking and streaming', async () => {
    dotConfig()

    const model = new DeepSeekModel({ model: 'deepseek-reasoner', debug: true })

    const result = await model.create({
      messages: [new UserMessage('9.11 and 9.8, which is greater?')],
      stream: true,
    })

    let content = ''
    for await (const chunk of result) {
      if (chunk.choices[0]?.delta?.content) {
        content += chunk.choices[0].delta.content
      }
    }
    expect(content.length).toBeGreaterThan(0)
  })

  it('should support mcp tool', async () => {
    const tools = await mcpTool(
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
