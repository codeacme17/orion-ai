import { BaseAgent, type BaseAgentInterface } from './base'

export interface LLMAgentInterface extends BaseAgentInterface {
  systemMessage: string
  updateSystemMessage(message: string): void
}

export class LLMAgent extends BaseAgent implements LLMAgentInterface {
  systemMessage: string

  constructor() {
    super()
    this.name = 'LLMAgent'
    this.systemMessage = 'LLMAgent'
  }

  updateSystemMessage(message: string): void {
    this.systemMessage = message
  }
}
