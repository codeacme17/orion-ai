import { BaseMessage, type IBaseMessageFields, type TMessageType } from './base'

export interface IUserMessageFields extends IBaseMessageFields {}

export class UserMessage extends BaseMessage {
  role: TMessageType

  constructor(props: IUserMessageFields | string) {
    super(props)
    this.role = 'user'
  }
}

export const userMessage = (props: IUserMessageFields | string) => new UserMessage(props)
