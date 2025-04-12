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
}

export interface IDeepSeekCompleteParamsWithStream extends IDeepSeekCompleteParams {
  stream: true
}

export interface IDeepSeekCompleteParamsWithoutStream extends IDeepSeekCompleteParams {
  stream?: false | null
}

type TChatModel = 'deepseek-chat' | 'deepseek-reasoner'

const DEFAULT_MODEL: TChatModel = 'deepseek-chat'
const DEFAULT_BASE_URL = 'https://api.deepseek.com/v1'

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
    body: IDeepSeekCompleteParamsWithStream,
    options?: RequestOptions,
  ): Promise<AsyncIterable<ChatCompletionChunk>>
  public async create(
    body: IDeepSeekCompleteParamsWithoutStream,
    options?: RequestOptions,
  ): Promise<IBaseCreateResponse>
  public async create(
    body: IDeepSeekCompleteParamsWithStream | IDeepSeekCompleteParamsWithoutStream,
    options?: RequestOptions,
  ): Promise<IBaseCreateResponse | AsyncIterable<ChatCompletionChunk>> {
    try {
      const { model, messages, tools, stream, ...rest } = body

      if (stream) {
        return this.createStream(body, options)
      }

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
   * create a streaming request
   * @returns return an async iterator, which can be iterated with for await...of syntax
   */
  protected async createStream(
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

      return stream as Stream<ChatCompletionChunk>
    } catch (error) {
      this.debug && DEV_LOGGER.ERROR('DeepSeekModel.createStream error', error)
      throw error
    }
  }
}

export const deepseekModel = (config: IDeepSeekModelConfig = {}): DeepSeekModel =>
  new DeepSeekModel(config)
