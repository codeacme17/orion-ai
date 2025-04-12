import type { z } from 'zod'
import type { BaseTool } from './base'
import type { FunctionTool } from './function'

export * from './base'

export type TZodObjectAny = z.ZodObject<any, any, any, any>

export type TTool = BaseTool | FunctionTool
