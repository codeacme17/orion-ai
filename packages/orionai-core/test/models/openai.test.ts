import { describe, it, expect, vi, beforeEach } from "vitest";
import { OpenAIModel } from "@/models/openai";
import { config as dotConfig } from "dotenv";
import { HttpsProxyAgent } from "https-proxy-agent";

describe("OpenAIModel", () => {
  let model: OpenAIModel;
  dotConfig();

  console.log("process.env.HTTPS_PROXY", process.env.HTTPS_PROXY);

  const proxy = new HttpsProxyAgent(process.env.HTTPS_PROXY || "");

  beforeEach(() => {
    model = new OpenAIModel({
      apiKey: process.env.OPENAI_API_KEY || "",
      // model: "gpt-4o-mini",
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
      messages: [{ role: "user", content: "hello" }],
      model: "",
    });
    expect(response).toBeTypeOf("string");
    expect(response).not.toBe("");
  });
});
