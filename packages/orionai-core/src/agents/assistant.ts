import { assistantMessage, SystemMessage, toolMessage, type TMessage } from '@/messages'
import { BaseAgent, type BaseAgentFields } from './base'
import { DEV_LOGGER } from '@/lib/logger'
import { DeepSeekModel, OpenAIModel, openaiModel, type BaseModel, type TModel } from '@/models'
import type { IToolCallChatCompletionResult, ITollCallResponsesApiResult } from '@/models/base'

export interface IAssistantAgentFields extends BaseAgentFields {
  systemMessage: string
}

export class AssistantAgent extends BaseAgent {
  /**
   * The system message that the assistant will respond with.
   * This message is updated as the conversation progresses.
   */
  public systemMessage: string

  /**
   * The model that the assistant will use to generate responses.
   */
  readonly model: TModel

  private debug: boolean

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

      this.debug && DEV_LOGGER.INFO('AssistantAgent.invoke: messages \n', combinedMessages)

      const result = await (this.model as BaseModel).create({
        messages: combinedMessages,
        tools: this.tools,
        debug: this.debug,
      })

      const toolAssistantMessage = assistantMessage({
        content: result.content,
        tool_calls: result.tool_calls,
      })

      // If the result is an assistant message and there are tool calls, run the tools
      if (result.tool_calls && result.tool_calls.length > 0) {
        const toolCalls = result.tool_calls
        const toolResults = []

        // Run each tool call
        for (const tool of toolCalls) {
          this.debug && DEV_LOGGER.INFO(`AssistantAgent.invoke: Running tool \n`, tool)

          const toolName =
            this.model.apiType === 'chat_completion'
              ? (tool as IToolCallChatCompletionResult).function.name
              : (tool as ITollCallResponsesApiResult).name
          const toolArgs = JSON.parse(
            this.model.apiType === 'chat_completion'
              ? (tool as IToolCallChatCompletionResult).function.arguments
              : (tool as ITollCallResponsesApiResult).arguments,
          )
          const toolFn = this.tools?.find((t) => t.name === toolName)

          // If the tool is found, run it
          if (toolFn) {
            const toolResult = await toolFn.run(toolArgs)

            // Add the tool result to the toolResults array
            toolResults.push(
              toolMessage({
                output: toolResult,
                call_id: 'call_id' in tool ? tool.call_id : tool.id,
                apiType: this.model.apiType,
              }).get(),
            )
          }
        }

        // Combine the messages and tool results
        const newMessages = [
          ...combinedMessages,
          ...(this.model instanceof OpenAIModel ? result.tool_calls : [toolAssistantMessage]),
          ...toolResults,
        ] as Array<TMessage>

        const finalResult = await (this.model as BaseModel).create({
          messages: newMessages,
        })

        this.debug && DEV_LOGGER.INFO('AssistantAgent.invoke: final response \n', finalResult)

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
