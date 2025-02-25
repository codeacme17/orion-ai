import { z } from 'zod'
import { BaseTool, type IBaseToolFiels } from './base'

type FuncType = (input: string | null) => Promise<any> | any

type ZodObjectAny = z.ZodObject<any, any, any, any>

type SchemaType<T extends ZodObjectAny = ZodObjectAny> = T | z.ZodEffects<T>

interface IFunctionToolFields extends IBaseToolFiels {
  /**
   *
   */
  func: FuncType
  schema: SchemaType
}

export class FunctionTool extends BaseTool {
  func: FuncType
  schema: SchemaType

  constructor(fields: IFunctionToolFields) {
    super(fields)
    this.func = fields.func
    this.schema = fields.schema
  }
}
