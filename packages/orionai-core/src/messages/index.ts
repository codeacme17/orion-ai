import type { UserMessage } from './user'
import type { AssistantMessage } from './assistant'
import type { SystemMessage } from './system'
import type { ToolMessage } from './tool'

export * from './base'
export * from './user'
export * from './assistant'
export * from './system'
export * from './tool'

export type TMessage = UserMessage | AssistantMessage | SystemMessage | ToolMessage
