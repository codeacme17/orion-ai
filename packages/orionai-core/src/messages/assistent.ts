import { BaseMessage, type IBaseMessageFields } from './base'

interface IAssistantMessageFiels extends IBaseMessageFields {
  tool_calls?: any[]
}

export class AssistantMessage extends BaseMessage {
  role
  tool_calls?: any[]

  constructor(fields: IAssistantMessageFiels | string) {
    super(fields)
    this.role = 'assistant'

    if (typeof fields !== 'string' && fields.tool_calls) {
      this.tool_calls = fields.tool_calls
    }
  }
}

export const assistantMessage = (fields: IAssistantMessageFiels | string) =>
  new AssistantMessage(fields)
