import { BaseMessage, type IBaseMessageFields, type TMessageType } from './base'

interface IAssistantMessageFiels extends IBaseMessageFields {}

export class AssistantMessage extends BaseMessage {
  role: TMessageType

  constructor(fields: IAssistantMessageFiels | string) {
    super(fields)
    this.role = 'assistant'
  }
}

export const assistantMessage = (fields: IAssistantMessageFiels | string) =>
  new AssistantMessage(fields)
