import type { CancellationToken } from '@/lib/cancellation-token'
import type { z, ZodSchema } from 'zod'

export * from './base'

export type TZodObjectAny = z.ZodObject<any, any, any, any>

/**
 * Represents a tool that can be executed with specific arguments.
 */
export interface ITool<T extends TZodObjectAny = TZodObjectAny> {
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

  /**
   * Converts the return value of the tool/function to a string.
   * @param value The value to be converted to a string.
   * @returns The string representation of the value.
   */
  returnValueAsString(value: any): string

  /**
   * Executes the tool/function with the provided arguments and cancellation token.
   * @param args The arguments to be passed to the tool/function.
   * @param cancellationToken The token to signal cancellation of the operation.
   * @returns A promise that resolves with the result of the execution.
   */
  runJson(args: Record<string, any>, cancellationToken: CancellationToken): Promise<any>
}

/**
 * Represents the schema for a tool, defining its parameters and other metadata.
 */
export interface IToolSchema {
  /**
   * The parameters schema that defines the structure of the input arguments.
   */
  parameters?: IParametersSchema

  /**
   * The name of the tool/function.
   */
  name: string

  /**
   * A description of the tool/function.
   */
  description?: string

  /**
   * Indicates whether strict adherence to the schema is required.
   */
  strict?: boolean
}

/**
 * Represents the schema for the parameters of a tool/function.
 */
export interface IParametersSchema {
  /**
   * The type of the parameters (e.g., 'object', 'array').
   */
  type: string

  /**
   * The properties of the parameters, defining their structure.
   */
  properties: Record<string, any>

  /**
   * An array of required properties for the parameters.
   */
  required?: string[]

  /**
   * Indicates whether additional properties are allowed in the parameters.
   */
  additionalProperties?: boolean
}
