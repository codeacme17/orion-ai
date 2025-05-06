import type { Client, ClientOptions } from '@modelcontextprotocol/sdk/client/index.js'
import type {
  SSEClientTransport,
  SSEClientTransportOptions,
} from '@modelcontextprotocol/sdk/client/sse.js'
import type { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import type { Implementation } from '@modelcontextprotocol/sdk/types.js'

export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue }

export interface IMCPClientOptions {
  /**
   * The prefix to add to the tool name
   */
  toolNamePrefix?: string
  /**
   * The name of the client
   */
  clientName?: string
  /**
   * The version of the client
   */
  clientVersion?: string
  /**
   * Whether to log verbose output
   */
  verbose?: boolean
}

export interface IMCPToolInput {
  [key: string]: unknown
}

export interface IMCPTool {
  name: string
  description?: string
  inputSchema: Record<string, any>
}

export interface IMCPToolCall {
  [key: string]: unknown
  name: string
  arguments: Record<string, unknown>
}

export interface IMCPToolList {
  tools: IMCPTool[]
}

export interface IMCPImplementation {
  /**
   * The client is MCP sdk client
   */
  readonly client: Client
  /**
   * The transport is the transport to use for the client
   */
  readonly transport: StdioClientTransport | SSEClientTransport
  /**
   * Whether to log verbose output
   */
  readonly debug?: boolean | undefined
  /**
   * The prefix to add to the tool name
   */
  readonly toolNamePrefix?: string | undefined

  /**
   * Connect to the client
   */
  connect(): Promise<void>
  /**
   * List the tools
   */
  listTools(): Promise<IMCPTool[]>
  /**
   * Call a tool
   */
  callTool(tool: IMCPToolCall): Promise<JSONValue>
  /**
   * Close the client
   */
  close(): Promise<void>
}

export interface IMCPSseClientOptions {
  clientInfo: Implementation & {
    verbose?: boolean
    toolNamePrefix?: string
  }
  options?: ClientOptions
}

export interface IMCPSseTransportOptions {
  url: string
  options?: SSEClientTransportOptions
}
