import type { TMessage } from '@/messages'
import type { TTool } from '@/tools'
import type { Stream } from 'openai/streaming.mjs'

export type TSupportModelFamily = 'openai' | 'deepseek' | 'anthropic'

export interface IBaseModelConfig {
  apiKey?: string
  model?: string
  debug?: boolean
  [key: string]: any
}

export interface IBaseCreateParams {
  /**
   * The messages to send to the model
   */
  messages: Array<TMessage>

  /**
   * The model to use
   */
  model?: string

  /**
   * The tools to use in the model
   */
  tools?: Array<TTool>

  /**
   * Whether to stream the response
   */
  stream?: boolean | null

  /**
   * Whether to debug the model
   */
  debug?: boolean
}

export interface ITollCallResponsesApiResult {
  id: string
  call_id: string
  type: 'function_call'
  name: string
  arguments: string
}

export interface IToolCallChatCompletionResult {
  id: string
  index?: number
  type: 'function' | 'tool'
  function: {
    name: string
    arguments: string
  }
}

export type IToolCallResult = ITollCallResponsesApiResult | IToolCallChatCompletionResult

export interface IBaseCreateResponse {
  /**
   * the reason for the completion
   */
  finish_reason?: string

  /**
   * the content of the response
   */
  content: string

  /**
   * the tool calls in the response
   */
  tool_calls: Array<IToolCallResult>

  /**
   * the usage of the response
   */
  usage?: Record<string, any>

  /**
   * the thought of the response
   */
  thought?: string
}

export abstract class BaseModel {
  /**
   * The configuration for the model.
   */
  protected config: IBaseModelConfig

  /**
   * The response type format for the model's API
   */
  abstract readonly apiType: 'chat_completion' | 'response'

  constructor(config: IBaseModelConfig = {}) {
    this.config = config
  }

  /**
   * Abstract method to be implemented by subclasses to initialize the model.
   * @param config The configuration for the model.
   */
  protected abstract init(config: IBaseModelConfig): void

  /**
   * Abstract method to be implemented by subclasses to generate a response.
   * @param IBaseCompleteParams The input to the model.
   * @returns The generated response or a stream of responses.
   */
  public abstract create(params: IBaseCreateParams): Promise<IBaseCreateResponse>

  /**
   * Abstract method to be implemented by subclasses to provide a stream.
   * @param params The input to the model.
   * @returns A stream of responses that can be used with for await...of syntax.
   */
  abstract createStream(params: IBaseCreateParams): Promise<Stream<any>>

  /**
   * Abstract method to be implemented by subclasses to parse the result.
   * @param result The result from the model.
   * @returns The parsed response.
   */
  protected abstract parseResult(result: Record<string, any>): IBaseCreateResponse
}
