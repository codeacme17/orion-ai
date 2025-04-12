import type { BaseTool } from './base'
import type { FunctionTool } from './function'

export * from './base'
export * from './function'

export type TTool = BaseTool | FunctionTool
