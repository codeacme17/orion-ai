import { createOpenAI } from '@ai-sdk/openai'
import type { LanguageModel } from 'ai'

export interface IDeepSeekConfig {
  /**
   * DeepSeek API key
   */
  apiKey?: string

  /**
   * Model ID (e.g., 'deepseek-chat', 'deepseek-reasoner')
   */
  model?: string

  /**
   * Base URL (defaults to DeepSeek API)
   */
  baseURL?: string

  /**
   * Additional configuration options
   */
  [key: string]: any
}

/**
 * Create a DeepSeek language model
 * DeepSeek uses OpenAI-compatible API
 * @param config DeepSeek configuration
 * @returns Language model instance
 */
export function createDeepSeekModel(config: IDeepSeekConfig = {}): LanguageModel {
  const {
    model = 'deepseek-chat',
    apiKey,
    baseURL = 'https://api.deepseek.com/v1',
    ...rest
  } = config

  // DeepSeek uses OpenAI-compatible API
  const deepseek = createOpenAI({
    apiKey: apiKey || process.env.DEEPSEEK_API_KEY,
    baseURL,
    ...rest,
  })

  return deepseek(model)
}

/**
 * Alias for createDeepSeekModel
 */
export const deepseekModel = createDeepSeekModel

export default createDeepSeekModel
