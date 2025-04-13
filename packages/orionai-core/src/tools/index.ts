import type { BaseTool } from './base'
import type { FunctionTool } from './function'
import type { MCPTool } from './mcp/tool'

export * from './base'
export * from './function'
export * from './mcp/tool'

export type TTool = BaseTool | FunctionTool | MCPTool
