export interface ModelConfig {
  apiKey: string;
  model: string;
  [key: string]: any;
}

export abstract class BaseModel {
  protected config: ModelConfig;

  constructor(config: ModelConfig) {
    this.config = config;
  }

  /**
   * Abstract method to be implemented by subclasses to generate a response.
   * @param input The input to the model.
   * @returns The generated response.
   */
  abstract generateResponse(input: string): Promise<string>;

  /**
   * Set the configuration for the model.
   * @param config The new configuration.
   */
  setConfig(config: ModelConfig): void {
    this.config = config;
  }

  /**
   * Get the current configuration of the model.
   * @returns The current configuration.
   */
  getConfig(): ModelConfig {
    return this.config;
  }
}
