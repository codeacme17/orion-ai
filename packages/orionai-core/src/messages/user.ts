import {
  BaseMessage,
  type IBaseMessageFields,
  type TMessageContent,
  type TMessageType,
} from './base'

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

export interface IUserMessageFields extends IBaseMessageFields {
  content: TMessageContentComplex | TMessageContentComplex[] | string
}

export class UserMessage extends BaseMessage {
  role: TMessageType

  constructor(fields: IUserMessageFields | string) {
    super(fields)
    this.role = 'user'

    if (typeof fields === 'string') {
      this.content = this.parseContent(fields)
    } else {
      this.content = this.parseContent(fields.content)
    }
  }

  /**
   * Parse the content of the message and return an array of complex message objects.
   * @param content The content of the message
   * @returns An array of complex message objects
   */
  parseContent(content: TMessageContent): TMessageContentComplex[] | TMessageContentComplex {
    if (typeof content === 'string') {
      return [{ type: 'text', text: content }]
    }

    // content is already an array of TMessageContentComplex if it's not a string
    if (Array.isArray(content)) {
      // Optionally validate each item in the array if needed
      return content.map((item) => {
        if (!item.type) {
          return { type: 'text', text: String(item) }
        }

        if (item.type === 'image_url' && typeof item.image_url === 'string') {
          return {
            type: 'image_url',
            image_url: { url: item.image_url },
          }
        }

        return item
      })
    }

    return content
  }
}

export const userMessage = (fields: IUserMessageFields | string) => new UserMessage(fields)
