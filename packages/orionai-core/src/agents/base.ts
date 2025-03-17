import type { IBaseModelConfig, IDeepSeekModelConfig, IOpenAIModelConfig } from '@/models'

export interface BaseAgentInterface {
  name: string
  description: string
  modelConfig?: Record<string, any> & IBaseModelConfig & IOpenAIModelConfig & IDeepSeekModelConfig

  /**
   * Send a message to another agent
   * @param message The message to send. If an object, it should be JSON-serializable and follow OpenAI's ChatCompletion schema
   * @param recipient The recipient of the message
   * @param requestReply Whether to request a reply from the recipient
   */
  send(
    message: Record<string, any> | string,
    recipient: BaseAgentInterface,
    requestReply?: boolean,
  ): void

  /**
   * (Async) Send a message to another agent
   * @param message The message to send. If an object, it should be JSON-serializable and follow OpenAI's ChatCompletion schema
   * @param recipient The recipient of the message
   * @param requestReply Whether to request a reply from the recipient
   */
  aSend(
    message: Record<string, any> | string,
    recipient: BaseAgentInterface,
    requestReply?: boolean,
  ): Promise<void>

  /**
   * Receive a message from another agent
   * @param message The received message. If an object, it should be JSON-serializable and follow OpenAI's ChatCompletion schema
   * @param sender The sender of the message
   * @param requestReply Whether the sender requests a reply
   */
  receive(
    message: Record<string, any> | string,
    sender: BaseAgentInterface,
    requestReply?: boolean,
  ): void

  /**
   * (Async) Receive a message from another agent
   * @param message The received message. If an object, it should be JSON-serializable and follow OpenAI's ChatCompletion schema
   * @param sender The sender of the message
   * @param requestReply Whether the sender requests a reply
   */
  aReceive(
    message: Record<string, any> | string,
    sender: BaseAgentInterface,
    requestReply?: boolean,
  ): Promise<void>

  /**
   * Generate a reply based on the received messages
   * @param messages A list of messages received from other agents. These messages are objects that are JSON-serializable and follow OpenAI's ChatCompletion schema
   * @param sender Sender of an Agent instance
   * @param kwargs Additional parameters
   * @returns The generated reply. If null, no reply is generated
   */
  generateReply(
    messages?: Record<string, any>[],
    sender?: BaseAgentInterface,
    kwargs?: Record<string, any>,
  ): string | Record<string, any> | null

  /**
   * (Async) Generate a reply based on the received messages
   * @param messages A list of messages received from other agents. These messages are objects that are JSON-serializable and follow OpenAI's ChatCompletion schema
   * @param sender Sender of an Agent instance
   * @param kwargs Additional parameters
   * @returns The generated reply. If null, no reply is generated
   */
  aGenerateReply(
    messages?: Record<string, any>[],
    sender?: BaseAgentInterface,
    kwargs?: Record<string, any>,
  ): Promise<string | Record<string, any> | null>
}

export interface BaseAgentFields {
  name: string
  description: string
  modelConfig?: Record<string, any> & IBaseModelConfig & IOpenAIModelConfig & IDeepSeekModelConfig
}

export abstract class BaseAgent implements BaseAgentInterface {
  name
  description
  modelConfig

  constructor(fields: BaseAgentFields) {
    const { name, description, modelConfig } = fields

    if (!name) {
      throw new Error('[orion ai] name is required')
    }

    if (!description) {
      throw new Error('[orion ai] description is required')
    }

    this.name = fields.name
    this.description = fields.description
    this.modelConfig = fields.modelConfig = {}
  }

  send(
    message: Record<string, any> | string,
    recipient: BaseAgentInterface,
    requestReply?: boolean,
  ): void {
    console.log(`Sending message to ${recipient.name}: ${message}`)
  }

  aSend(
    message: Record<string, any> | string,
    recipient: BaseAgentInterface,
    requestReply?: boolean,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`Sending message to ${recipient.name}: ${message}`)
      resolve()
    })
  }

  receive(
    message: Record<string, any> | string,
    sender: BaseAgentInterface,
    requestReply?: boolean,
  ): void {
    console.log(`Receiving message from ${sender.name}: ${message}`)
  }

  aReceive(
    message: Record<string, any> | string,
    sender: BaseAgentInterface,
    requestReply?: boolean,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`Receiving message from ${sender.name}: ${message}`)
      resolve()
    })
  }

  generateReply(
    messages?: Record<string, any>[],
    sender?: BaseAgentInterface,
    agrs?: Record<string, any>,
  ): string | Record<string, any> | null {
    console.log(`Generating reply based on messages: ${messages}`)
    return 'Reply'
  }

  aGenerateReply(
    messages?: Record<string, any>[],
    sender?: BaseAgentInterface,
    agrs?: Record<string, any>,
  ): Promise<string | Record<string, any> | null> {
    return new Promise((resolve, reject) => {
      console.log(`Generating reply based on messages: ${messages}`)
      resolve('Reply')
    })
  }
}
