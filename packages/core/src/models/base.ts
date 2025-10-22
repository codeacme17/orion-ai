import type { LanguageModel } from 'ai'
import type { TMessage } from '@/messages'
import type { TTool } from '@/tools'

/**
 * Base model configuration (kept for backwards compatibility)
 */
export interface IBaseModelConfig {
  apiKey?: string
  model?: string
  debug?: boolean
  [key: string]: any
}

/**
 * Parameters for creating a model response
 */
export interface IBaseCreateParams {
  /**
   * The messages to send to the model
   */
  messages: Array<TMessage>

  /**
   * The model to use (optional if set in config)
   */
  model?: LanguageModel

  /**
   * The tools available to the model
   */
  tools?: Array<TTool>

  /**
   * Whether to stream the response
   */
  stream?: boolean | null

  /**
   * Whether to enable debug mode
   */
  debug?: boolean

  /**
   * Maximum number of tokens to generate
   */
  maxTokens?: number

  /**
   * Temperature for sampling
   */
  temperature?: number

  /**
   * Additional provider-specific parameters
   */
  [key: string]: any
}

/**
 * Tool call result (unified format)
 */
export interface IToolCallResult {
  id: string
  type: 'function'
  name: string
  arguments: string
}

/**
 * Response from model generation
 */
export interface IBaseCreateResponse {
  /**
   * The reason the generation finished
   */
  finish_reason?: string

  /**
   * The generated text content
   */
  content: string

  /**
   * Tool calls made by the model
   */
  tool_calls: Array<IToolCallResult>

  /**
   * Usage statistics
   */
  usage?: {
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
  }

  /**
   * Reasoning/thinking content (for reasoning models)
   */
  thought?: string
}

/**
 * Legacy type aliases for backwards compatibility
 */
export type TSupportModelFamily = 'openai' | 'deepseek' | 'anthropic'

export interface ITollCallResponsesApiResult extends IToolCallResult {
  call_id: string
}

export interface IToolCallChatCompletionResult extends IToolCallResult {
  index?: number
  function: {
    name: string
    arguments: string
  }
}
