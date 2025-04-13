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
  name: string
  arguments: Record<string, unknown>
}

export interface IMCPToolList {
  tools: IMCPTool[]
}
