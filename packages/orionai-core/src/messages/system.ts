import { BaseMessage, type IBaseMessageFields, type TMessageType } from "./base";

interface ISystemMessageFiels extends IBaseMessageFields {}

export class SystemMessage extends BaseMessage {
  role: TMessageType;

  constructor(fields: ISystemMessageFiels | string) {
    super(fields);
    this.role = "system";
  }
}
