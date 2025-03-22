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
import type { TMessage } from '@/messages'
import type { RequestOptions } from 'openai/core.mjs'
import type { BaseTool } from '@/tools'

export interface IOpenAIModelConfig extends ClientOptions, IBaseModelConfig {
  model?: (string & {}) | ChatModel
}

export interface IOpenaiCompleteParams
  extends Omit<ChatCompletionCreateParamsBase, 'messages' | 'model' | 'tools'>,
    IBaseCompleteParams {
  messages: Array<TMessage>
  model?: (string & {}) | ChatModel
  tools?: Array<BaseTool>
}

const DEFAULT_MODEL: ChatModel = 'gpt-4o-mini'

export class OpenAIModel extends BaseModel {
  private openai: Openai

  constructor(config: IOpenAIModelConfig = {}) {
    super(config)

    const { apiKey } = config

    if (!apiKey && !readEnv('OPENAI_API_KEY')) {
      DEV_LOGGER.ERROR('OpenAI API key is required.')
      throw new Error('[orion-ai] OpenAI API key is required.')
    }

    this.openai = this.init(config)
  }

  init(config: IOpenAIModelConfig): Openai {
    const { apiKey } = config

    if (!apiKey && !readEnv('OPENAI_API_KEY')) {
      throw new Error('OpenAI API key is required.')
    }

    return new Openai({
      ...config,
      apiKey: this.config.apiKey || readEnv('OPENAI_API_KEY'),
    })
  }

  protected parseResult(result: any): IBaseCreateResponse {
    if ('choices' in result) {
      DEV_LOGGER.WARNING('output.choices[0]', result.choices[0].message.tool_calls)

      return {
        finish_reason: result.choices[0].finish_reason || '',
        content: result.choices[0].message.content || '',
        usage: result.usage || {},
        tool_calls: result.choices[0].message.tool_calls as unknown as Array<IToolCallResult>,
      }
    }

    throw new Error('Unexpected response format')
  }

  public async create(
    body: IOpenaiCompleteParams,
    options?: RequestOptions,
  ): Promise<IBaseCreateResponse> {
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

      DEV_LOGGER.WARNING('response', response)
      return this.parseResult(response)
    } catch (error) {
      DEV_LOGGER.ERROR(error)
      throw error
    }
  }
}

export const openaiModel = (config: IOpenAIModelConfig = {}): OpenAIModel => new OpenAIModel(config)
