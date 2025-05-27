import Anthropic, { type ClientOptions } from '@anthropic-ai/sdk'
import type {
  MessageCreateParamsNonStreaming,
  MessageCreateParamsStreaming,
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
import type { Stream } from 'openai/streaming.mjs'

export interface IAnthropicModelFields extends Omit<ClientOptions, 'apiKey'>, IBaseModelConfig {
  model?: Model
  anthropicApiKey?: string
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
  public readonly apiType = 'chat_completion' as const

  constructor(config: IAnthropicModelFields = {}) {
    super(config)

    const apiKey = config.anthropicApiKey || readEnv('ANTHROPIC_API_KEY')

    if (!apiKey) {
      DEV_LOGGER.ERROR('Anthropic API key is required.')
      throw new Error('[orion-ai] Anthropic API key is required.')
    }

    this.anthropic = this.init({ ...config, apiKey })
  }

  protected init(config: IAnthropicModelFields & { apiKey: string }): Anthropic {
    const { apiKey, anthropicApiKey, ...rest } = config
    return new Anthropic({
      ...rest,
      apiKey,
    })
  }

  private parseMessages(messages: Array<TMessage>): Array<MessageParam> {
    const parsedMessages: Array<MessageParam> = []

    for (const message of messages) {
      // Handle system messages separately as they need special treatment in Claude
      if (message.role === 'system') {
        // In Claude, system messages are typically handled as part of the system parameter
        continue
      }

      parsedMessages.push({
        role: message.role as 'user' | 'assistant',
        content: message.content as string,
      })
    }

    if (this.config.debug) {
      console.log('[orion-ai] parseMessages', parsedMessages)
    }
    return parsedMessages
  }

  private extractSystemMessage(messages: Array<TMessage>): string | undefined {
    const systemMessage = messages.find((msg) => msg.role === 'system')
    return systemMessage ? (systemMessage.content as string) : undefined
  }

  public async create(
    body: IAnthropicCreateParams,
    options: RequestOptions = {},
  ): Promise<IBaseCreateResponse> {
    try {
      const { model, messages, tools, stream, ...rest } = body

      if (stream) {
        throw new Error('For streaming, use createStream method instead')
      }

      const systemMessage = this.extractSystemMessage(messages)
      const nonSystemMessages = this.parseMessages(messages)

      const requestParams: MessageCreateParamsNonStreaming = {
        ...rest,
        model: model || this.config.model || DEFAULT_MODEL,
        messages: nonSystemMessages,
        max_tokens: body.max_tokens || DEFAULT_MAX_TOKENS,
        ...(systemMessage && { system: systemMessage }),
        ...(tools &&
          tools.length > 0 && {
            tools: tools.map((tool) => tool.toJSON()) as Array<ToolUnion>,
          }),
      }

      const response = await this.anthropic.messages.create(requestParams, options)

      return this.parseResult(response)
    } catch (error) {
      DEV_LOGGER.ERROR('AnthropicModel.create:', error)
      throw error
    }
  }

  public async createStream(
    params: IAnthropicCreateParams,
    options: RequestOptions = {},
  ): Promise<Stream<any>> {
    try {
      const { model, messages, tools, ...rest } = params

      const systemMessage = this.extractSystemMessage(messages)
      const nonSystemMessages = this.parseMessages(messages)

      const requestParams: MessageCreateParamsStreaming = {
        ...rest,
        model: model || this.config.model || DEFAULT_MODEL,
        messages: nonSystemMessages,
        max_tokens: params.max_tokens || DEFAULT_MAX_TOKENS,
        stream: true,
        ...(systemMessage && { system: systemMessage }),
        ...(tools &&
          tools.length > 0 && {
            tools: tools.map((tool) => tool.toJSON()) as Array<ToolUnion>,
          }),
      }

      const stream = await this.anthropic.messages.create(requestParams, options)

      return stream as any // Type assertion for compatibility with base class
    } catch (error) {
      DEV_LOGGER.ERROR('AnthropicModel.createStream:', error)
      throw error
    }
  }

  protected parseResult(result: Anthropic.Messages.Message): IBaseCreateResponse {
    if (this.config.debug) {
      console.log('[orion-ai] parseResult', result)
    }

    const { content, stop_reason, usage } = result

    // Extract text content
    const textContent = content
      .filter((item) => item.type === 'text')
      .map((item) => (item as any).text)
      .join('')

    // Extract tool calls
    const toolCalls = content
      .filter((item) => item.type === 'tool_use')
      .map((item) => {
        const toolUse = item as any
        return {
          id: toolUse.id,
          type: 'function' as const,
          function: {
            name: toolUse.name,
            arguments: JSON.stringify(toolUse.input),
          },
        }
      })

    const response: IBaseCreateResponse = {
      content: textContent,
      finish_reason: stop_reason || '',
      tool_calls: toolCalls,
      usage: usage
        ? {
            prompt_tokens: usage.input_tokens,
            completion_tokens: usage.output_tokens,
            total_tokens: usage.input_tokens + usage.output_tokens,
          }
        : undefined,
    }

    return response
  }
}

export const anthropicModel = (config: IAnthropicModelFields = {}): AnthropicModel =>
  new AnthropicModel(config)
