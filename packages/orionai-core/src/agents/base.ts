import { DEV_LOGGER } from '@/lib/logger'
import type { TModel } from '@/models'

export interface BaseAgentInterface {
  name: string
  description?: string
  tools?: Record<string, any>[]
}

export interface BaseAgentFields {
  name: string
  model: TModel
  description?: string
}

export abstract class BaseAgent implements BaseAgentInterface {
  name
  description
  model

  constructor(fields: BaseAgentFields) {
    const { name, description, model } = fields

    if (!name) {
      DEV_LOGGER.ERROR('Name is required.')
      throw new Error('name is required')
    }

    this.name = name
    this.description = description
    this.model = model
  }
}
