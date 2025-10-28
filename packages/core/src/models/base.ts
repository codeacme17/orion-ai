import type { TMessage } from '@/messages'
import type { TTool } from '@/tools'

/**
 * Base model configuration
 */
export interface IBaseModelConfig {
  apiKey?: string
  model?: string
  debug?: boolean
  [key: string]: any
}

/**
 * Parameters for generating model responses
 */
export interface IGenerateParams {
  /**
   * The messages to send to the model
   */
  messages: Array<TMessage>

  /**
   * The tools available to the model
   */
  tools?: Array<TTool>

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
export interface IGenerateResponse {
  /**
   * The reason the generation finished
   */
  finishReason?: string

  /**
   * The generated text content
   */
  text: string

  /**
   * Tool calls made by the model
   */
  toolCalls: Array<IToolCallResult>

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
 * Chunk types for streaming
 */
export enum EStreamChunkType {
  TEXT_DELTA = 'text-delta',
  TEXT_DONE = 'text-done',
  TOOL_CALL_DELTA = 'tool-call-delta',
  TOOL_CALL = 'tool-call',
  TOOL_RESULT = 'tool-result',
  FINISH = 'finish',
}

/**
 * Stream chunk
 */
export interface IStreamChunk {
  type: EStreamChunkType
  text?: string
  toolCallId?: string
  toolName?: string
  toolArgs?: string
  toolResult?: any
  finishReason?: string
}

/**
 * Core model interface that all provider models must implement
 */
export interface IModel {
  /**
   * Generate a complete response from the model
   */
  generate(params: IGenerateParams): Promise<IGenerateResponse>

  /**
   * Stream a response from the model
   */
  stream(params: IGenerateParams): AsyncGenerator<IStreamChunk, void, unknown>
}

/**
 * Legacy type aliases for backwards compatibility
 */
export type TSupportModelFamily = 'openai' | 'deepseek' | 'anthropic'

export type TModel = IModel

// Old interfaces kept for backwards compatibility
export interface IBaseCreateParams extends IGenerateParams {
  stream?: boolean | null
  debug?: boolean
  model?: any
}

export interface IBaseCreateResponse {
  finish_reason?: string
  content: string
  tool_calls: Array<IToolCallResult>
  usage?: {
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
  }
  thought?: string
}

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
