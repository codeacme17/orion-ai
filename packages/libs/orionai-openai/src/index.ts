import { createOpenAI } from '@ai-sdk/openai'
import type { LanguageModel } from 'ai'

export interface IOpenAIConfig {
  /**
   * OpenAI API key
   */
  apiKey?: string

  /**
   * Model ID (e.g., 'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo')
   */
  model?: string

  /**
   * Base URL for custom endpoints
   */
  baseURL?: string

  /**
   * Organization ID
   */
  organization?: string

  /**
   * Project ID
   */
  project?: string

  /**
   * Additional configuration options
   */
  [key: string]: any
}

/**
 * Create an OpenAI language model
 * @param config OpenAI configuration
 * @returns Language model instance
 */
export function createOpenAIModel(config: IOpenAIConfig = {}): LanguageModel {
  const { model = 'gpt-4o-mini', apiKey, baseURL, organization, project, ...rest } = config

  const openai = createOpenAI({
    apiKey: apiKey || process.env.OPENAI_API_KEY,
    baseURL,
    organization,
    project,
    ...rest,
  })

  return openai(model)
}

/**
 * Alias for createOpenAIModel
 */
export const openaiModel = createOpenAIModel

export default createOpenAIModel
