export interface IBaseToolFiels {
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

export abstract class BaseTool {
  protected name: string
  protected description: string
  protected strict: boolean

  constructor(fiels: IBaseToolFiels) {
    const { name, description, strict } = fiels

    this.name = name
    this.description = description || ''
    this.strict = strict || false
  }
}
