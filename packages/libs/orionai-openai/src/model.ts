import { createOpenAI } from '@ai-sdk/openai'
import { generateText, streamText } from 'ai'
import type {
  IModel,
  IGenerateParams,
  IGenerateResponse,
  IStreamChunk,
  EStreamChunkType,
} from '@orion-ai/core'
import { convertMessagesToAISDK, convertToolsToAISDK } from './adapters'

export interface IOpenAIConfig {
  apiKey?: string
  model?: string
  baseURL?: string
  organization?: string
  project?: string
  [key: string]: any
}

export class OpenAIModel implements IModel {
  private languageModel: any

  constructor(config: IOpenAIConfig = {}) {
    const { model = 'gpt-4o-mini', apiKey, baseURL, organization, project, ...rest } = config

    const openai = createOpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
      baseURL,
      organization,
      project,
      ...rest,
    })

    this.languageModel = openai(model)
  }

  async generate(params: IGenerateParams): Promise<IGenerateResponse> {
    const { messages, tools, maxTokens, temperature, ...rest } = params

    const aiMessages = convertMessagesToAISDK(messages)
    const aiTools = tools ? convertToolsToAISDK(tools) : undefined

    const result = await generateText({
      model: this.languageModel,
      messages: aiMessages,
      tools: aiTools,
      ...rest,
    })

    return {
      text: result.text,
      finishReason: result.finishReason,
      toolCalls: result.toolCalls?.map((tc: any) => ({
        id: tc.toolCallId,
        type: 'function' as const,
        name: tc.toolName,
        arguments: JSON.stringify(tc.args),
      })) || [],
      usage: result.usage
        ? {
            promptTokens: result.usage.inputTokens,
            completionTokens: result.usage.outputTokens,
            totalTokens: result.usage.totalTokens,
          }
        : undefined,
    }
  }

  async *stream(params: IGenerateParams): AsyncGenerator<IStreamChunk, void, unknown> {
    const { messages, tools, maxTokens, temperature, ...rest } = params

    const aiMessages = convertMessagesToAISDK(messages)
    const aiTools = tools ? convertToolsToAISDK(tools) : undefined

    const result = streamText({
      model: this.languageModel,
      messages: aiMessages,
      tools: aiTools,
      ...rest,
    })

    for await (const chunk of result.textStream) {
      yield {
        type: 'text-delta' as EStreamChunkType,
        text: chunk,
      }
    }

    const finalResult = await result
    yield {
      type: 'text-done' as EStreamChunkType,
      text: await finalResult.text,
    }
  }
}

export function createOpenAIModel(config: IOpenAIConfig = {}): IModel {
  return new OpenAIModel(config)
}
