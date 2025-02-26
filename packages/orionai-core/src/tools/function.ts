import { z, ZodSchema } from 'zod'
import { BaseTool, type IBaseToolFields } from './base'
import type { CancellationToken } from '../lib/cancellation-token'
import type { TZodObjectAny } from '.'

interface IFunctionToolFields<T> extends IBaseToolFields<T> {
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

  async run(
    args: (z.output<T> extends string ? string : never) | z.input<T>,
    cancellationToken: CancellationToken,
  ): Promise<string> {
    let parsedArgs: z.input<T>

    if (typeof args === 'string') {
      try {
        parsedArgs = JSON.parse(args)
      } catch (error) {
        parsedArgs = args as z.input<T>
      }
    } else {
      parsedArgs = args
    }

    try {
      this.schema.parse(parsedArgs)
    } catch (error) {
      throw new Error(`Invalid arguments: ${error.message}`)
    }

    const result = await this._func(parsedArgs)
    return result
  }
}
