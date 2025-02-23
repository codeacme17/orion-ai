import Openai, { type ClientOptions } from "openai";
import {
  BaseModel,
  type IBaseCompleteParams,
  type IBaseModel,
  type IBaseModelConfig,
} from "./base";
import { readEnv } from "@/lib/utils";
import type {
  ChatCompletionCreateParamsBase,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions.mjs";
import type { ChatModel } from "openai/resources/index.mjs";
import type { IChatCompletionMessage } from "@/messages";
import type { RequestOptions } from "openai/core.mjs";

export interface IOpenAIModelConfig extends ClientOptions, IBaseModelConfig {
  model?: (string & {}) | ChatModel;
}

export interface IOpenaiCompleteParams
  extends Omit<ChatCompletionCreateParamsBase, "messages">,
    IBaseCompleteParams {
  messages: Array<IChatCompletionMessage>;
}

export interface IOpenAIModel extends IBaseModel {
  complete(params: IOpenaiCompleteParams): Promise<string>;
}

const DEFAULT_MODEL: ChatModel = "gpt-4o-mini";

export class OpenAIModel extends BaseModel implements IOpenAIModel {
  private openai: Openai;

  constructor(config: IOpenAIModelConfig) {
    super(config);

    const { apiKey } = config;

    if (!apiKey && !readEnv("OPENAI_API_KEY")) {
      throw new Error("[orion-ai] OpenAI API key is required.");
    }

    this.openai = new Openai({
      apiKey: this.config.apiKey || readEnv("OPENAI_API_KEY"),
      ...config,
    });
  }

  async complete(
    { messages, model, ...rest }: IOpenaiCompleteParams,
    options?: RequestOptions
  ): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create(
        {
          ...rest,
          model: model || this.config.model || DEFAULT_MODEL,
          messages: messages as Array<ChatCompletionMessageParam>,
        },
        { ...options }
      );

      if ("choices" in response) {
        return response.choices[0].message.content || "";
      }

      throw new Error("Unexpected response format");
    } catch (error) {
      throw error;
    }
  }
}
