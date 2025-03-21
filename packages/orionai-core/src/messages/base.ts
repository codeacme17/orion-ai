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

export type TImageDetail = 'auto' | 'low' | 'high'

export type TMessageContentText = {
  type: 'text'
  text: string
}

export type TMessageContentImageUrl = {
  type: 'image_url'
  image_url: string | { url: string; detail?: TImageDetail }
}

export type TMessageContentComplex =
  | TMessageContentText
  | TMessageContentImageUrl
  | (Record<string, any> & { type?: 'text' | 'image_url' | string })

export type TMessageContent = string | TMessageContentComplex[]

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

  /**
   * The timestamp when the message was created.
   */
  readonly createdAt?: string
}

export interface IBaseMessageFields extends BaseMessageInterface {}

export abstract class BaseMessage implements BaseMessageInterface {
  content: TMessageContent
  id?: string
  createdAt?: string

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

    this.id = nanoid()
    this.createdAt = new Date().toISOString()
  }
}
