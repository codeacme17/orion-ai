import Openai, { type ClientOptions } from 'openai'
import { BaseModel } from './base'
import { readEnv } from '@/lib/utils'
import { DEV_LOGGER } from '@/lib/logger'

import type { ChatModel } from 'openai/resources/index.mjs'
import type {
  ResponseCreateParamsNonStreaming,
  Tool,
  Response as OpenaiResponse,
  ResponseInput,
  ResponseStreamEvent,
} from 'openai/resources/responses/responses.mjs'
import type { RequestOptions } from 'openai/core.mjs'
import type {
  IBaseCreateParams,
  IBaseCreateResponse,
  IBaseModelConfig,
  IToolCallResult,
} from './base'
import type { TMessage } from '@/messages'
import type { BaseTool } from '@/tools'
import type { Stream } from 'openai/streaming.mjs'

export interface IOpenAIModelConfig extends ClientOptions, IBaseModelConfig {
  model?: (string & {}) | ChatModel
}

export interface IOpenaiCreateParams
  extends Omit<
      ResponseCreateParamsNonStreaming,
      'messages' | 'model' | 'tools' | 'parallel_tool_calls' | 'input' | 'stream'
    >,
    IBaseCreateParams {
  messages: Array<TMessage>
  model?: (string & {}) | ChatModel
  tools?: Array<BaseTool>
  parallel_tool_calls?: boolean | undefined
  debug?: boolean
  stream?: boolean | null
}

export interface IOpenaiCreateParamsWithStream extends IOpenaiCreateParams {
  stream: true
}

export interface IOpenaiCreateParamsWithoutStream extends IOpenaiCreateParams {
  stream?: false | null
}

export type TOpenaiCreateParams = IOpenaiCreateParamsWithStream | IOpenaiCreateParamsWithoutStream

const DEFAULT_MODEL: ChatModel = 'gpt-4o-mini'

export class OpenAIModel extends BaseModel {
  private openai: Openai
  private debug: boolean

  constructor(config: IOpenAIModelConfig = {}) {
    super(config)

    const apiKey = config.apiKey || readEnv('OPENAI_API_KEY')

    if (!apiKey) {
      DEV_LOGGER.ERROR('OpenAI API key is required.')
      throw new Error('[orion-ai] OpenAI API key is required.')
    }

    this.openai = this.init(config)
    this.debug = config.debug || false
  }

  init(config: IOpenAIModelConfig): Openai {
    const { apiKey } = config

    if (!apiKey && !readEnv('OPENAI_API_KEY')) {
      throw new Error('OpenAI API key is required.')
    }

    this.debug && DEV_LOGGER.INFO('OpenaiModel.init \n', { ...config })

    return new Openai({
      ...config,
      apiKey: this.config.apiKey || readEnv('OPENAI_API_KEY'),
    })
  }

  public async create(
    body: IOpenaiCreateParamsWithStream,
    options?: RequestOptions,
  ): Promise<Stream<ResponseStreamEvent>>
  public async create(
    body: IOpenaiCreateParamsWithoutStream,
    options?: RequestOptions,
  ): Promise<IBaseCreateResponse>
  public async create(
    body: TOpenaiCreateParams,
    options?: RequestOptions,
  ): Promise<IBaseCreateResponse | Stream<ResponseStreamEvent>> {
    try {
      const { model, messages, tools, debug, stream, ...rest } = body

      this.debug = debug || false

      if (stream) {
        return this.createStream(body, options)
      }

      const response = await this.openai.responses.create(
        {
          ...rest,
          model: model || this.config.model || DEFAULT_MODEL,
          input: messages as unknown as string | ResponseInput,
          tools: tools?.map((tool) => tool.toResponseJson()) as Array<Tool>,
        },
        options,
      )

      return this.parseResult(response)
    } catch (error) {
      DEV_LOGGER.ERROR(error)
      throw error
    }
  }

  protected async createStream(
    body: IOpenaiCreateParams,
    options?: RequestOptions,
  ): Promise<Stream<ResponseStreamEvent>> {
    try {
      const { model, messages, tools, ...rest } = body

      const stream = await this.openai.responses.create(
        {
          ...rest,
          model: model || this.config.model || DEFAULT_MODEL,
          input: messages as unknown as string | ResponseInput,
          tools: tools?.map((tool) => tool.toResponseJson()) as Array<Tool>,
          stream: true,
        },
        options,
      )

      this.debug && DEV_LOGGER.INFO('OpenaiModel.createStream started')

      return stream
    } catch (error) {
      this.debug && DEV_LOGGER.ERROR('OpenaiModel.createStream error', error)
      throw error
    }
  }

  protected parseResult(result: OpenaiResponse): IBaseCreateResponse {
    const response: IBaseCreateResponse = {
      content: result.output_text || '',
      usage: result.usage || {},
      tool_calls: result.tools as unknown as Array<IToolCallResult>,
    }

    this.debug && DEV_LOGGER.INFO('OpenaiModel.create \n', { ...response })

    return response
  }
}

export const openaiModel = (config: IOpenAIModelConfig = {}): OpenAIModel => new OpenAIModel(config)
