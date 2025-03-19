import { SystemMessage, type TMessage } from '@/messages'
import { BaseAgent, type BaseAgentInterface } from './base'
import type { TModel } from '@/models'
import { DEV_LOGGER } from '@/lib/logger'
import type { FunctionTool } from '@/tools/function'

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
      const conbinedMessages = [
        new SystemMessage(this.systemMessage),
        ...messages,
      ] as Array<TMessage>

      const result = await this.model.create({
        messages: conbinedMessages,
        tools: this.tools,
      })

      return typeof result === 'string' ? result : JSON.stringify(result)
    } catch (error) {
      DEV_LOGGER.ERROR(`AssistantAgent.invoke: ${error}`)
      throw new Error(`AssistantAgent.invoke: ${error}`)
    }
  }

  updateSystemMessage(message: string): void {
    this.systemMessage = message
  }
}
