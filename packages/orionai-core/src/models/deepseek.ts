import Openai, { type ClientOptions } from 'openai'
import { BaseModel, type IBaseCompleteParams, type IBaseModelConfig } from './base'
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

export interface IDeepSeekModelConfig extends ClientOptions, IBaseModelConfig {
  model?: (string & {}) | ChatModel
}

export interface IDeepSeekCompleteParams
  extends Omit<ChatCompletionCreateParamsBase, 'messages' | 'model' | 'tools'>,
    IBaseCompleteParams {
  messages: Array<TMessage>
  model?: (string & {}) | TChatModel
  tools?: Array<BaseTool>
}

type TChatModel = 'deepseek-chat'

const DEFAULT_MODEL: TChatModel = 'deepseek-chat'
const DEFAULT_BASE_URL = 'https://api.deepseek.com/v1'

export class DeepSeekModel extends BaseModel {
  private deepseek: Openai

  constructor(config: IDeepSeekModelConfig = {}) {
    super(config)

    const { apiKey } = config

    if (!apiKey && !readEnv('DEEPSEEK_API_KEY')) {
      throw new Error('[orion-ai] DeepSeek API key is required.')
    }

    this.deepseek = this.init(config)
  }

  init(config: IDeepSeekModelConfig): Openai {
    const { apiKey } = config

    if (!apiKey && !readEnv('OPENAI_API_KEY')) {
      throw new Error('OpenAI API key is required.')
    }

    return new Openai({
      ...config,
      apiKey: this.config.apiKey || readEnv('DEEPSEEK_API_KEY'),
      baseURL: config.baseURL || DEFAULT_BASE_URL,
    })
  }

  private parseOutput(output: any): string {
    if ('choices' in output) {
      DEV_LOGGER.WARNING('output.choices[0]', output.choices[0])
      return output.choices[0].message || ''
    }

    throw new Error('Unexpected response format')
  }

  async create(body: IDeepSeekCompleteParams, options?: RequestOptions): Promise<any> {
    try {
      const { model, messages, tools, ...rest } = body

      DEV_LOGGER.INFO('tools', tools)

      const response = await this.deepseek.chat.completions.create(
        {
          ...rest,
          model: model || this.config.model || DEFAULT_MODEL,
          messages: messages as unknown as Array<ChatCompletionMessageParam>,
          tools: tools?.map((tool) => tool.toJSON()) as Array<ChatCompletionTool>,
        },
        { ...options },
      )

      DEV_LOGGER.WARNING('response', response)
      return this.parseOutput(response)
    } catch (error) {
      throw error
    }
  }
}

export const deepseekModel = (config: IDeepSeekModelConfig = {}): DeepSeekModel =>
  new DeepSeekModel(config)
