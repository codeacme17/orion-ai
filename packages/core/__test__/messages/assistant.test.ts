import { AssistantMessage } from "@/messages";
import { describe, expect, it } from "vitest";

describe("AssistantMessage", () => {
  it("should create an AssistantMessage instance with the correct properties", () => {
    const message = new AssistantMessage("Hello, world!");
    expect(message).toBeInstanceOf(AssistantMessage);
  });
});
