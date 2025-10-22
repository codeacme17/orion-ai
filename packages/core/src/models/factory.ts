import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { readEnv } from '@/lib/utils'
import { DEV_LOGGER } from '@/lib/logger'
import type { LanguageModel } from 'ai'

export type TModelProvider = 'openai' | 'anthropic' | 'deepseek'

export interface IModelConfig {
  /**
   * The provider to use (openai, anthropic, deepseek)
   */
  provider: TModelProvider

  /**
   * The model ID to use (e.g., 'gpt-4o', 'claude-3-5-sonnet-20240620')
   */
  model?: string

  /**
   * API key for the provider
   */
  apiKey?: string

  /**
   * Base URL (mainly for DeepSeek or custom endpoints)
   */
  baseURL?: string

  /**
   * Debug mode
   */
  debug?: boolean

  /**
   * Additional provider-specific options
   */
  [key: string]: any
}

/**
 * Create a language model instance using AI SDK
 * @param config Configuration for the model
 * @returns A language model compatible with AI SDK
 */
export function createModel(config: IModelConfig): LanguageModel {
  const { provider, model, apiKey, baseURL, debug, ...rest } = config

  if (debug) {
    DEV_LOGGER.INFO('Creating model:', { provider, model })
  }

  switch (provider) {
    case 'openai': {
      const key = apiKey || readEnv('OPENAI_API_KEY')
      if (!key) {
        throw new Error('[orion-ai] OpenAI API key is required')
      }

      const openai = createOpenAI({
        apiKey: key,
        baseURL,
        ...rest,
      })

      return openai(model || 'gpt-4o-mini')
    }

    case 'anthropic': {
      const key = apiKey || readEnv('ANTHROPIC_API_KEY')
      if (!key) {
        throw new Error('[orion-ai] Anthropic API key is required')
      }

      const anthropic = createAnthropic({
        apiKey: key,
        baseURL,
        ...rest,
      })

      return anthropic(model || 'claude-3-5-sonnet-20240620')
    }

    case 'deepseek': {
      const key = apiKey || readEnv('DEEPSEEK_API_KEY')
      if (!key) {
        throw new Error('[orion-ai] DeepSeek API key is required')
      }

      // DeepSeek uses OpenAI-compatible API
      const deepseek = createOpenAI({
        apiKey: key,
        baseURL: baseURL || 'https://api.deepseek.com/v1',
        ...rest,
      })

      return deepseek(model || 'deepseek-chat')
    }

    default:
      throw new Error(`[orion-ai] Unsupported provider: ${provider}`)
  }
}

/**
 * Helper to create an OpenAI model
 */
export function openaiModel(config: Omit<IModelConfig, 'provider'> = {}) {
  return createModel({ ...config, provider: 'openai' })
}

/**
 * Helper to create an Anthropic model
 */
export function anthropicModel(config: Omit<IModelConfig, 'provider'> = {}) {
  return createModel({ ...config, provider: 'anthropic' })
}

/**
 * Helper to create a DeepSeek model
 */
export function deepseekModel(config: Omit<IModelConfig, 'provider'> = {}) {
  return createModel({ ...config, provider: 'deepseek' })
}
