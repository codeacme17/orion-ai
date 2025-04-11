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

  it('should race the stream and timeout', async () => {
    dotConfig()

    const model = new DeepSeekModel({ debug: true })
    const body: IDeepSeekCompleteParams = {
      messages: [new UserMessage('What is AI?')],
    }

    const stream = await model.createStream(body)

    // 测试stream是否正确返回
    expect(stream).toBeDefined()

    // 使用异步迭代器方式处理流
    let receivedData = false
    let content = ''

    // 设置超时
    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Stream processing timed out'))
      }, 15000)
    })

    const processingPromise = (async () => {
      try {
        for await (const chunk of stream) {
          receivedData = true
          if (chunk.choices[0]?.delta?.content) {
            content += chunk.choices[0].delta.content
            console.log(`接收数据: ${chunk.choices[0].delta.content}`)
          }
        }
        console.log('流处理完成，最终内容:', content)
        expect(receivedData).toBe(true)
        expect(content.length).toBeGreaterThan(0)
      } catch (err) {
        console.error('流处理错误:', err)
        throw err
      }
    })()

    // 使用 Promise.race 处理超时
    const res = await Promise.race([processingPromise, timeoutPromise])
  })

  it('should support async iterator for stream processing', async () => {
    dotConfig()

    const model = new DeepSeekModel({ debug: true })
    const body: IDeepSeekCompleteParams = {
      messages: [new UserMessage('Give me a short joke')],
    }

    // 每次测试获取新的流
    const stream = await model.createStream(body)
    expect(stream).toBeDefined()

    let contentFromIterator = ''

    // 使用异步迭代器处理流
    for await (const chunk of stream) {
      if (chunk.choices[0]?.delta?.content) {
        console.log('chunk', chunk.choices[0].delta.content)
        contentFromIterator += chunk.choices[0].delta.content
      }
    }

    // 检查通过异步迭代器获取的内容
    expect(contentFromIterator.length).toBeGreaterThan(0)
    console.log('通过异步迭代器获取的内容:', contentFromIterator)
  })

  // 测试流可以被多次迭代
  it('should handle multiple iterations of the same stream', async () => {
    dotConfig()

    const model = new DeepSeekModel({ debug: true })
    const body: IDeepSeekCompleteParams = {
      messages: [new UserMessage('Tell me a short fact')],
    }

    // 获取流
    const stream = await model.createStream(body)

    // 第一次迭代
    let content1 = ''
    for await (const chunk of stream) {
      if (chunk.choices[0]?.delta?.content) {
        content1 += chunk.choices[0].delta.content
      }
    }

    console.log('第一次迭代内容:', content1)
    expect(content1.length).toBeGreaterThan(0)

    // 第二次迭代应该也能工作，因为我们实现了缓存功能
    let content2 = ''
    try {
      // 再次迭代同一个流对象
      for await (const chunk of stream) {
        if (chunk.choices[0]?.delta?.content) {
          content2 += chunk.choices[0].delta.content
        }
      }
      console.log('第二次迭代内容:', content2)
      // 两次迭代的内容应该完全相同
      expect(content2).toBe(content1)
    } catch (err) {
      console.error('第二次迭代失败:', err)
      throw err // 现在我们期望测试通过，所以如果有错误就失败
    }
  })
})
