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
} from 'openai/resources/chat/completions.mjs'
import type { ChatModel } from 'openai/resources/index.mjs'
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
      DEV_LOGGER.WARNING('output.choices[0]', result.choices[0].message.tool_calls)

      const response: IBaseCreateResponse = {
        finish_reason: result.choices[0].finish_reason || '',
        content: result.choices[0].message.content || '',
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
      const { model, messages, tools, ...rest } = body

      console.log('[orion-ai] DeepSeekModel.create \n', model || this.config.model || DEFAULT_MODEL)

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
      throw error
    }
  }
}

export const deepseekModel = (config: IDeepSeekModelConfig = {}): DeepSeekModel =>
  new DeepSeekModel(config)
