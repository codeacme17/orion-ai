import type { z } from 'zod'
import type { TZodObjectAny } from '.'

/**
 * Represents a tool that can be executed with specific arguments.
 */
export interface IBaseTool<T extends TZodObjectAny = TZodObjectAny> {
  /**
   * The name of the tool/function to be called.
   */
  name: string

  /**
   * A description of what the tool/function does, used by the model to choose when and how to call the function.
   */
  description: string

  /**
   * The schema that defines the parameters for the tool/function.
   */
  schema: T | z.ZodEffects<T>
}

export interface IBaseToolFields<T extends TZodObjectAny = TZodObjectAny> {
  /**
   * The name of the tool/function to be called. Must be a-z, A-Z, 0-9, or contain
   * underscores and dashes, with a maximum length of 64.
   */
  name: string

  /**
   * A description of what the tool/function does, used by the model to choose when and
   * how to call the function.
   */
  description?: string

  /**
   * Whether to enable strict schema adherence when generating the function call.
   * If true, the model will follow the exact schema defined in the parameters field.
   */
  strict?: boolean | null

  schema: T | z.ZodEffects<T>
}

export abstract class BaseTool<T extends TZodObjectAny = TZodObjectAny> implements IBaseTool<T> {
  strict: boolean
  name: string
  description: string
  schema: T | z.ZodEffects<T>

  constructor(fields: IBaseToolFields<T>) {
    this.name = fields.name
    this.description = fields.description || ''
    this.strict = fields.strict || false
    this.schema = fields.schema
  }

  abstract run(args: (z.output<T> extends string ? string : never) | z.input<T>): Promise<string>

  abstract toJSON(): Record<string, any>

  abstract toResponseJson(): Record<string, any>
}
