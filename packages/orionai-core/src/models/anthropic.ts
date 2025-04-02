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
  type IBaseCompleteParams,
  type IBaseCreateResponse,
  type IBaseModelConfig,
} from './base'
import { readEnv } from '@/lib/utils'
import type { TMessage } from '@/messages'
import type { BaseTool } from '@/tools'
import type { FunctionTool } from '@/tools/function'
import type { RequestOptions } from '@anthropic-ai/sdk/core.mjs'

export interface IAnthropicModelFields extends Omit<ClientOptions, 'apiKey'>, IBaseModelConfig {
  model?: Model
}

export interface IAnthropicCompleteParams
  extends Omit<MessageCreateParamsNonStreaming, 'messages' | 'model' | 'tools'>,
    IBaseCompleteParams {
  messages: Array<TMessage>
  model?: Model
  tools?: Array<BaseTool | FunctionTool>
}

const DEFAULT_MODEL = 'claude-3-5-sonnet-20240620'

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
      apiKey,
    })
  }

  public async create(
    body: IAnthropicCompleteParams,
    options: RequestOptions = {},
  ): Promise<IBaseCreateResponse> {
    try {
      const { model, messages, tools, ...rest } = body

      const response = await this.anthropic.messages.create(
        {
          ...rest,
          model: model || this.config.model || DEFAULT_MODEL,
          messages: messages as unknown as Array<MessageParam>,
          tools: tools?.map((tool) => tool.toJSON()) as Array<ToolUnion>,
        },
        options,
      )

      return this.parseResult(response)
    } catch (error) {
      console.error('[orion-ai] Anthropic API error:', error)
      throw error
    }
  }

  protected parseResult(result: any): IBaseCreateResponse {
    const response: IBaseCreateResponse = {
      content: result.output_text || '',
      finish_reason: result.finish_reason || '',
      usage: result.usage || {},
      tool_calls: result.tool_calls || [],
    }

    if (result.tool_calls) {
      response.tool_calls = result.tool_calls.map((toolCall: any) => ({
        id: toolCall.id,
        index: toolCall.index,
        type: toolCall.type,
        function: {
          name: toolCall.function.name,
          arguments: toolCall.function.arguments,
        },
      }))
    }

    return response
  }
}

export const anthropicModel = (config: IAnthropicModelFields = {}): AnthropicModel =>
  new AnthropicModel(config)
