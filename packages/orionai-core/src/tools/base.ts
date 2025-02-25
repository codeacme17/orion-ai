import type { z } from 'zod'
import type { IParametersSchema, ITool, IToolSchema } from '.'
import type { CancellationToken } from '../lib/cancellation-token'

export interface IBaseToolFields {
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
}

export abstract class BaseTool<ArgsT, ReturnT> implements ITool {
  protected _argsType: new (...args: any[]) => ArgsT
  protected _returnType: new (...args: any[]) => ReturnT

  public name: string
  public description: string
  protected _strict: boolean

  constructor(
    argsType: new (...args: any[]) => ArgsT,
    returnType: new (...args: any[]) => ReturnT,
    name: string,
    description: string,
    strict: boolean = false,
  ) {
    this._argsType = argsType
    this._returnType = returnType
    this.name = name
    this.description = description
    this._strict = strict
  }

  get schema(): IToolSchema {
    const modelSchema = this._argsType.prototype.getSchema() // 假设有一个方法获取 schema
    const parameters: IParametersSchema = {
      type: 'object',
      properties: modelSchema.properties,
      required: modelSchema.required || [],
      additionalProperties: modelSchema.additionalProperties || false,
    }

    // 处理严格模式
    if (
      this._strict &&
      new Set(parameters.required).size !== new Set(Object.keys(parameters.properties)).size
    ) {
      throw new Error('Strict mode is enabled, but not all input arguments are marked as required.')
    }

    return {
      name: this.name,
      description: this.description,
      parameters: parameters,
      strict: this._strict,
    }
  }

  abstract run(args: ArgsT, cancellationToken: CancellationToken): Promise<ReturnT>

  async runJson(args: Record<string, any>, cancellationToken: CancellationToken): Promise<any> {
    const validatedArgs = new this._argsType(args) // 假设有一个构造函数进行验证
    return await this.run(validatedArgs, cancellationToken)
  }

  returnValueAsString(value: any): string {
    return JSON.stringify(value)
  }

  argsType(): new (...args: any[]) => ArgsT {
    return this._argsType
  }
  returnType(): new (...args: any[]) => ReturnT {
    return this._returnType
  }
}
