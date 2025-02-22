import Openai from "openai";
import type { CompletionCreateParamsBase } from "openai/resources/completions.mjs";
import { BaseModel, type BaseCompleteParams, type BaseModelConfig } from "./base-model";
import { readEnv } from "@/lib/utils";

export type OpenaiModelType = "gpt-4" | "gpt-4o" | "o1" | "o3" | "gpt-35";

export interface OpenAIModelConfig extends BaseModelConfig {
  model?: OpenaiModelType;
}

export interface CompleteParams
  extends Omit<CompletionCreateParamsBase, "model">,
    BaseCompleteParams {
  messages: string[];
  model?: OpenaiModelType;
}

const DEFAULT_MODEL: OpenaiModelType = "gpt-4";

export class OpenAIModel extends BaseModel {
  private openai: Openai;

  constructor(config: OpenAIModelConfig) {
    super(config);

    const { apiKey } = config;

    if (!apiKey && !readEnv("OPENAI_API_KEY"))
      throw new Error("[orion-ai] OpenAI API key is required.");

    this.openai = new Openai({ apiKey: config.apiKey || readEnv("OPENAI_API_KEY") });
  }

  async complete({ messages, model = DEFAULT_MODEL }: CompleteParams): Promise<string> {
    try {
      const response = await this.openai.completions.create({
        model: model || this.config.model || DEFAULT_MODEL,
        prompt: messages,
        max_tokens: 100,
      });
      return response.choices[0].text;
    } catch (error) {
      throw error;
    }
  }
}

const o = new OpenAIModel({
  apiKey: "",
});
