import { assistantMessage, SystemMessage, toolMessage, type TMessage } from '@/messages'
import { BaseAgent, type BaseAgentFields } from './base'
import { DEV_LOGGER } from '@/lib/logger'
import type { BaseModel, TModel } from '@/models'
import type {
  IToolCallChatCompletionResult,
  ITollCallResponsesApiResult,
  IToolCallResult,
} from '@/models/base'
import type { ResponseStreamEvent } from 'openai/resources/responses/responses.mjs'

export interface IAssistantAgentFields extends BaseAgentFields {
  /**
   * The system message that the assistant will respond with.
   */
  systemMessage: string
}

export class AssistantAgent extends BaseAgent {
  /**
   * The system message that the assistant will respond with.
   * This message is updated as the conversation progresses.
   */
  public systemMessage: string

  /**
   * The model that the assistant will use to generate responses.
   */
  readonly model: TModel

  private debug: boolean

  constructor(fields: IAssistantAgentFields) {
    const { systemMessage, model, debug, stream } = fields

    super(fields)

    this.name = 'ASSISTANT_AGENT'
    this.systemMessage = systemMessage
    this.model = model
    this.debug = debug || false
    this.stream = stream || false
  }

  async invoke(messages: Array<TMessage>): Promise<string> {
    try {
      const combinedMessages = [
        new SystemMessage(this.systemMessage),
        ...messages,
      ] as Array<TMessage>

      this.debug && DEV_LOGGER.INFO('AssistantAgent.invoke: messages \n', combinedMessages)

      const result = await (this.model as BaseModel).create({
        messages: combinedMessages,
        tools: this.tools,
        debug: this.debug,
        stream: this.stream,
      })

      const toolAssistantMessage = assistantMessage({
        content: result.content,
        tool_calls: result.tool_calls,
      })

      // If the result is an assistant message and there are tool calls, run the tools
      if (result.tool_calls && result.tool_calls.length > 0) {
        const toolCalls = result.tool_calls
        const toolResults = []

        // Run each tool call
        for (const tool of toolCalls) {
          this.debug && DEV_LOGGER.INFO(`AssistantAgent.invoke: Running tool \n`, tool)

          const toolName =
            this.model.apiType === 'chat_completion'
              ? (tool as IToolCallChatCompletionResult).function.name
              : (tool as ITollCallResponsesApiResult).name
          const toolArgs = JSON.parse(
            this.model.apiType === 'chat_completion'
              ? (tool as IToolCallChatCompletionResult).function.arguments
              : (tool as ITollCallResponsesApiResult).arguments,
          )
          const toolFn = this.tools?.find((t) => t.name === toolName)

          // If the tool is found, run it
          if (toolFn) {
            const toolResult = await toolFn.run(toolArgs)

            // Add the tool result to the toolResults array
            toolResults.push(
              toolMessage({
                output: toolResult,
                call_id: 'call_id' in tool ? tool.call_id : tool.id,
                apiType: this.model.apiType,
              }).get(),
            )
          }
        }

        // Combine the messages and tool results
        const newMessages = [
          ...combinedMessages,
          ...(this.model.apiType === 'chat_completion'
            ? [toolAssistantMessage]
            : result.tool_calls),
          ...toolResults,
        ] as Array<TMessage>

        const finalResult = await (this.model as BaseModel).create({
          messages: newMessages,
        })

        this.debug && DEV_LOGGER.INFO('AssistantAgent.invoke: final response \n', finalResult)

        return finalResult.content
      }

      return typeof result === 'string' ? result : result.content
    } catch (error) {
      DEV_LOGGER.ERROR(`AssistantAgent.invoke: ${error}`)
      throw error
    }
  }

  async *invokeStream(messages: Array<TMessage>): AsyncGenerator<any, void, unknown> {
    try {
      const combinedMessages = [
        new SystemMessage(this.systemMessage),
        ...messages,
      ] as Array<TMessage>

      this.debug && DEV_LOGGER.INFO('AssistantAgent.streamInvoke: messages \n', combinedMessages)

      const stream = await (this.model as BaseModel).createStream({
        messages: combinedMessages,
        tools: this.tools,
      })

      let accumulatedContent = ''
      let toolCalls: Array<IToolCallResult> = []
      let currentToolIndex: number = 0

      for await (const chunk of stream) {
        const parsedChunk = this.parseChunk(chunk)

        if (parsedChunk && parsedChunk.type === 'invoke.text.content') {
          accumulatedContent += parsedChunk.content
          yield parsedChunk
        }

        if (parsedChunk && parsedChunk.type === 'invoke.text.done') {
          yield parsedChunk
        }

        if (parsedChunk && parsedChunk.type === 'invoke.tool.added') {
          toolCalls.push(parsedChunk.tool_call)
          console.log('[tool_calls]', toolCalls)
          currentToolIndex = parsedChunk.tool_index
        }

        if (parsedChunk && parsedChunk.type === 'invoke.tool.arguments') {
          if (this.model.apiType === 'chat_completion') {
            ;(toolCalls[currentToolIndex] as IToolCallChatCompletionResult).function.arguments +=
              parsedChunk.content
          } else {
            ;(toolCalls[currentToolIndex] as ITollCallResponsesApiResult).arguments +=
              parsedChunk.content
          }
          yield { ...parsedChunk, tool_calls: toolCalls }
        }

        if (parsedChunk && parsedChunk.type === 'invoke.tool.done') {
          yield parsedChunk
        }
      }

      // console.log('[tool_calls]', toolCalls)

      // If there are tool calls, run them and get the final response
      if (toolCalls.length > 0) {
        const toolResults = []
        const toolAssistantMessage = assistantMessage({
          content: accumulatedContent,
          tool_calls: toolCalls,
        })

        // Run each tool call
        for (const tool of toolCalls) {
          this.debug && DEV_LOGGER.INFO(`AssistantAgent.streamInvoke: Running tool \n`, tool)

          const toolName =
            this.model.apiType === 'chat_completion'
              ? (tool as IToolCallChatCompletionResult).function.name
              : (tool as ITollCallResponsesApiResult).name
          const toolArgs = JSON.parse(
            this.model.apiType === 'chat_completion'
              ? (tool as IToolCallChatCompletionResult).function.arguments
              : (tool as ITollCallResponsesApiResult).arguments,
          )
          const toolFn = this.tools?.find((t) => t.name === toolName)

          if (toolFn) {
            const toolResult = await toolFn.run(toolArgs)
            toolResults.push(
              toolMessage({
                output: toolResult,
                call_id: 'call_id' in tool ? tool.call_id : tool.id,
                apiType: this.model.apiType,
              }).get(),
            )
          }
        }

        // Get the final response after tool execution
        const newMessages = [
          ...combinedMessages,
          ...(this.model.apiType === 'chat_completion' ? [toolAssistantMessage] : toolCalls),
          ...toolResults,
        ] as Array<TMessage>

        const finalStream = await (this.model as BaseModel).createStream({
          messages: newMessages,
          tools: this.tools,
        })

        for await (const chunk of finalStream) {
          yield chunk
        }
      }
    } catch (error) {
      DEV_LOGGER.ERROR(`AssistantAgent.streamInvoke: ${error}`)
      throw error
    }
  }

  parseChunk(chunk: ResponseStreamEvent): any {
    console.log('chunk ========== \n', JSON.stringify(chunk, null, 2), '\n ========== \n')

    if (this.model.apiType === 'response') {
      if (chunk.type === 'response.output_text.delta') {
        return {
          type: 'invoke.text.content',
          content: chunk.delta,
        }
      }

      if (chunk.type === 'response.output_text.done') {
        return {
          type: 'invoke.text.done',
          content: chunk.text,
        }
      }

      if (chunk.type === 'response.function_call_arguments.delta') {
        return {
          type: 'invoke.tool.arguments',
          content: chunk.delta,
        }
      }

      if (chunk.type === 'response.function_call_arguments.done') {
        return {
          type: 'invoke.tool.done',
          content: chunk.arguments,
        }
      }

      if (chunk.type === 'response.output_item.added') {
        if (chunk.item.type === 'function_call') {
          return {
            type: 'invoke.tool.added',
            tool_index: chunk.output_index,
            tool_call: chunk.item,
          }
        }
      }

      if (chunk.type === 'response.completed') {
        return {
          type: 'invoke.text.done',
          content: chunk.response.output,
          useage: chunk.response.usage,
        }
      }
    }

    if (this.model.apiType === 'chat_completion') {
      console.log('chunk chat_completion', chunk)
    }
  }

  updateSystemMessage(message: string): void {
    this.systemMessage = message
  }
}

export const assistantAgent = (fields: IAssistantAgentFields) => new AssistantAgent(fields)
