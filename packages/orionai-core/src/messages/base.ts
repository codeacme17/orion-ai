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

export interface IBaseMessageFields {
  content?: TMessageContent
}

export abstract class BaseMessage {
  /**
   * The content of the message. This can be a string or an array of objects.
   */
  content?: TMessageContent

  constructor(fields: IBaseMessageFields | string) {
    // If the input is a string, set the content of the message
    if (typeof fields === 'string') {
      this.content = fields
    } else {
      this.content = fields.content || ''
    }
  }
}
