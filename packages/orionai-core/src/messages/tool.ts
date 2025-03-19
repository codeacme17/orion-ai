import { BaseMessage, type IBaseMessageFields, type TMessageType } from './base'

export interface IToolMessageFields extends IBaseMessageFields {
  tool_call_id: string
}

export class ToolMessage extends BaseMessage {
  role: TMessageType
  tool_call_id: string

  constructor(fields: IToolMessageFields) {
    super(fields)

    const { tool_call_id } = fields

    if (!tool_call_id) {
      throw new Error('ToolMessage requires a tool_call_id')
    }

    this.role = 'tool'
    this.tool_call_id = tool_call_id
  }
}

export const toolMessage = (fields: IToolMessageFields) => new ToolMessage(fields)
