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

  it('should create a streaming chat completion', async () => {
    dotConfig()

    const model = new DeepSeekModel({ debug: true })
    const body: IDeepSeekCompleteParams = {
      messages: [new UserMessage('Tell me about machine learning in 3 sentences')],
      stream: true,
    }

    const result = await model.create(body)
    expect(result.content).not.toBe('')
    expect(result.content.length).toBeGreaterThan(10)
  })

  it('should support async iterator for stream processing', async () => {
    dotConfig()

    const model = new DeepSeekModel({ debug: true })
    const body: IDeepSeekCompleteParams = {
      messages: [new UserMessage('Give me a short joke')],
    }

    // get a new stream for each test
    const stream = await model.createStream(body)
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

  // test the stream can be iterated multiple times
  it('should handle multiple iterations of the same stream', async () => {
    dotConfig()

    const model = new DeepSeekModel({ debug: true })
    const body: IDeepSeekCompleteParams = {
      messages: [new UserMessage('Tell me a short fact')],
    }

    // get a stream
    const stream = await model.createStream(body)

    // first iteration
    let content1 = ''
    for await (const chunk of stream) {
      if (chunk.choices[0]?.delta?.content) {
        content1 += chunk.choices[0].delta.content
      }
    }

    console.log('first iteration content:', content1)
    expect(content1.length).toBeGreaterThan(0)

    // second iteration should also work, because we implemented the cache function
    let content2 = ''
    try {
      // second iteration
      for await (const chunk of stream) {
        if (chunk.choices[0]?.delta?.content) {
          content2 += chunk.choices[0].delta.content
        }
      }
      console.log('second iteration content:', content2)
      // the content of the two iterations should be the same
      expect(content2).toBe(content1)
    } catch (err) {
      console.error('second iteration failed:', err)
      throw err // now we expect the test to pass, so if there is an error, it will fail
    }
  })
})
