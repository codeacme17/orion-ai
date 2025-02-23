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

export type TImageDetail = "auto" | "low" | "high";

export type TMessageContentText = {
  type: "text";
  text: string;
};

export type TMessageContentImageUrl = {
  type: "image_url";
  image_url: string | { url: string; detail?: TImageDetail };
};

export type TMessageContentComplex =
  | TMessageContentText
  | TMessageContentImageUrl
  | (Record<string, any> & { type?: "text" | "image_url" | string });

export type TMessageContent = string | TMessageContentComplex[];

export interface IBaseMessageFields {
  content: TMessageContent;
  name?: string;
  /**
   * Response metadata. For example: response headers, logprobs, token counts.
   */
  metadata?: Record<string, any>;

  /**
   * An optional unique identifier for the message. This should ideally be
   * provided by the provider/model which created the message.
   */
  id?: string;

  /**
   * The timestamp when the message was created.
   */
  createdAt?: string;
}

export abstract class BaseMessage implements IBaseMessageFields {
  content: TMessageContent;
  id?: string;
  name?: string;
  createdAt?: string;
  metadata?: Record<string, any>;

  constructor(props: IBaseMessageFields | string) {
    // If the input is not provided, throw an error
    if (!props || (typeof props !== "string" && !props.content)) {
      throw new Error("[orion-ai] Message content is required.");
    }

    // If the input is a string, set the content of the message
    if (typeof props === "string") {
      this.content = props;
    } else {
      this.content = props.content;
      this.id = props.id || Math.random().toString(36).substring(7);
      this.metadata = props.metadata || {};
      this.createdAt = props.createdAt || new Date().toISOString();
    }
  }
}
