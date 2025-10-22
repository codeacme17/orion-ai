import { z } from 'zod'

declare const Deno: any

export const readEnv = (env: string): string | undefined => {
  if (typeof process !== 'undefined') {
    return process.env?.[env]?.trim() ?? undefined
  }
  if (typeof Deno !== 'undefined') {
    return Deno.env?.get?.(env)?.trim()
  }
  return undefined
}

export const getTypeFromZodType = (zodType: z.ZodTypeAny): string => {
  if (zodType instanceof z.ZodString) return 'string'
  if (zodType instanceof z.ZodNumber) return 'number'
  if (zodType instanceof z.ZodBoolean) return 'boolean'
  if (zodType instanceof z.ZodArray) return 'array'
  if (zodType instanceof z.ZodObject) return 'object'

  return zodType._def.typeName.replace('Zod', '').toLowerCase()
}
