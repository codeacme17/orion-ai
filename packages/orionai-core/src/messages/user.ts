import { BaseMessage, type IBaseMessageProps } from "./base";

export interface IUserMessageProps extends IBaseMessageProps {}

export class UserMessage extends BaseMessage {
  constructor(props: IUserMessageProps | string) {
    super(props);
  }

  get(): IUserMessageProps {
    return {
      ...this,
      role: "user",
    };
  }
}
