import type { LanguageModel } from 'ai'

// Export base types
export * from './base'

// Export model factory
export * from './factory'

// Export adapters
export * from './adapters'

/**
 * TModel now represents an AI SDK LanguageModel instance
 */
export type TModel = LanguageModel

/**
 * Re-export for convenience
 */
export type { LanguageModel }
