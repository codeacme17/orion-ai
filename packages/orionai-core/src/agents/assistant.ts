import { assistantMessage, SystemMessage, toolMessage, type TMessage } from '@/messages'
import { BaseAgent, type BaseAgentFields } from './base'
import { DEV_LOGGER } from '@/lib/logger'
import type { TModel } from '@/models'

export interface IAssistantAgentFields extends BaseAgentFields {
  systemMessage: string
}

export class AssistantAgent extends BaseAgent {
  /**
   * The system message that the assistant will respond with.
   * This message is updated as the conversation progresses.
   */
  systemMessage: string

  /**
   * The model that the assistant will use to generate responses.
   */
  model: TModel

  debug: boolean

  constructor(fields: IAssistantAgentFields) {
    const { systemMessage, model, debug } = fields

    super(fields)

    this.name = 'ASSISTANT_AGENT'
    this.systemMessage = systemMessage
    this.model = model
    this.debug = debug || false
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
      if (result.tool_calls) {
        const toolCalls = result.tool_calls
        const toolResults = []
        const resultMessage = assistantMessage({ ...result })

        // Run each tool call
        for (const tool of toolCalls) {
          DEV_LOGGER.INFO(`AssistantAgent.invoke: Running tool`, tool)

          const toolName = tool.function.name
          const toolArgs = JSON.parse(tool.function.arguments)
          const toolFn = this.tools?.find((t) => t.name === toolName)

          // If the tool is found, run it
          if (toolFn) {
            const toolResult = await toolFn.run(toolArgs)
            // Add the tool result to the toolResults array
            toolResults.push(
              toolMessage({
                content: toolResult,
                tool_call_id: tool.id,
              }),
            )
          }
        }

        // Combine the messages and tool results
        const newMessages = [...combinedMessages, resultMessage, ...toolResults] as Array<TMessage>

        const finalResult = await this.model.create({
          messages: newMessages,
        })

        return finalResult.content
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
