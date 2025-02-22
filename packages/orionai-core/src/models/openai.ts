import Openai from "openai";
import { BaseModel, type ModelConfig } from "./base-model";
import { readEnv } from "@/lib/utils";

export enum OpenAIModelType {
  GPT_4O = "gpt-4o",
  O1 = "o1",
  O3 = "o3",
  GPT_4 = "gpt-4",
  GPT_35 = "gpt-35",
}

export interface OpenAIModelConfig extends ModelConfig {
  model: OpenAIModelType;
}

export class OpenAIModel extends BaseModel {
  private openai: Openai;

  constructor(config: OpenAIModelConfig) {
    super(config);

    if (!config.apiKey && readEnv("OPENAI_API_KEY")) throw new Error("");

    this.openai = new Openai({ apiKey: config.apiKey });
  }

  async generateResponse(input: string): Promise<string> {
    const response = await this.openai.completions.create({
      model: this.config.model,
      prompt: input,
      max_tokens: 100,
    });
    return response.choices[0].text;
  }
}
