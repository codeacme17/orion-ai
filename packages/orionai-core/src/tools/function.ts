import { z } from 'zod'
import { BaseTool, type IBaseToolFields } from './base'
import type { TSupportModelFamily } from '@/models'
import type { CancellationToken } from '@/lib/cancellation-token'

type FuncType = (input: string | null) => Promise<any> | any

type ZodObjectAny = z.ZodObject<any, any, any, any>

type SchemaType<T extends ZodObjectAny = ZodObjectAny> = T | z.ZodEffects<T>

/**
 * Parse and adapt function parameters for different model formats.
 * This helper function takes the raw input and converts it into the appropriate
 * format based on the model type and requirements.
 *
 * @param input The raw input parameters to parse
 * @returns The parsed and adapted parameters object
 */
const functionParamsAdaptor = (rowFields: IFunctionToolFields, modeFamily: TSupportModelFamily) => {
  try {
    if (!rowFields.name) {
      return null
    }

    if (modeFamily === 'openai' || modeFamily === 'deepseek') {
    }

    if (modeFamily === 'anthropic') {
    }
  } catch (error) {
    throw error
  }
}

interface IFunctionToolFields extends IBaseToolFields<any, any> {
  /**
   *
   */
  func: FuncType
  schema: SchemaType
}

export class FunctionTool<ArgsT, ReturnT> extends BaseTool<ArgsT, ReturnT> {
  private _func: (args: ArgsT) => Promise<ReturnT> | ReturnT

  constructor(
    func: (args: ArgsT) => Promise<ReturnT> | ReturnT,
    name: string,
    description: string,
    argsType: new (...args: any[]) => ArgsT,
    returnType: new (...args: any[]) => ReturnT,
    strict: boolean = false,
  ) {
    super({ name, description, argsType, returnType, strict })
    this._func = func
  }

  async run(args: ArgsT, cancellationToken: CancellationToken): Promise<ReturnT> {
    return await this._func(args)
  }
}
