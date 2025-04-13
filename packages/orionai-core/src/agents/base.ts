import { DEV_LOGGER } from '@/lib/logger'
import type { TModel } from '@/models'
import type { BaseTool, TTool } from '@/tools'

export interface BaseAgentFields {
  /**
   * The name of the agent.
   */
  name: string

  /**
   * The model to use for the agent.
   */
  model: TModel

  /**
   * The tools to use for the agent.
   */
  tools?: Array<TTool>

  /**
   * Whether to enable debug mode for the agent.
   */
  debug?: boolean

  /**
   * Whether to stream the agent's response.
   */
  stream?: boolean
}

export abstract class BaseAgent {
  name: string
  model: TModel
  tools?: Array<BaseTool>
  stream?: boolean

  constructor(fields: BaseAgentFields) {
    const { name, model, tools, stream } = fields

    if (!name) {
      DEV_LOGGER.ERROR('name is required.')
      throw new Error('name is required')
    }

    this.name = name
    this.model = model
    this.tools = tools
    this.stream = stream
  }
}
