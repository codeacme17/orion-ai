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
  content: TMessageContent
  /**
   * The name of the message. This is useful for identifying the message type.
   */
  name?: string
  /**
   * Response metadata. For example: response headers, logprobs, token counts.
   */
  metadata?: Record<string, any>

  /**
   * An optional unique identifier for the message. This should ideally be
   * provided by the provider/model which created the message.
   */
  id?: string

  /**
   * The timestamp when the message was created.
   */
  createdAt?: string
}

export interface IBaseMessageFields extends BaseMessageInterface {}

export abstract class BaseMessage implements BaseMessageInterface {
  content: TMessageContent
  id?: string
  name?: string
  createdAt?: string
  metadata?: Record<string, any>

  constructor(props: IBaseMessageFields | string) {
    // If the input is not provided, throw an error
    if (!props || (typeof props !== 'string' && !props.content)) {
      throw new Error('[orion-ai] Message content is required.')
    }

    // If the input is a string, set the content of the message
    if (typeof props === 'string') {
      this.content = BaseMessage.parseContent(props)
    } else {
      this.content = BaseMessage.parseContent(props.content)
      this.id = props.id
      this.metadata = props.metadata
      this.createdAt = props.createdAt
    }
  }

  /**
   * Parse the content of the message and return an array of complex message objects.
   * @param content The content of the message
   * @returns An array of complex message objects
   */
  private static parseContent(content: TMessageContent): TMessageContentComplex[] {
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
