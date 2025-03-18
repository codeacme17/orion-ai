import { BaseAgent, type BaseAgentInterface } from './base'
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
  description?: string
  model: TModel
  updateSystemMessage?(message: string): void
}

export interface IAssistantAgentFields extends AssistantAgentInterface {}

export class AssistantAgent extends BaseAgent implements AssistantAgentInterface {
  systemMessage
  model

  constructor(fields: IAssistantAgentFields) {
    const { systemMessage, model } = fields

    super(fields)

    this.name = 'ASSISTANT_AGENT'
    this.systemMessage = systemMessage
    this.model = model
  }

  updateSystemMessage(message: string): void {
    this.systemMessage = message
  }
}
