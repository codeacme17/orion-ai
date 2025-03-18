import type { BaseModel, IBaseModelConfig } from './base'
import type { DeepSeekModel, IDeepSeekModelConfig } from './deepseek'
import type { IOpenAIModelConfig, OpenAIModel } from './openai'

export * from './base'
export * from './openai'
export * from './deepseek'

export type TModel = OpenAIModel | DeepSeekModel
export type TModelConfig = IBaseModelConfig | IOpenAIModelConfig | IDeepSeekModelConfig
