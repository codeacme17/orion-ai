import { BaseAgent, type BaseAgentFields, type BaseAgentInterface } from './base'

export interface AssistantAgentInterface extends BaseAgentInterface {
  systemMessage: string
  updateSystemMessage(message: string): void
}

export interface IAssistantAgentFields extends BaseAgentFields {
  systemMessage: string
}

export class AssistantAgent extends BaseAgent implements AssistantAgentInterface {
  systemMessage: string

  constructor(fields: IAssistantAgentFields) {
    const { systemMessage } = fields

    super(fields)

    this.name = 'ASSISTANT_AGENT'
    this.systemMessage = systemMessage
  }

  updateSystemMessage(message: string): void {
    this.systemMessage = message
  }
}
