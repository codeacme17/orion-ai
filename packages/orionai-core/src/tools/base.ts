import type { z } from 'zod'
import type { ITool, TZodObjectAny } from '.'

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

export abstract class BaseTool<T extends TZodObjectAny = TZodObjectAny> implements ITool<T> {
  protected _strict: boolean
  protected _name: string
  protected _description: string
  protected _schema: T | z.ZodEffects<T>

  constructor(fields: IBaseToolFields<T>) {
    this._name = fields.name
    this._description = fields.description || ''
    this._strict = fields.strict || false
    this._schema = fields.schema
  }

  get name(): string {
    return this._name
  }

  get description(): string {
    return this._description
  }

  get schema(): T | z.ZodEffects<T> {
    return this._schema
  }

  abstract run(args: (z.output<T> extends string ? string : never) | z.input<T>): Promise<string>

  returnValueAsString(value: any): string {
    return JSON.stringify(value)
  }

  abstract toJSON(): Record<string, any>
}
