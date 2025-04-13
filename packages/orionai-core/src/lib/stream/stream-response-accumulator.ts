import { DEV_LOGGER } from '@/lib/logger'
import type { IBaseCreateResponse, IToolCallResult } from '@/models/base'
import type { ChatCompletionChunk } from 'openai/resources/chat/completions.mjs'

/**
 * A helper class for accumulating the result of a stream response
 * Processes chunks from a stream and builds a complete response
 */
export class StreamResponseAccumulator {
  private content: string = ''
  private finish_reason: string = ''
  private tool_calls: Array<IToolCallResult> = []
  private thought: string = ''
  private debug: boolean

  constructor(debug: boolean = false) {
    this.debug = debug
  }

  /**
   * Process a chunk from the stream and accumulate its data
   * @param chunk The chunk to process
   */
  processChunk(chunk: ChatCompletionChunk): void {
    const delta = chunk.choices[0]?.delta

    if (!delta) return

    if (delta.content) {
      this.content += delta.content
    }

    if (chunk.choices[0]?.finish_reason) {
      this.finish_reason = chunk.choices[0].finish_reason
    }

    if (delta.tool_calls) {
      this.processToolCalls(delta.tool_calls)
    }

    // Handle the thinking content (deepseek-reasoner feature)
    if ((delta as any).reasoning_content) {
      this.thought += (delta as any).reasoning_content
    }

    if (this.debug) {
      DEV_LOGGER.INFO('Processed chunk', {
        content: delta.content,
        tool_calls: delta.tool_calls?.length,
        reasoning: (delta as any).reasoning_content,
      })
    }
  }

  /**
   * Process tool calls from a chunk
   * @param toolCalls The tool calls to process
   */
  private processToolCalls(toolCalls: any[]): void {
    if (!toolCalls.length) return

    if (!this.tool_calls.length) {
      // The first tool call block
      this.tool_calls = toolCalls.map((tc) => ({
        id: tc.id || '',
        index: tc.index || 0,
        type: 'function',
        function: {
          name: tc.function?.name || '',
          arguments: tc.function?.arguments || '',
        },
      }))
    } else {
      // Update existing tool calls
      toolCalls.forEach((tc) => {
        const existingTc = this.tool_calls.find((t) => t.id === tc.id)
        if (existingTc && tc.function) {
          existingTc.function.arguments += tc.function.arguments || ''
        }
      })
    }
  }

  /**
   * Get the accumulated result as a BaseCreateResponse
   * @returns The complete response
   */
  getResult(): IBaseCreateResponse {
    return {
      content: this.content,
      finish_reason: this.finish_reason,
      tool_calls: this.tool_calls,
      thought: this.thought,
      usage: {}, // Stream responses can't get token usage information
    }
  }
}
