export interface IBaseMessageProps {
  content: string;
  role?: TMessageType;
  id?: string;
  created_at?: string;
  name?: string;
  token_count?: number;
  metadata?: Record<string, any>;
}

export type TMessageType =
  | "user"
  | "assistant"
  | "generic"
  | "developer"
  | "system"
  | "function"
  | "tool"
  | "remove"
  | "unknown";

export abstract class BaseMessage {
  /**
   * The content of the message.
   */
  content: string;

  /**
   * The role of the message.
   */
  role: TMessageType;

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
    // If the input is not provided, throw an error
    if (!props || (typeof props !== "string" && !props.content)) {
      throw new Error("[orion-ai] Message content is required.");
    }

    // If the input is a string, set the content of the message
    if (typeof props === "string") {
      this.content = props;
      this.role = "unknown";
    } else {
      this.content = props.content;
      this.role = props.role!;
      this.id = props.id || Math.random().toString(36).substring(7);
      this.created_at = props.created_at || new Date().toISOString();
      this.token_count = props.token_count || 0;
      this.metadata = props.metadata || {};
    }
  }

  get(): IBaseMessageProps {
    return {
      content: this.content,
      role: this.role,
      id: this.id,
      created_at: this.created_at,
      token_count: this.token_count,
      metadata: this.metadata,
    };
  }
}
