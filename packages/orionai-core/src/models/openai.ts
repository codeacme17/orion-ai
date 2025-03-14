import Openai, { type ClientOptions } from 'openai'
import { BaseModel, type IBaseCompleteParams, type IBaseModelConfig } from './base'
import { readEnv } from '@/lib/utils'
import type {
  ChatCompletionCreateParamsBase,
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'openai/resources/chat/completions.mjs'
import type { ChatModel } from 'openai/resources/index.mjs'
import type { IChatCompletionMessage } from '@/messages'
import type { RequestOptions } from 'openai/core.mjs'
import type { BaseTool } from '@/tools'

export interface IOpenAIModelFields extends ClientOptions, IBaseModelConfig {
  model?: (string & {}) | ChatModel
}

export interface IOpenaiCompleteParams
  extends Omit<ChatCompletionCreateParamsBase, 'messages' | 'model' | 'tools'>,
    IBaseCompleteParams {
  messages: Array<IChatCompletionMessage>
  model?: (string & {}) | ChatModel
  tools?: Array<BaseTool>
}

const DEFAULT_MODEL: ChatModel = 'gpt-4o-mini'

export class OpenAIModel extends BaseModel {
  private openai: Openai

  constructor(config: IOpenAIModelFields = {}) {
    super(config)

    const { apiKey } = config

    if (!apiKey && !readEnv('OPENAI_API_KEY')) {
      throw new Error('[orion-ai] OpenAI API key is required.')
    }

    this.openai = new Openai({
      ...config,
      apiKey: this.config.apiKey || readEnv('OPENAI_API_KEY'),
    })
  }

  async create(body: IOpenaiCompleteParams, options?: RequestOptions): Promise<string> {
    try {
      const { model, messages, tools, ...rest } = body

      const response = await this.openai.chat.completions.create(
        {
          ...rest,
          model: model || this.config.model || DEFAULT_MODEL,
          messages: messages as unknown as Array<ChatCompletionMessageParam>,
          tools: tools?.map((tool) => tool.toJSON()) as Array<ChatCompletionTool>,
        },
        { ...options },
      )

      if ('choices' in response) {
        return response.choices[0].message.content || ''
      }

      throw new Error('Unexpected response format')
    } catch (error) {
      throw error
    }
  }
}
