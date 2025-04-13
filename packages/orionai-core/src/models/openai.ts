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
  ResponseFunctionToolCall,
} from 'openai/resources/responses/responses.mjs'
import type { RequestOptions } from 'openai/core.mjs'
import type {
  IBaseCreateParams,
  IBaseCreateResponse,
  IBaseModelConfig,
  ITollCallResponsesApiResult,
  IToolCallResult,
} from './base'
import type { Stream } from 'openai/streaming.mjs'

export type OpenaiChatModel = ChatModel

export interface IOpenAIModelConfig extends ClientOptions, IBaseModelConfig {
  model?: OpenaiChatModel
}

export interface IOpenaiCreateParams
  extends Omit<ResponseCreateParamsNonStreaming, 'model' | 'tools' | 'input' | 'stream'>,
    IBaseCreateParams {
  model?: OpenaiChatModel
}

export interface IOpenaiCreateParamsWithStream extends IOpenaiCreateParams {
  stream: true
}

export interface IOpenaiCreateResponse extends IBaseCreateResponse {
  tool_calls: ITollCallResponsesApiResult[]
}

export interface IOpenaiCreateParamsWithoutStream extends IOpenaiCreateParams {
  stream?: false | null
}

export type TOpenaiCreateParams = IOpenaiCreateParamsWithStream | IOpenaiCreateParamsWithoutStream

const DEFAULT_MODEL: OpenaiChatModel = 'gpt-4o-mini'

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
  ): Promise<IOpenaiCreateResponse>
  public async create(
    body: TOpenaiCreateParams,
    options?: RequestOptions,
  ): Promise<IOpenaiCreateResponse | Stream<ResponseStreamEvent>> {
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

  protected parseResult(result: OpenaiResponse): IOpenaiCreateResponse {
    const response: IOpenaiCreateResponse = {
      content: result.output_text || '',
      usage: result.usage || {},
      tool_calls: (result.output as Array<ITollCallResponsesApiResult>) || [],
    }

    this.debug && DEV_LOGGER.INFO('OpenaiModel.create \n', { ...response })

    return response
  }
}
export const openaiModel = (config: IOpenAIModelConfig = {}): OpenAIModel => new OpenAIModel(config)
