import type { z } from 'zod'

export type TSupportModelFamily = 'openai' | 'deepseek' | 'anthropic'

export interface IBaseModelConfig {
  apiKey?: string
  model?: string
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

export interface BaseModelInterface {
  config: IBaseModelConfig
  create(params: IBaseCompleteParams): Promise<string | Record<string, any>>
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

  protected abstract parseResult(result: Record<string, any>): IBaseCreateResponse
}
