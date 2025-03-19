import type { UserMessage } from './user'
import type { AssistantMessage } from './assistent'
import type { SystemMessage } from './system'
import type { ToolMessage } from './tool'

export * from './base'
export * from './user'
export * from './assistent'
export * from './system'
export * from './tool'

export type TMessage = UserMessage | AssistantMessage | SystemMessage | ToolMessage
