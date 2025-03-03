export type TSupportModelFamily = 'openai' | 'deepseek' | 'anthropic'

export interface IBaseModelConfig {
  apiKey?: string
  model?: string
  [key: string]: any
}

export interface IBaseCompleteParams {}

export abstract class BaseModel {
  /**
   * The configuration for the model.
   */
  protected config: IBaseModelConfig

  constructor(config: IBaseModelConfig = {}) {
    this.config = config
  }

  /**
   * Abstract method to be implemented by subclasses to generate a response.
   * @param IBaseCompleteParams The input to the model.
   * @returns The generated response.
   */
  abstract create(params: IBaseCompleteParams): Promise<string | Record<string, any>>
}
