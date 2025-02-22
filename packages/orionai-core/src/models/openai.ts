import Openai, { type ClientOptions } from "openai";
import { BaseModel, type BaseCompleteParams, type BaseModelConfig } from "./base";
import { readEnv } from "@/lib/utils";
import type { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions.mjs";
import type { ChatModel } from "openai/resources/index.mjs";

export interface OpenAIModelConfig extends ClientOptions, BaseModelConfig {
  model?: (string & {}) | ChatModel;
}

export interface OpenaiCompleteParams extends ChatCompletionCreateParamsBase, BaseCompleteParams {}

const DEFAULT_MODEL: ChatModel = "gpt-4o-mini";

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

  async complete({ messages, model, ...options }: OpenaiCompleteParams): Promise<string> {
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
