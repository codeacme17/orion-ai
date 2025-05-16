import Anthropic, { type ClientOptions } from '@anthropic-ai/sdk'
import type {
  MessageCreateParamsNonStreaming,
  MessageParam,
  Model,
  ToolUnion,
} from '@anthropic-ai/sdk/resources/index.mjs'
import { DEV_LOGGER } from '@/lib/logger'
import {
  BaseModel,
  type IBaseCreateParams,
  type IBaseCreateResponse,
  type IBaseModelConfig,
} from './base'
import { readEnv } from '@/lib/utils'
import { type TMessage } from '@/messages'
import type { BaseTool } from '@/tools'
import type { FunctionTool } from '@/tools/function'
import type { RequestOptions } from '@anthropic-ai/sdk/core.mjs'

export interface IAnthropicModelFields extends Omit<ClientOptions, 'apiKey'>, IBaseModelConfig {
  model?: Model
}

export interface IAnthropicCreateParams
  extends Omit<MessageCreateParamsNonStreaming, 'messages' | 'model' | 'tools' | 'max_tokens'>,
    IBaseCreateParams {
  messages: Array<TMessage>
  model?: Model
  tools?: Array<BaseTool | FunctionTool>
  max_tokens?: number
}

const DEFAULT_MODEL = 'claude-3-5-sonnet-20240620'
const DEFAULT_MAX_TOKENS = 4096

export class AnthropicModel extends BaseModel {
  private anthropic: Anthropic

  constructor(config: IAnthropicModelFields) {
    super(config)

    const apiKey = config.anthropicApiKey || readEnv('ANTHROPIC_API_KEY')

    if (!apiKey) {
      DEV_LOGGER.ERROR('Anthropic API key is required.')
      throw new Error('[orion-ai] Anthropic API key is required.')
    }

    this.anthropic = new Anthropic({
      ...config,
      apiKey,
    })
  }

  protected init(config: IAnthropicModelFields): Anthropic {
    const { apiKey, ...rest } = config
    return new Anthropic({
      ...rest,
      apiKey,
    })
  }

  private parseMessages(messages: Array<TMessage>): Array<MessageParam> {
    const parsedMessages: Array<MessageParam> = []
    for (const message of messages) {
      parsedMessages.push({
        role: message.role as 'user' | 'assistant',
        content: message.content as string,
      })
    }

    console.log('[orion-ai] parseMessages', parsedMessages)
    return parsedMessages
  }

  public async create(
    body: IAnthropicCreateParams,
    options: RequestOptions = {},
  ): Promise<IBaseCreateParams> {
    try {
      const { model, messages, tools, ...rest } = body

      const response = await this.anthropic.messages.create(
        {
          ...rest,
          model: model || this.config.model || DEFAULT_MODEL,
          messages: this.parseMessages(messages),
          tools: tools?.map((tool) => tool.toJSON()) as Array<ToolUnion>,
          max_tokens: body.max_tokens || DEFAULT_MAX_TOKENS,
        },
        options,
      )

      return this.parseResult(response)
    } catch (error) {
      console.error('AnthropicModel.create:', error)
      throw error
    }
  }

  protected parseResult(result: Anthropic.Messages.Message): IBaseCreateResponse {
    console.log('[orion-ai] parseResult', result)

    const { content } = result

    const response: IBaseCreateResponse = {
      content: content
        .map((item) => {
          if (item.type === 'text') return item.text
        })
        .join('. '),
      finish_reason: '',
      tool_calls: [],
    }

    return response
  }
}

export const anthropicModel = (config: IAnthropicModelFields = {}): AnthropicModel =>
  new AnthropicModel(config)
