import Openai, { type ClientOptions } from 'openai'
import { BaseModel, type IBaseCompleteParams, type IBaseModelConfig } from './base'
import { readEnv } from '@/lib/utils'
import type {
  ChatCompletionCreateParamsBase,
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'openai/resources/chat/completions.mjs'
import type { ChatModel } from 'openai/resources/index.mjs'
import type { RequestOptions } from 'openai/core.mjs'
import type { IChatCompletionMessage } from '@/messages'
import type { FunctionTool } from '@/tools/function'

export interface IDeepSeekModelFields extends ClientOptions, IBaseModelConfig {
  model?: (string & {}) | ChatModel
}

export interface IDeepSeekCompleteParams
  extends Omit<ChatCompletionCreateParamsBase, 'messages' | 'model' | 'tools'>,
    IBaseCompleteParams {
  messages: Array<IChatCompletionMessage>
  model?: (string & {}) | TChatModel
  tools?: Array<FunctionTool>
}

type TChatModel = 'deepseek-chat'

const DEFAULT_MODEL: TChatModel = 'deepseek-chat'
const DEFAULT_BASE_URL = 'https://api.deepseek.com/beta'

export class DeepSeekModel extends BaseModel {
  private deepseek: Openai

  constructor(config: IDeepSeekModelFields = {}) {
    super(config)

    const { apiKey } = config

    if (!apiKey && !readEnv('DEEPSEEK_API_KEY')) {
      throw new Error('[orion-ai] DeepSeek API key is required.')
    }

    this.deepseek = new Openai({
      ...config,
      apiKey: this.config.apiKey || readEnv('DEEPSEEK_API_KEY'),
      baseURL: config.baseURL || DEFAULT_BASE_URL,
    })
  }

  async create(body: IDeepSeekCompleteParams, options?: RequestOptions): Promise<string> {
    try {
      const { model, messages, tools, ...rest } = body

      const response = await this.deepseek.chat.completions.create(
        {
          ...rest,
          model: model || this.config.model || DEFAULT_MODEL,
          messages: messages as unknown as Array<ChatCompletionMessageParam>,
          tools: tools?.map((tool) => tool.toJSON()) as Array<ChatCompletionTool>,
        },
        { ...options },
      )

      console.log('response', response)

      if ('choices' in response) {
        return response.choices[0].message.content || ''
      }

      throw new Error('Unexpected response format')
    } catch (error) {
      throw error
    }
  }
}
