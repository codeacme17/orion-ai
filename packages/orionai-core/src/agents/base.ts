import { DEV_LOGGER } from '@/lib/logger'
import type { TModel } from '@/models'
import type { BaseTool } from '@/tools'

export interface BaseAgentFields {
  readonly name: string
  readonly model: TModel
  readonly tools?: Array<BaseTool>
  readonly debug?: boolean
}

export abstract class BaseAgent {
  name
  model
  tools

  constructor(fields: BaseAgentFields) {
    const { name, model, tools } = fields

    if (!name) {
      DEV_LOGGER.ERROR('name is required.')
      throw new Error('name is required')
    }

    this.name = name
    this.model = model
    this.tools = tools
  }
}
