import type { CoreMessage } from 'ai'
import type { TMessage } from '@/messages'
import type { TTool } from '@/tools'
import type { IToolCallResult } from './base'

/**
 * Convert our TMessage format to AI SDK's CoreMessage format
 * @param messages Array of our custom messages
 * @returns Array of AI SDK messages
 */
export function convertMessagesToAISDK(messages: Array<TMessage>): Array<CoreMessage> {
  return messages.map((msg): CoreMessage => {
    // Handle system messages
    if ('role' in msg && msg.role === 'system') {
      return {
        role: 'system',
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
      }
    }

    // Handle user messages
    if ('role' in msg && msg.role === 'user') {
      return {
        role: 'user',
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
      }
    }

    // Handle assistant messages
    if ('role' in msg && msg.role === 'assistant') {
      const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)

      // Just return text content - AI SDK handles tool calls internally
      return {
        role: 'assistant',
        content,
      }
    }

    // Handle tool messages (tool results)
    // Note: AI SDK handles tool execution internally when tools are provided
    // This is mainly for backwards compatibility
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

    // Fallback for unknown message types
    return {
      role: 'user',
      content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
    }
  })
}

/**
 * Convert our TTool format to AI SDK's tool format
 * @param tools Array of our custom tools
 * @returns Record of AI SDK tools
 */
export function convertToolsToAISDK(tools: Array<TTool>): Record<string, any> {
  const coreTools: Record<string, any> = {}

  for (const tool of tools) {
    const toolJson = tool.toJSON()

    // Extract parameters - handle both OpenAI and Anthropic formats
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
      execute: async (args: any) => {
        // Call our tool's run method
        return await tool.run(args)
      },
    }
  }

  return coreTools
}

/**
 * Convert AI SDK tool calls to our IToolCallResult format
 * @param toolCalls AI SDK tool calls
 * @returns Array of our tool call results
 */
export function convertToolCallsFromAISDK(toolCalls: any[]): Array<IToolCallResult> {
  return toolCalls.map((tc) => ({
    id: tc.toolCallId,
    type: 'function' as const,
    name: tc.toolName,
    arguments: JSON.stringify(tc.args),
  }))
}
