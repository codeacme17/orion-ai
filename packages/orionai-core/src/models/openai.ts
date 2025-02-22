import Openai, { type ClientOptions } from "openai";
import { BaseModel, type BaseCompleteParams, type BaseModelConfig } from "./base-model";
import { readEnv } from "@/lib/utils";
import type { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions.mjs";

export type OpenaiModelType = "gpt-4" | "gpt-4o" | "gpt-4o-mini" | "o1" | "o3" | "gpt-35";

export interface OpenAIModelConfig extends ClientOptions, BaseModelConfig {
  model?: OpenaiModelType;
}

export interface CompleteParams
  extends Omit<ChatCompletionCreateParamsBase, "model" | "prompt">,
    BaseCompleteParams {
  model?: OpenaiModelType;
}

const DEFAULT_MODEL: OpenaiModelType = "gpt-4";

export class OpenAIModel extends BaseModel {
  private openai: Openai;

  constructor(config: OpenAIModelConfig) {
    super(config);

    const { apiKey } = config;

    if (!apiKey && !readEnv("OPENAI_API_KEY")) {
      throw new Error("[orion-ai] OpenAI API key is required.");
    }

    this.openai = new Openai({ apiKey: config.apiKey || readEnv("OPENAI_API_KEY"), ...config });
  }

  async complete({ messages, model = DEFAULT_MODEL, ...options }: CompleteParams): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        ...options,
        model: model || this.config.model || DEFAULT_MODEL,
        messages,
      });

      if ("choices" in response) {
        return response.choices[0].message.content || "";
      }

      throw new Error("Unexpected response format");
    } catch (error) {
      throw error;
    }
  }
}
