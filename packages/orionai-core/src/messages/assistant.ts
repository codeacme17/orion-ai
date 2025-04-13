import type { IToolCallResult } from '@/models'
import { BaseMessage, type IBaseMessageFields } from './base'

interface IAssistantMessageFiels extends IBaseMessageFields {
  readonly tool_calls?: IToolCallResult[]
}

export class AssistantMessage extends BaseMessage {
  readonly role
  readonly tool_calls?: IToolCallResult[]

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
