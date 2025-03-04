import { describe, it, expect, vi, beforeEach } from "vitest";
import { OpenAIModel } from "@/models/openai";
import { config as dotConfig } from "dotenv";
import { HttpsProxyAgent } from "https-proxy-agent";
import { AssistantMessage, SystemMessage, UserMessage } from "@/messages";

describe("OpenAIModel", () => {
  let model: OpenAIModel;

  dotConfig();

  const proxy = new HttpsProxyAgent(process.env.HTTPS_PROXY || "");

  beforeEach(() => {
    model = new OpenAIModel({
      apiKey: process.env.OPENAI_API_KEY || "",
      httpAgent: proxy,
    });
  });

  it("should initialize the OpenAIModel correctly", () => {
    expect(model).toBeInstanceOf(OpenAIModel);
  });

  it("should throw an error if no API key is provided", () => {
    // Temporarily override the environment variable
    const originalApiKey = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "";

    expect(() => new OpenAIModel({ apiKey: "", model: "gpt-4o-mini" })).toThrow(
      "[orion-ai] OpenAI API key is required."
    );

    // Restore the original environment variable
    process.env.OPENAI_API_KEY = originalApiKey;
  });

  it("should successfully call the complete method and return a response", async () => {
    const response = await model.complete({
      messages: [
        new SystemMessage("You are a super frontend master, please reply to me in English"),
        new UserMessage("Please give me a debounce function"),
        new AssistantMessage("Sure, here is a debounce function"),
        new UserMessage(
          "Please first tell me your identity, then tell me what you answered to my last question"
        ),
      ],
    });

    expect(response).toBeTypeOf("string");
    expect(response).not.toBe("");
  });
});
