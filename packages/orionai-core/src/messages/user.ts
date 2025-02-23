import { BaseMessage, type IBaseMessageProps, type TMessageType } from "./base";

export interface IUserMessageProps extends IBaseMessageProps {}

export class UserMessage extends BaseMessage {
  constructor(props: IUserMessageProps | string) {
    super(props);
    this.role = "user";
  }

  get(): IUserMessageProps {
    const { content, role, id, created_at, token_count, metadata } = this;

    return {
      role,
      content,
      id,
      created_at,
      token_count,
      metadata,
    };
  }
}
