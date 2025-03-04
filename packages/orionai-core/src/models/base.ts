export interface IBaseModelConfig {
  apiKey?: string;
  model?: string;
  [key: string]: any;
}

export interface IBaseCompleteParams {}

export abstract class BaseModel {
  /**
   * The configuration for the model.
   */
  protected config: IBaseModelConfig;

  constructor(config: IBaseModelConfig) {
    this.config = config;
  }

  /**
   * Abstract method to be implemented by subclasses to generate a response.
   * @param input The input to the model.
   * @returns The generated response.
   */
  abstract complete(params: IBaseCompleteParams): Promise<string>;
}
