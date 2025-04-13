import {
  BaseMessage,
  type IBaseMessageFields,
  type TMessageContent,
  type TMessageType,
} from './base'

interface ISystemMessageFiels extends Omit<IBaseMessageFields, 'content'> {
  content: TMessageContent
}

export class SystemMessage extends BaseMessage {
  role: TMessageType

  constructor(fields: ISystemMessageFiels | string) {
    super(fields)

    // If the input is not provided, throw an error
    if (!fields || (typeof fields !== 'string' && fields.content === undefined)) {
      throw new Error('[orion-ai] Message content is required.')
    }

    this.role = 'system'
  }
}

export const systemMessage = (fields: ISystemMessageFiels | string) => new SystemMessage(fields)
