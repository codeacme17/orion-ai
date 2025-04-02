export type TSupportModelFamily = 'openai' | 'deepseek' | 'anthropic'

export interface IBaseModelConfig {
  apiKey?: string
  model?: string
  debug?: boolean
  [key: string]: any
}

export interface IBaseCompleteParams {}

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

  usage: Record<string, any>

  tool_calls: Array<IToolCallResult>

  thought?: string
}

export abstract class BaseModel {
  /**
   * The configuration for the model.
   */
  config: IBaseModelConfig

  constructor(config: IBaseModelConfig = {}) {
    this.config = config
  }

  /**
   * Abstract method to be implemented by subclasses to generate a response.
   * @param IBaseCompleteParams The input to the model.
   * @returns The generated response.
   */
  public abstract create(params: IBaseCompleteParams): Promise<IBaseCreateResponse>

  /**
   * Abstract method to be implemented by subclasses to parse the result.
   * @param result The result from the model.
   * @returns The parsed response.
   */
  protected abstract parseResult(result: Record<string, any>): IBaseCreateResponse
}
