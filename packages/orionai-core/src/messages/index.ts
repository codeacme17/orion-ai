import type { UserMessage } from "./user";
import type { AssistantMessage } from "./assistent";
import type { SystemMessage } from "./system";

export * from "./base";
export * from "./user";
export * from "./assistent";
export * from "./system";

export type IChatCompletionMessage = UserMessage | AssistantMessage | SystemMessage;
