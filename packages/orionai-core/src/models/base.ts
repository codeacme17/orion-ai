import type { Stream } from 'openai/streaming.mjs'

export type TSupportModelFamily = 'openai' | 'deepseek' | 'anthropic'

export interface IBaseModelConfig {
  apiKey?: string
  model?: string
  debug?: boolean
  [key: string]: any
}

export interface IBaseCreateParams {
  stream?: boolean | null
}

export interface IToolCallResult {
  id: string
  index: number
  type: 'function' | 'tool'
  function: {
    name: string
    arguments: string
  }
}

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

export interface IStreamResponse extends AsyncIterable<any> {
  [Symbol.asyncIterator](): AsyncIterator<any>
}

export abstract class BaseModel {
  /**
   * The configuration for the model.
   */
  protected config: IBaseModelConfig

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
  public abstract create(params: IBaseCreateParams): Promise<IBaseCreateResponse | IStreamResponse>

  /**
   * Abstract method to be implemented by subclasses to provide a stream.
   * @param params The input to the model.
   * @returns A stream of responses that can be used with for await...of syntax.
   */
  protected abstract createStream(params: IBaseCreateParams): Promise<Stream<any>>

  /**
   * Abstract method to be implemented by subclasses to parse the result.
   * @param result The result from the model.
   * @returns The parsed response.
   */
  protected abstract parseResult(result: Record<string, any>): IBaseCreateResponse
}
