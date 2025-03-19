import { DEV_LOGGER } from '@/lib/logger'
import type { TModel } from '@/models'
import type { BaseTool } from '@/tools'

export interface BaseAgentInterface {
  name: string
  tools?: Array<BaseTool>
}

export interface BaseAgentFields extends BaseAgentInterface {
  name: string
  model: TModel
  tools?: Array<BaseTool>
}

export abstract class BaseAgent implements BaseAgentInterface {
  name
  model
  tools

  constructor(fields: BaseAgentFields) {
    const { name, model, tools } = fields

    if (!name) {
      DEV_LOGGER.ERROR('Name is required.')
      throw new Error('name is required')
    }

    this.name = name
    this.model = model
    this.tools = tools
  }
}
