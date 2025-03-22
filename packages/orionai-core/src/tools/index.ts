import type { z } from 'zod'

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
}
