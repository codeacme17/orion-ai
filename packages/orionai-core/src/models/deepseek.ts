import Openai, { type ClientOptions } from 'openai'
import {
  BaseModel,
  type IBaseCompleteParams,
  type IBaseCreateResponse,
  type IBaseModelConfig,
  type IToolCallResult,
} from './base'
import { readEnv } from '@/lib/utils'
import { DEV_LOGGER } from '@/lib/logger'
import type {
  ChatCompletionCreateParamsBase,
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatCompletionChunk,
} from 'openai/resources/chat/completions.mjs'
import type { RequestOptions } from 'openai/core.mjs'
import type { TMessage } from '@/messages'
import type { BaseTool } from '@/tools'
import type { FunctionTool } from '@/tools/function'
import type { Stream } from 'openai/streaming.mjs'

export interface IDeepSeekModelConfig extends ClientOptions, IBaseModelConfig {
  model?: (string & {}) | TChatModel
}

export interface IDeepSeekCompleteParams
  extends Omit<ChatCompletionCreateParamsBase, 'messages' | 'model' | 'tools'>,
    IBaseCompleteParams {
  messages: Array<TMessage>
  model?: (string & {}) | TChatModel
  tools?: Array<BaseTool | FunctionTool>
  stream?: boolean
}

type TChatModel = 'deepseek-chat' | 'deepseek-reasoner'

const DEFAULT_MODEL: TChatModel = 'deepseek-chat'
const DEFAULT_BASE_URL = 'https://api.deepseek.com/v1'

/**
 * 提供缓存功能的流式处理类
 * 第一次迭代时缓存所有数据，后续迭代时从缓存读取
 */
class CachedStream<T> implements AsyncIterable<T> {
  private chunks: T[] = []
  private originalStream: Stream<T>
  private isFirstIteration: boolean = true
  private debug: boolean

  constructor(stream: Stream<T>, debug: boolean = false) {
    this.originalStream = stream
    this.debug = debug
  }

  [Symbol.asyncIterator](): AsyncIterator<T> {
    if (this.isFirstIteration) {
      // 第一次迭代：读取原始流并缓存结果
      this.debug && DEV_LOGGER.INFO('First iteration: caching chunks')
      return this.streamAndCache()
    } else {
      // 后续迭代：从缓存返回数据
      this.debug && DEV_LOGGER.INFO('Using cached chunks', { count: this.chunks.length })
      return this.iterateCache()
    }
  }

  private streamAndCache(): AsyncIterator<T> {
    const self = this
    const origIterator = this.originalStream[Symbol.asyncIterator]()

    return {
      async next(): Promise<IteratorResult<T>> {
        try {
          const result = await origIterator.next()

          if (!result.done && result.value) {
            self.chunks.push(result.value)
          }

          if (result.done) {
            self.isFirstIteration = false
          }

          return result
        } catch (error) {
          self.isFirstIteration = false
          DEV_LOGGER.ERROR('Error in stream iterator', error)
          throw error
        }
      },

      async return(): Promise<IteratorResult<T>> {
        self.isFirstIteration = false
        return { done: true, value: undefined as any }
      },

      async throw(error?: any): Promise<IteratorResult<T>> {
        self.isFirstIteration = false
        DEV_LOGGER.ERROR('Error in stream iterator', error)
        return { done: true, value: undefined as any }
      },
    }
  }

  private iterateCache(): AsyncIterator<T> {
    let index = 0
    const chunks = this.chunks

    return {
      async next(): Promise<IteratorResult<T>> {
        if (index < chunks.length) {
          return { done: false, value: chunks[index++] }
        } else {
          return { done: true, value: undefined as any }
        }
      },

      async return(): Promise<IteratorResult<T>> {
        return { done: true, value: undefined as any }
      },

      async throw(error?: any): Promise<IteratorResult<T>> {
        DEV_LOGGER.ERROR('Error in cached iterator', error)
        return { done: true, value: undefined as any }
      },
    }
  }
}

/**
 * 流式响应处理助手，用于累积流式响应的结果
 */
class StreamResponseAccumulator {
  private content: string = ''
  private finish_reason: string = ''
  private tool_calls: Array<IToolCallResult> = []
  private thought: string = ''
  private debug: boolean

  constructor(debug: boolean = false) {
    this.debug = debug
  }

  processChunk(chunk: ChatCompletionChunk): void {
    const delta = chunk.choices[0]?.delta

    if (!delta) return

    if (delta.content) {
      this.content += delta.content
    }

    if (chunk.choices[0]?.finish_reason) {
      this.finish_reason = chunk.choices[0].finish_reason
    }

    if (delta.tool_calls) {
      this.processToolCalls(delta.tool_calls)
    }

    // 处理思考内容（deepseek-reasoner 特性）
    if ((delta as any).reasoning_content) {
      this.thought += (delta as any).reasoning_content
    }

    if (this.debug) {
      DEV_LOGGER.INFO('Processed chunk', {
        content: delta.content,
        tool_calls: delta.tool_calls?.length,
        reasoning: (delta as any).reasoning_content,
      })
    }
  }

  private processToolCalls(toolCalls: any[]): void {
    if (!toolCalls.length) return

    if (!this.tool_calls.length) {
      // 第一个工具调用块
      this.tool_calls = toolCalls.map((tc) => ({
        id: tc.id || '',
        index: tc.index || 0,
        type: 'function',
        function: {
          name: tc.function?.name || '',
          arguments: tc.function?.arguments || '',
        },
      }))
    } else {
      // 更新现有工具调用
      toolCalls.forEach((tc) => {
        const existingTc = this.tool_calls.find((t) => t.id === tc.id)
        if (existingTc && tc.function) {
          existingTc.function.arguments += tc.function.arguments || ''
        }
      })
    }
  }

  getResult(): IBaseCreateResponse {
    return {
      content: this.content,
      finish_reason: this.finish_reason,
      tool_calls: this.tool_calls,
      thought: this.thought,
      usage: {}, // 流式响应无法获取 token 使用情况
    }
  }
}

export class DeepSeekModel extends BaseModel {
  private deepseek: Openai
  private debug: boolean

  constructor(config: IDeepSeekModelConfig = {}) {
    super(config)

    const apiKey = config.apiKey || readEnv('DEEPSEEK_API_KEY')

    if (!apiKey) {
      DEV_LOGGER.ERROR('Deepseek API key is required.')
      throw new Error('[orion-ai] DeepSeek API key is required.')
    }

    this.deepseek = this.init(config)
    this.debug = config.debug || false
  }

  protected init(config: IDeepSeekModelConfig): Openai {
    const { apiKey } = config

    if (!apiKey && !readEnv('OPENAI_API_KEY')) {
      throw new Error('OpenAI API key is required.')
    }

    this.debug && DEV_LOGGER.INFO('DeepSeekModel.init \n', { ...config })

    return new Openai({
      ...config,
      apiKey: this.config.apiKey || readEnv('DEEPSEEK_API_KEY'),
      baseURL: config.baseURL || DEFAULT_BASE_URL,
    })
  }

  protected parseResult(
    result:
      | Stream<Openai.Chat.Completions.ChatCompletionChunk>
      | Openai.Chat.Completions.ChatCompletion,
  ): IBaseCreateResponse {
    if ('choices' in result) {
      const response: IBaseCreateResponse = {
        finish_reason: result.choices[0].finish_reason || '',
        content: result.choices[0].message.content || '',
        thought: (result.choices[0].message as any).reasoning_content || '',
        usage: result.usage || {},
        tool_calls: result.choices[0].message.tool_calls as unknown as Array<IToolCallResult>,
      }

      this.debug && DEV_LOGGER.INFO('DeepSeekModel.create \n', { ...response })

      return response
    }

    throw new Error('Unexpected response format')
  }

  public async create(
    body: IDeepSeekCompleteParams,
    options?: RequestOptions,
  ): Promise<IBaseCreateResponse> {
    try {
      const { model, messages, tools, stream, ...rest } = body

      // 如果 stream 设置为 true，使用流式请求
      if (stream) {
        const streamIterable = await this.createStream(body, options)
        const accumulator = new StreamResponseAccumulator(this.debug)

        for await (const chunk of streamIterable) {
          accumulator.processChunk(chunk)
        }

        return accumulator.getResult()
      }

      // 非流式请求
      const response = await this.deepseek.chat.completions.create(
        {
          ...rest,
          model: model || this.config.model || DEFAULT_MODEL,
          messages: messages as unknown as Array<ChatCompletionMessageParam>,
          tools: tools?.map((tool) => tool.toJSON()) as Array<ChatCompletionTool>,
        },
        { ...options },
      )

      return this.parseResult(response)
    } catch (error) {
      this.debug && DEV_LOGGER.ERROR('DeepSeekModel.create error', error)
      throw error
    }
  }

  /**
   * 创建流式请求
   * @returns 返回一个异步迭代器，可以用 for await...of 语法遍历
   */
  public async createStream(
    body: IDeepSeekCompleteParams,
    options?: RequestOptions,
  ): Promise<AsyncIterable<ChatCompletionChunk>> {
    try {
      const { model, messages, tools, ...rest } = body

      const stream = await this.deepseek.chat.completions.create(
        {
          ...rest,
          model: model || this.config.model || DEFAULT_MODEL,
          messages: messages as unknown as Array<ChatCompletionMessageParam>,
          tools: tools?.map((tool) => tool.toJSON()) as Array<ChatCompletionTool>,
          stream: true,
        },
        { ...options },
      )

      this.debug && DEV_LOGGER.INFO('DeepSeekModel.createStream started')

      // 使用 CachedStream 封装原始流，确保一致的异步迭代器接口
      return new CachedStream(stream as Stream<ChatCompletionChunk>, this.debug)
    } catch (error) {
      this.debug && DEV_LOGGER.ERROR('DeepSeekModel.createStream error', error)
      throw error
    }
  }
}

export const deepseekModel = (config: IDeepSeekModelConfig = {}): DeepSeekModel =>
  new DeepSeekModel(config)
