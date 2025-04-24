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
import type { ChatCompletionChunk } from 'openai/resources.mjs'

enum EChunkType {
  INVOKE_TEXT_CONTENT = 'invoke.text.content',
  INVOKE_TEXT_DONE = 'invoke.text.done',
  INVOKE_TOOL_ADDED = 'invoke.tool.added',
  INVOKE_TOOL_ARGUMENTS = 'invoke.tool.arguments',
  INVOKE_TOOL_DONE = 'invoke.tool.done',
}

interface IChunk {
  type: EChunkType
  content?: string | Array<any> | null
  tool_index?: number
  tool_call?: IToolCallResult
  tool_calls?: Array<IToolCallResult> | undefined
  useage?: Record<string, any> | null
}

export interface IAssistantAgentFields extends BaseAgentFields {
  /**
   * The system message that the assistant will respond with.
   */
  systemMessage: string

  /**
   * The behavior of the assistant when using tools.
   */
  toolUseBehavior?: 'default' | 'stop_on_tool'
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

  /**
   * The behavior of the assistant when using tools.
   */
  toolUseBehavior: 'default' | 'stop_on_tool'

  private debug: boolean

  constructor(fields: IAssistantAgentFields) {
    const { systemMessage, model, debug, stream, toolUseBehavior } = fields

    super(fields)

    this.name = this.name ?? 'ASSISTANT_AGENT'
    this.systemMessage = systemMessage
    this.model = model
    this.debug = debug ?? false
    this.stream = stream ?? false
    this.toolUseBehavior = toolUseBehavior ?? 'default'
  }

  async invoke(messages: Array<TMessage>): Promise<string | Array<TMessage>> {
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
        const toolResults: Array<TMessage> = []

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

            this.debug &&
              DEV_LOGGER.SUCCESS(
                `AssistantAgent.invoke: tool results of ${toolFn.name}`,
                toolResult,
              )

            // Add the tool result to the toolResults array
            toolResults.push(
              toolMessage({
                output: toolResult,
                call_id: 'call_id' in tool ? tool.call_id : tool.id,
                apiType: this.model.apiType,
              }),
            )
          }
        }

        if (this.toolUseBehavior === 'stop_on_tool' && toolResults.length > 0) {
          return toolResults
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

        if (parsedChunk && parsedChunk.type === EChunkType.INVOKE_TEXT_CONTENT) {
          accumulatedContent += parsedChunk.content
          yield parsedChunk
        }

        if (parsedChunk && parsedChunk.type === EChunkType.INVOKE_TEXT_DONE) {
          yield parsedChunk
        }

        if (
          parsedChunk &&
          parsedChunk.type === EChunkType.INVOKE_TOOL_ADDED &&
          parsedChunk.tool_call
        ) {
          toolCalls.push(parsedChunk.tool_call)
          currentToolIndex = parsedChunk.tool_index ?? 0
        }

        if (parsedChunk && parsedChunk.type === EChunkType.INVOKE_TOOL_ARGUMENTS) {
          if (this.model.apiType === 'chat_completion') {
            ;(toolCalls[currentToolIndex] as IToolCallChatCompletionResult).function.arguments +=
              parsedChunk.content
          } else {
            ;(toolCalls[currentToolIndex] as ITollCallResponsesApiResult).arguments +=
              parsedChunk.content
          }
          yield { ...parsedChunk, tool_calls: toolCalls }
        }

        if (parsedChunk && parsedChunk.type === EChunkType.INVOKE_TOOL_DONE) {
          yield parsedChunk
        }
      }

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
              }),
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

  /**
   * Parse the chunk, to adapt to the different api types
   * @param chunk - The chunk to parse
   * @returns The parsed chunk
   */
  parseChunk(chunk: ResponseStreamEvent | ChatCompletionChunk): IChunk {
    /**
     * For response api, we need to handle the final response
     * @model openai
     */
    if (this.model.apiType === 'response' && 'type' in chunk) {
      if (chunk.type === 'response.output_text.delta') {
        return {
          type: EChunkType.INVOKE_TEXT_CONTENT,
          content: chunk.delta,
        }
      }

      if (chunk.type === 'response.output_text.done') {
        return {
          type: EChunkType.INVOKE_TEXT_DONE,
          content: chunk.text,
        }
      }

      if (chunk.type === 'response.function_call_arguments.delta') {
        return {
          type: EChunkType.INVOKE_TOOL_ARGUMENTS,
          content: chunk.delta,
        }
      }

      if (chunk.type === 'response.function_call_arguments.done') {
        return {
          type: EChunkType.INVOKE_TOOL_DONE,
          content: chunk.arguments,
        }
      }

      if (chunk.type === 'response.output_item.added') {
        if (chunk.item.type === 'function_call') {
          return {
            type: EChunkType.INVOKE_TOOL_ADDED,
            tool_index: chunk.output_index,
            tool_call: chunk.item as ITollCallResponsesApiResult,
          }
        }
      }

      if (chunk.type === 'response.completed') {
        return {
          type: EChunkType.INVOKE_TEXT_DONE,
          content: chunk.response.output,
          useage: chunk.response.usage,
        }
      }
    }

    /**
     * For chat completion api, we need to handle the final response
     * @model deepseek
     */
    if (this.model.apiType === 'chat_completion' && 'choices' in chunk) {
      console.log('chunk ========== \n', JSON.stringify(chunk, null, 2), '\n ========== \n')

      // Parse the text content
      if (chunk.choices[0].delta.content) {
        return {
          type: EChunkType.INVOKE_TEXT_CONTENT,
          content: chunk.choices[0].delta.content,
        }
      }

      // Parse the tool calls
      if (chunk.choices[0].delta.tool_calls) {
        return {
          type: EChunkType.INVOKE_TOOL_ARGUMENTS,
          tool_index: chunk.choices[0].delta.tool_calls[0].index,
          tool_call: chunk.choices[0].delta.tool_calls[0] as IToolCallChatCompletionResult,
        }
      }

      // When the model is done, we need to return the final response
      //  1. If the model is done because of tool calls, we need to return the tool calls
      //  2. If the model is done because of stop, we need to return the final response
      if (chunk.choices[0].finish_reason) {
        if (chunk.choices[0].finish_reason === 'tool_calls') {
          return {
            type: EChunkType.INVOKE_TOOL_DONE,
            content: chunk.choices[0].delta.content,
            useage: chunk.usage,
          }
        }

        if (chunk.choices[0].finish_reason === 'stop') {
          return {
            type: EChunkType.INVOKE_TEXT_DONE,
            content: chunk.choices[0].delta.content,
            useage: chunk.usage,
          }
        }
      }
    }

    return chunk as unknown as IChunk
  }

  updateSystemMessage(message: string): void {
    this.systemMessage = message
  }
}

export const assistantAgent = (fields: IAssistantAgentFields) => new AssistantAgent(fields)
