import Openai, { type ClientOptions } from 'openai'
import {
  BaseModel,
  type IBaseCreateParams,
  type IBaseCreateResponse,
  type IBaseModelConfig,
  type IToolCallChatCompletionResult,
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
import type { Stream } from 'openai/streaming.mjs'

export interface IDeepSeekModelConfig extends ClientOptions, IBaseModelConfig {
  model?: (string & {}) | TDeepseekModel
}

export interface IDeepSeekCreateParams
  extends Omit<ChatCompletionCreateParamsBase, 'messages' | 'model' | 'tools'>,
    IBaseCreateParams {
  model?: (string & {}) | TDeepseekModel
}

export interface IDeepSeekCreateParamsWithStream extends IDeepSeekCreateParams {
  stream: true
}

export interface IDeepSeekCreateParamsWithoutStream extends IDeepSeekCreateParams {
  stream?: false | null
}

export interface IDeepSeekCreateResponse extends IBaseCreateResponse {
  tool_calls: IToolCallChatCompletionResult[]
}

export type TDeepseekCreatParams =
  | IDeepSeekCreateParamsWithStream
  | IDeepSeekCreateParamsWithoutStream

export type TDeepseekModel = 'deepseek-chat' | 'deepseek-reasoner'

const DEFAULT_MODEL: TDeepseekModel = 'deepseek-chat'
const DEFAULT_BASE_URL = 'https://api.deepseek.com/v1'

export class DeepSeekModel extends BaseModel {
  private deepseek: Openai
  private debug: boolean
  readonly apiType = 'chat_completion' as const

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

  /**
   * Initialize the OpenAI client
   * @param config The configuration for the OpenAI client
   * @returns The OpenAI client
   */
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

  /**
   * Parse the result from the OpenAI client
   * @param result The result from the OpenAI client
   * @returns The parsed result
   */
  protected parseResult(
    result:
      | Stream<Openai.Chat.Completions.ChatCompletionChunk>
      | Openai.Chat.Completions.ChatCompletion,
  ): IDeepSeekCreateResponse {
    if ('choices' in result) {
      const toolCalls = result.choices[0].message.tool_calls || []

      const parsedToolCalls: IToolCallChatCompletionResult[] = toolCalls.map((tool) => {
        return {
          id: tool.id,
          type: 'function' as const,
          function: {
            name: tool.function.name,
            arguments: tool.function.arguments,
          },
          role: 'assistant',
          content: result.choices[0].message.content || '',
        }
      })

      const response: IDeepSeekCreateResponse = {
        finish_reason: result.choices[0].finish_reason || '',
        content: result.choices[0].message.content || '',
        thought: (result.choices[0].message as any).reasoning_content || '',
        usage: result.usage || {},
        tool_calls: parsedToolCalls as Array<IToolCallChatCompletionResult>,
      }

      this.debug && DEV_LOGGER.INFO('DeepSeekModel.create \n', { ...response })

      return response
    }

    throw new Error('Unexpected response format')
  }

  /**
   * Create a chat completion
   * @param body The body of the request
   * @param options The options for the request
   * @returns The result of the request
   */
  public async create(
    body: IDeepSeekCreateParamsWithStream,
    options?: RequestOptions,
  ): Promise<Stream<ChatCompletionChunk>>
  public async create(
    body: IDeepSeekCreateParamsWithoutStream,
    options?: RequestOptions,
  ): Promise<IDeepSeekCreateResponse>
  public async create(
    body: TDeepseekCreatParams,
    options?: RequestOptions,
  ): Promise<IBaseCreateResponse | Stream<ChatCompletionChunk>> {
    try {
      const { model, messages, tools, stream, ...rest } = body

      // create a stream if stream is true
      if (stream) {
        return this.createStream(body, options)
      }

      // create a chat completion
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
    body: IDeepSeekCreateParams,
    options?: RequestOptions,
  ): Promise<Stream<ChatCompletionChunk>> {
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
