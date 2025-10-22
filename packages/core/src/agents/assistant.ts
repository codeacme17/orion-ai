import { generateText, streamText } from 'ai'
import { SystemMessage, type TMessage } from '@/messages'
import { BaseAgent, type BaseAgentFields } from './base'
import { DEV_LOGGER } from '@/lib/logger'
import type { TModel } from '@/models'
import { convertMessagesToAISDK, convertToolsToAISDK } from '@/models/adapters'

enum EChunkType {
  INVOKE_TEXT_CONTENT = 'invoke.text.content',
  INVOKE_TEXT_DONE = 'invoke.text.done',
  INVOKE_TOOL_CALL = 'invoke.tool.call',
  INVOKE_TOOL_RESULT = 'invoke.tool.result',
}

interface IChunk {
  type: EChunkType
  content?: string | null
  toolName?: string
  toolCallId?: string
  toolResult?: any
}

export interface IAssistantAgentFields extends BaseAgentFields {
  /**
   * The system message that the assistant will respond with.
   */
  systemMessage: string

  /**
   * The behavior of the assistant when using tools.
   * - 'default': Execute tools and continue to get final response
   * - 'stop_on_tool': Stop after executing tools and return results
   */
  toolUseBehavior?: 'default' | 'stop_on_tool'

  /**
   * Maximum number of automatic tool execution rounds
   * @default 5
   */
  maxToolRounds?: number
}

export class AssistantAgent extends BaseAgent {
  /**
   * The system message that the assistant will respond with.
   */
  public systemMessage: string

  /**
   * The model that the assistant will use to generate responses.
   */
  readonly model: TModel

  /**
   * The behavior of the assistant when using tools.
   */
  toolUseBehavior: 'default' | 'stop_on_tool'

  /**
   * Maximum number of automatic tool execution rounds
   */
  maxToolRounds: number

  private debug: boolean

  constructor(fields: IAssistantAgentFields) {
    const { systemMessage, model, debug, stream, toolUseBehavior, maxToolRounds } = fields

    super(fields)

    this.name = this.name ?? 'ASSISTANT_AGENT'
    this.systemMessage = systemMessage
    this.model = model
    this.debug = debug ?? false
    this.stream = stream ?? false
    this.toolUseBehavior = toolUseBehavior ?? 'default'
    this.maxToolRounds = maxToolRounds ?? 5
  }

  /**
   * Invoke the assistant with a set of messages
   * @param messages The conversation messages
   * @returns The assistant's response text or tool results
   */
  async invoke(messages: Array<TMessage>): Promise<string> {
    try {
      // Add system message
      const combinedMessages = [new SystemMessage(this.systemMessage), ...messages]

      this.debug && DEV_LOGGER.INFO('AssistantAgent.invoke: messages \n', combinedMessages)

      // Convert to AI SDK format
      const aiMessages = convertMessagesToAISDK(combinedMessages)
      const aiTools = this.tools ? convertToolsToAISDK(this.tools) : undefined

      // Use AI SDK's generateText with automatic tool execution
      const result = await generateText({
        model: this.model,
        messages: aiMessages,
        tools: aiTools,
        // AI SDK handles tool execution automatically
      })

      this.debug && DEV_LOGGER.INFO('AssistantAgent.invoke: response \n', result)

      return result.text
    } catch (error) {
      DEV_LOGGER.ERROR(`AssistantAgent.invoke: ${error}`)
      throw error
    }
  }

  /**
   * Invoke the assistant with streaming response
   * @param messages The conversation messages
   * @returns An async generator that yields response chunks
   */
  async *invokeStream(messages: Array<TMessage>): AsyncGenerator<IChunk, void, unknown> {
    try {
      // Add system message
      const combinedMessages = [new SystemMessage(this.systemMessage), ...messages]

      this.debug && DEV_LOGGER.INFO('AssistantAgent.invokeStream: messages \n', combinedMessages)

      // Convert to AI SDK format
      const aiMessages = convertMessagesToAISDK(combinedMessages)
      const aiTools = this.tools ? convertToolsToAISDK(this.tools) : undefined

      // Use AI SDK's streamText with automatic tool execution
      const result = streamText({
        model: this.model,
        messages: aiMessages,
        tools: aiTools,
        // AI SDK handles tool execution automatically
      })

      // Stream text deltas
      for await (const chunk of result.textStream) {
        yield {
          type: EChunkType.INVOKE_TEXT_CONTENT,
          content: chunk,
        }
      }

      // Wait for final result to get tool calls
      const finalResult = await result

      // Final text done
      yield {
        type: EChunkType.INVOKE_TEXT_DONE,
        content: await finalResult.text,
      }
    } catch (error) {
      DEV_LOGGER.ERROR(`AssistantAgent.invokeStream: ${error}`)
      throw error
    }
  }

  /**
   * Update the system message
   * @param message New system message
   */
  updateSystemMessage(message: string): void {
    this.systemMessage = message
  }
}

export const assistantAgent = (fields: IAssistantAgentFields) => new AssistantAgent(fields)
