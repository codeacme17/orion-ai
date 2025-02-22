export interface IBaseMessage extends IBaseMessageProps {
  get(): IBaseMessageProps;
}

export interface IBaseMessageProps {
  content: string;
  id?: string;
  created_at?: string;
  token_count?: number;
  metadata?: Record<string, any>;
}

export abstract class BaseMessage implements IBaseMessage {
  /**
   * The content of the message.
   */
  content: string;

  /**
   * The unique identifier for the message.
   */
  id?: string;

  /**
   * The timestamp when the message was created.
   */
  created_at?: string;

  /**
   * The number of tokens in the message.
   */
  token_count?: number;

  /**
   * Additional metadata for the message.
   */
  metadata?: Record<string, any>;

  constructor(props: IBaseMessageProps | string) {
    if (!props) throw new Error("[orion-ai] Message content is required.");

    // If the input is a string, set the content of the message
    if (typeof props === "string") {
      this.content = props;
    } else {
      this.content = props.content;
      this.id = props.id;
      this.created_at = props.created_at;
      this.token_count = props.token_count;
      this.metadata = props.metadata;
    }
  }

  get(): IBaseMessageProps {
    return {
      content: this.content,
      id: this.id,
      created_at: this.created_at,
      token_count: this.token_count,
      metadata: this.metadata,
    };
  }
}
