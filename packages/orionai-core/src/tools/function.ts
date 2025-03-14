import { z } from 'zod'
import { BaseTool, type IBaseToolFields } from './base'
import type { TZodObjectAny } from '.'

interface IFunctionToolFields<T extends TZodObjectAny = TZodObjectAny> extends IBaseToolFields<T> {
  func: (
    args: (z.output<T> extends string ? string : never) | z.input<T>,
  ) => Promise<string> | string
}

export class FunctionTool<T extends TZodObjectAny = TZodObjectAny> extends BaseTool<T> {
  private _func: (
    args: (z.output<T> extends string ? string : never) | z.input<T>,
  ) => Promise<string> | string

  constructor(fields: IFunctionToolFields<T>) {
    super(fields)
    this._func = fields.func
  }

  toJSON() {
    const schema = this._schema instanceof z.ZodEffects ? this._schema._def.schema : this._schema
    return {
      type: 'function',
      function: {
        name: this.name,
        description: this.description,
        parameters: {
          type: 'object',
          properties: schema.shape,
          required: Object.keys(schema.shape).filter((k) => !schema.shape[k].isOptional()),
        },
      },
    }
  }

  validParams(
    params: (z.output<T> extends string ? string : never) | z.input<T> | string,
  ): boolean {
    try {
      this.schema.parse(params)
      return true
    } catch (error) {
      console.error('[orion ai] error', error)
      return false
    }
  }

  async run(
    args: (z.output<T> extends string ? string : never) | z.input<T> | string,
  ): Promise<string> {
    let parsedArgs: z.input<T>

    if (typeof args === 'string') {
      try {
        parsedArgs = JSON.parse(args)
      } catch (error) {
        throw new Error('[orion ai] if args is a string, it must be a valid JSON string')
      }
    } else parsedArgs = args

    if (!this.validParams(parsedArgs)) {
      throw new Error('Invalid arguments')
    }

    const result = await this._func(parsedArgs)
    return result
  }

  get() {
    return {
      name: this.name,
      description: this.description,
      parameters: this.schema,
    }
  }
}

export const functionTool = <T extends TZodObjectAny = TZodObjectAny>(
  fields: IFunctionToolFields<T>,
) => new FunctionTool(fields)
