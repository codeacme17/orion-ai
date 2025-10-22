import { createAnthropic } from '@ai-sdk/anthropic'
import type { LanguageModel } from 'ai'

export interface IAnthropicConfig {
  /**
   * Anthropic API key
   */
  apiKey?: string

  /**
   * Model ID (e.g., 'claude-3-5-sonnet-20240620', 'claude-3-opus-20240229')
   */
  model?: string

  /**
   * Base URL for custom endpoints
   */
  baseURL?: string

  /**
   * Additional configuration options
   */
  [key: string]: any
}

/**
 * Create an Anthropic language model
 * @param config Anthropic configuration
 * @returns Language model instance
 */
export function createAnthropicModel(config: IAnthropicConfig = {}): LanguageModel {
  const { model = 'claude-3-5-sonnet-20240620', apiKey, baseURL, ...rest } = config

  const anthropic = createAnthropic({
    apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    baseURL,
    ...rest,
  })

  return anthropic(model)
}

/**
 * Alias for createAnthropicModel
 */
export const anthropicModel = createAnthropicModel

export default createAnthropicModel
