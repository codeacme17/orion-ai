import { SystemMessage, toolMessage, type TMessage } from '@/messages'
import { BaseAgent, type BaseAgentInterface } from './base'
import { DEV_LOGGER } from '@/lib/logger'
import type { TModel } from '@/models'

export interface AssistantAgentInterface extends BaseAgentInterface {
  /**
   * The system message that the assistant will respond with.
   * This message is updated as the conversation progresses.
   */
  systemMessage: string

  /**
   * The model that the assistant will use to generate responses.
   */
  model: TModel

  description?: string
  updateSystemMessage?(message: string): void
}

export interface IAssistantAgentFields extends AssistantAgentInterface {}

export class AssistantAgent extends BaseAgent implements AssistantAgentInterface {
  model
  systemMessage

  constructor(fields: IAssistantAgentFields) {
    const { systemMessage, model } = fields

    super(fields)

    this.name = 'ASSISTANT_AGENT'
    this.systemMessage = systemMessage
    this.model = model
  }

  async invoke(messages: Array<TMessage>): Promise<string> {
    try {
      const combinedMessages = [
        new SystemMessage(this.systemMessage),
        ...messages,
      ] as Array<TMessage>

      const result = await this.model.create({
        messages: combinedMessages,
        tools: this.tools,
      })

      // If the result is an assistant message and there are tool calls, run the tools
      if (result.role === 'assistant' && result.tool_calls) {
        const toolCalls = result.tool_calls
        const toolResults = []

        // Run each tool call
        for (const tool of toolCalls) {
          const toolName = tool.function.name
          const toolArgs = JSON.parse(tool.function.arguments)

          const toolFn = this.tools?.find((t) => t.name === toolName)
          if (toolFn) {
            const toolResult = await toolFn.run(toolArgs)
            toolResults.push(
              toolMessage({ tool_call_id: tool.id, content: JSON.stringify(toolResult) }),
            )
          }
        }

        DEV_LOGGER.SUCCESS('AssistantAgent.invoke: toolResults', toolResults[0].content)
        // Combine the messages and tool results
        const newMessages = [...combinedMessages, result, ...toolResults] as Array<TMessage>
        DEV_LOGGER.INFO('AssistantAgent.invoke: newMessages', newMessages)
        const finalResult = await this.model.create({
          messages: newMessages,
        })

        return typeof finalResult === 'string' ? finalResult : finalResult.content
      }

      return typeof result === 'string' ? result : result.content
    } catch (error) {
      DEV_LOGGER.ERROR(`AssistantAgent.invoke: ${error}`)
      throw new Error(`AssistantAgent.invoke: ${error}`)
    }
  }

  updateSystemMessage(message: string): void {
    this.systemMessage = message
  }
}
