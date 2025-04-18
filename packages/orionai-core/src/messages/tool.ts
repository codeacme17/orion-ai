import { BaseMessage, type IBaseMessageFields, type TMessageType } from './base'

export interface IToolMessageFields extends Omit<IBaseMessageFields, 'content'> {
  call_id: string
  output?: string
  apiType?: 'chat_completion' | 'response'
}

export class ToolMessage extends BaseMessage {
  apiType?: 'chat_completion' | 'response'
  fields: IToolMessageFields

  constructor(fields: IToolMessageFields) {
    super({ content: fields.output })
    const { call_id } = fields

    if (!call_id) {
      throw new Error('ToolMessage requires a call_id')
    }
    this.apiType = fields.apiType || 'chat_completion'
    this.fields = fields
  }

  private fieldsAdapter() {
    if (this.apiType === 'chat_completion') {
      return {
        role: 'tool',
        content: this.fields.output,
        tool_call_id: this.fields.call_id,
      }
    }

    if (this.apiType === 'response') {
      return {
        type: 'function_call_output',
        call_id: this.fields.call_id,
        output: this.fields.output,
      }
    }
  }

  public get() {
    return this.fieldsAdapter()
  }
}

export const toolMessage = (fields: IToolMessageFields) => new ToolMessage(fields)
