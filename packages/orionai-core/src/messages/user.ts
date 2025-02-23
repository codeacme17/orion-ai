import { BaseMessage, type IBaseMessageFields, type TMessageType } from "./base";

export interface IUserMessageFields extends IBaseMessageFields {}

export class UserMessage extends BaseMessage {
  constructor(props: IUserMessageFields | string) {
    super(props);
  }
}
