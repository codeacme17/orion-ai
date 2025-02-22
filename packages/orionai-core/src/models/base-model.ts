export interface BaseModelConfig {
  apiKey: string;
  model?: string;
  [key: string]: any;
}

export interface BaseCompleteParams {}

export abstract class BaseModel {
  protected config: BaseModelConfig;

  constructor(config: BaseModelConfig) {
    this.config = config;
  }

  /**
   * Abstract method to be implemented by subclasses to generate a response.
   * @param input The input to the model.
   * @returns The generated response.
   */
  abstract complete(params: BaseCompleteParams): Promise<string>;

  /**
   * Set the configuration for the model.
   * @param config The new configuration.
   */
  setConfig(config: BaseModelConfig): void {
    this.config = config;
  }

  /**
   * Get the current configuration of the model.
   * @returns The current configuration.
   */
  getConfig(): BaseModelConfig {
    return this.config;
  }
}
