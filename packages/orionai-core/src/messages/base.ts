import { nanoid } from 'nanoid'

export type TMessageType =
  | 'user'
  | 'assistant'
  | 'generic'
  | 'developer'
  | 'system'
  | 'function'
  | 'tool'
  | 'remove'
  | 'unknown'

export type TMessageContent = string | Record<string, any> | Array<Record<string, any>>

export interface BaseMessageInterface {
  /**
   * The content of the message. This can be a string or an array of objects.
   */
  readonly content: TMessageContent

  /**
   * An optional unique identifier for the message. This should ideally be
   * provided by the provider/model which created the message.
   */
  readonly id?: string
}

export interface IBaseMessageFields extends BaseMessageInterface {}

export abstract class BaseMessage implements BaseMessageInterface {
  content: TMessageContent
  readonly id?: string

  constructor(fields: IBaseMessageFields | string) {
    // If the input is not provided, throw an error
    if (!fields || (typeof fields !== 'string' && fields.content === undefined)) {
      throw new Error('[orion-ai] Message content is required.')
    }

    // If the input is a string, set the content of the message
    if (typeof fields === 'string') {
      this.content = fields
    } else {
      this.content = fields.content
    }
  }
}
