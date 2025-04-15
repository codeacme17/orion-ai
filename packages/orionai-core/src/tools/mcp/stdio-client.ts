import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import {
  StdioClientTransport,
  type StdioServerParameters,
} from '@modelcontextprotocol/sdk/client/stdio.js'
import { DEV_LOGGER } from '@/lib/logger'
import type { IMCPClientOptions, IMCPTool, IMCPToolCall, JSONValue } from './types'

export class MCPStdioClient {
  private client: Client
  private transport: StdioClientTransport
  private debug: boolean
  private toolNamePrefix?: string

  constructor(options: IMCPClientOptions = {}, transportOptions: StdioServerParameters) {
    this.debug = options.verbose ?? false
    this.toolNamePrefix = options.toolNamePrefix

    this.client = new Client({
      name: options.clientName ?? 'orionai-mcp-client',
      version: options.clientVersion ?? '1.0.0',
    })

    this.transport = new StdioClientTransport(transportOptions)
  }

  async connect(): Promise<void> {
    this.debug && DEV_LOGGER.INFO('Connecting to MCP server...')

    await this.client.connect(this.transport)
  }

  async listTools(): Promise<IMCPTool[]> {
    const tools = await this.client.listTools()

    return tools.tools.map((tool: IMCPTool) => ({
      name: this.toolNamePrefix ? `${this.toolNamePrefix}_${tool.name}` : tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }))
  }

  async callTool(tool: IMCPToolCall): Promise<JSONValue> {
    this.debug && DEV_LOGGER.INFO('Calling tool:', tool.name, 'with arguments:', tool.arguments)

    const result = await this.client.callTool({
      name: this.toolNamePrefix ? tool.name.split(`${this.toolNamePrefix}_`)[1] : tool.name,
      arguments: tool.arguments,
    })

    this.debug && DEV_LOGGER.INFO('Tool result:', result)

    return result as JSONValue
  }

  async close(): Promise<void> {
    await this.client.close()
    this.transport.close()
  }
}
