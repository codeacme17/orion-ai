import type { CoreMessage } from 'ai'

/**
 * Convert Orion AI messages to AI SDK format
 */
export function convertMessagesToAISDK(messages: Array<any>): Array<CoreMessage> {
  return messages.map((msg): CoreMessage => {
    if ('role' in msg && msg.role === 'system') {
      return {
        role: 'system',
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
      }
    }

    if ('role' in msg && msg.role === 'user') {
      return {
        role: 'user',
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
      }
    }

    if ('role' in msg && msg.role === 'assistant') {
      const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
      return {
        role: 'assistant',
        content,
      }
    }

    if ('role' in msg && msg.role === 'tool') {
      const toolMsg = msg as any
      return {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: toolMsg.call_id || toolMsg.tool_call_id,
            toolName: toolMsg.name || 'unknown',
            result: JSON.stringify(toolMsg.output || toolMsg.content),
            isError: false,
          } as any,
        ],
      }
    }

    return {
      role: 'user',
      content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
    }
  })
}

/**
 * Convert Orion AI tools to AI SDK format
 */
export function convertToolsToAISDK(tools: Array<any>): Record<string, any> {
  const coreTools: Record<string, any> = {}

  for (const tool of tools) {
    const toolJson = tool.toJSON()

    let parameters
    if ('function' in toolJson && toolJson.function) {
      parameters = toolJson.function.parameters
    } else if ('parameters' in toolJson) {
      parameters = toolJson.parameters
    } else if ('input_schema' in toolJson) {
      parameters = toolJson.input_schema
    } else {
      parameters = tool.schema
    }

    coreTools[tool.name] = {
      description: tool.description || (toolJson as any).description,
      parameters,
      execute: async (args: any) => await tool.run(args),
    }
  }

  return coreTools
}
