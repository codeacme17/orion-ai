import { z } from 'zod'
import { BaseTool, type IBaseToolFields } from './base'
import { DEV_LOGGER } from '@/lib/logger'
import { getTypeFromZodType } from '@/lib/utils'
import type { TZodObjectAny } from './base'

interface IFunctionToolFields<T extends TZodObjectAny = TZodObjectAny> extends IBaseToolFields<T> {
  execute: (
    args: (z.output<T> extends string ? string : never) | z.input<T>,
  ) => Promise<string> | string
}

export class FunctionTool<T extends TZodObjectAny = TZodObjectAny> extends BaseTool<T> {
  private execute: (
    args: (z.output<T> extends string ? string : never) | z.input<T>,
  ) => Promise<string> | string

  constructor(fields: IFunctionToolFields<T>) {
    super(fields)
    this.execute = fields.execute
  }

  toJSON() {
    const schema = this.schema instanceof z.ZodEffects ? this.schema._def.schema : this.schema

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

  /**
   * Only for Openai Response Api
   */
  toResponseJson() {
    const schema = this.schema instanceof z.ZodEffects ? this.schema._def.schema : this.schema
    const properties: Record<string, any> = {}

    Object.entries(schema.shape).forEach(([key, value]) => {
      const zodValue = value as z.ZodTypeAny
      const description = zodValue.description || ''
      const type = getTypeFromZodType(schema.shape[key])
      properties[key] = { type, description }
    })

    return {
      type: 'function',
      name: this.name,
      description: this.description,
      parameters: {
        type: 'object',
        properties,
        required: Object.keys(schema.shape).filter((k) => !schema.shape[k].isOptional()),
        additionalProperties: false,
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
      DEV_LOGGER.ERROR(error)
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
      throw new Error('[orion ai] Invalid arguments')
    }

    const result = await this.execute(parsedArgs)
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
