import type { OpenAIModel, TModel } from '@/models'
import { BaseAgent, type BaseAgentInterface } from './base'

export interface AssistantAgentInterface extends BaseAgentInterface {
  systemMessage: string
  description?: string
  model: TModel
  updateSystemMessage?(message: string): void
}

export interface IAssistantAgentFields extends AssistantAgentInterface {}

export class AssistantAgent extends BaseAgent implements AssistantAgentInterface {
  systemMessage
  model: TModel

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
