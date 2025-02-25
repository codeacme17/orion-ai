import type { IParametersSchema, ITool, IToolSchema } from '.'
import type { CancellationToken } from '../lib/cancellation-token'

export interface IBaseToolFields<ArgsT, ReturnT> {
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

  argsType: new (...args: any[]) => ArgsT

  returnType: new (...args: any[]) => ReturnT
}

export abstract class BaseTool<ArgsT, ReturnT> implements ITool {
  protected _argsType: new (...args: any[]) => ArgsT
  protected _returnType: new (...args: any[]) => ReturnT
  protected _strict: boolean
  protected _name: string
  protected _description: string

  constructor(fields: IBaseToolFields<ArgsT, ReturnT>) {
    this._argsType = fields.argsType
    this._returnType = fields.returnType
    this._name = fields.name
    this._description = fields.description || ''
    this._strict = fields.strict || false
  }

  get name(): string {
    return this._name
  }

  get description(): string {
    return this._description
  }

  get schema(): IToolSchema {
    const modelSchema = this._argsType.prototype.getSchema()
    const parameters: IParametersSchema = {
      type: 'object',
      properties: modelSchema.properties,
      required: modelSchema.required || [],
      additionalProperties: modelSchema.additionalProperties || false,
    }

    if (
      this._strict &&
      new Set(parameters.required).size !== new Set(Object.keys(parameters.properties)).size
    ) {
      throw new Error('Strict mode is enabled, but not all input arguments are marked as required.')
    }

    return {
      name: this._name,
      description: this._description,
      parameters: parameters,
      strict: this._strict,
    }
  }

  abstract run(args: ArgsT, cancellationToken: CancellationToken): Promise<ReturnT>

  async runJson(args: Record<string, any>, cancellationToken: CancellationToken): Promise<any> {
    const validatedArgs = new this._argsType(args)
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
