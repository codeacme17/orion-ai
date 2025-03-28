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
import type { ChatModel } from 'openai/resources/index.mjs'
import type { TMessage } from '@/messages'
import type { RequestOptions } from 'openai/core.mjs'
import type { BaseTool } from '@/tools'
import type {
  ResponseCreateParamsNonStreaming,
  Tool,
  Response as OpenaiResponse,
  ResponseInput,
} from 'openai/resources/responses/responses.mjs'

export interface IOpenAIModelConfig extends ClientOptions, IBaseModelConfig {
  model?: (string & {}) | ChatModel
}

export interface IOpenaiCompleteParams
  extends Omit<
      ResponseCreateParamsNonStreaming,
      'messages' | 'model' | 'tools' | 'parallel_tool_calls' | 'input'
    >,
    IBaseCompleteParams {
  messages: Array<TMessage>
  model?: (string & {}) | ChatModel
  tools?: Array<BaseTool>
  parallel_tool_calls?: boolean | undefined
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

  public async create(
    body: IOpenaiCompleteParams,
    options?: RequestOptions,
  ): Promise<IBaseCreateResponse> {
    try {
      const { model, messages, tools, ...rest } = body

      const response = await this.openai.responses.create(
        {
          ...rest,
          model: model || this.config.model || DEFAULT_MODEL,
          input: messages as unknown as string | ResponseInput,
          tools: tools?.map((tool) => tool.toResponseJson()) as Array<Tool>,
        },
        options,
      )

      DEV_LOGGER.WARNING('response', response)
      return this.parseResult(response)
    } catch (error) {
      DEV_LOGGER.ERROR(error)
      throw error
    }
  }

  protected parseResult(result: OpenaiResponse): IBaseCreateResponse {
    return {
      content: result.output_text || '',
      usage: result.usage || {},
      tool_calls: [] as unknown as Array<IToolCallResult>,
    }
  }
}

export const openaiModel = (config: IOpenAIModelConfig = {}): OpenAIModel => new OpenAIModel(config)
