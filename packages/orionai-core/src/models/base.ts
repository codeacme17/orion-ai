export type TSupportModelFamily = 'openai' | 'deepseek' | 'anthropic'

export interface IBaseModelConfig {
  apiKey?: string
  model?: string
  debug?: boolean
  [key: string]: any
}

export interface IBaseCompleteParams {
  stream?: boolean
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
  finish_reason?: string

  content: string

  tool_calls: Array<IToolCallResult>

  usage?: Record<string, any>

  thought?: string
}

/**
 * 基础流式事件接口
 * 流可以同时支持事件和异步迭代
 */
export interface BaseStreamEvent<T> extends AsyncIterable<T> {
  on(event: 'data', listener: (chunk: T) => void): this
  on(event: 'end', listener: () => void): this
  on(event: 'error', listener: (err: Error) => void): this
}

// extend Stream type to include event handling methods
export type BaseStreamWithEvents<T> = BaseStreamEvent<T>

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
   * @returns The generated response.
   */
  public abstract create(params: IBaseCompleteParams): Promise<IBaseCreateResponse>

  /**
   * Abstract method to be implemented by subclasses to provide a stream.
   * @param params The input to the model.
   * @returns A stream of responses that can be used with for await...of syntax.
   */
  public abstract createStream(params: IBaseCompleteParams): Promise<AsyncIterable<any>>

  /**
   * Abstract method to be implemented by subclasses to parse the result.
   * @param result The result from the model.
   * @returns The parsed response.
   */
  protected abstract parseResult(result: Record<string, any>): IBaseCreateResponse
}
