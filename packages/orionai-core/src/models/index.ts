import type { BaseModel, IBaseModelConfig } from './base'
import type { DeepseekModel, IDeepSeekModelConfig } from './deepseek'
import type { IOpenAIModelConfig, OpenAIModel } from './openai'

export * from './base'
export * from './openai'
export * from './deepseek'

export type TModel = BaseModel | OpenAIModel | DeepseekModel

export type TModelConfig = IBaseModelConfig | IOpenAIModelConfig | IDeepSeekModelConfig
