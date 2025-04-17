import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import type {
  IMCPImplementation,
  IMCPSseClientOptions,
  IMCPSseTransportOptions,
  JSONValue,
  IMCPToolCall,
  IMCPTool,
} from './types'
import { DEV_LOGGER } from '@/lib/logger'

export class MCPSseClient implements IMCPImplementation {
  readonly client: Client
  readonly transport: SSEClientTransport
  readonly debug?: boolean
  readonly toolNamePrefix?: string

  constructor(clientOptions: IMCPSseClientOptions, transportOptions: IMCPSseTransportOptions) {
    this.toolNamePrefix = clientOptions.clientInfo.toolNamePrefix ?? ''
    this.client = new Client(clientOptions.clientInfo, clientOptions.options)
    this.transport = new SSEClientTransport(new URL(transportOptions.url), transportOptions.options)
    this.debug = clientOptions.clientInfo?.verbose
  }

  public async connect(): Promise<void> {
    try {
      this.debug && DEV_LOGGER.INFO('🔄 Connecting to MCP server...')
      await this.client.connect(this.transport)
      this.debug && DEV_LOGGER.SUCCESS('🎉 Connected to MCP server')
    } catch (error) {
      this.debug && DEV_LOGGER.ERROR('❌ Error connecting to MCP server:', error)
      throw error
    }
  }

  public async listTools(): Promise<IMCPTool[]> {
    try {
      const tools = await this.client.listTools()
      return tools.tools.map((tool) => ({
        name: this.toolNamePrefix ? `${this.toolNamePrefix}_${tool.name}` : tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      }))
    } catch (error) {
      this.debug && DEV_LOGGER.ERROR('❌ Error listing tools:', error)
      throw error
    }
  }

  public async callTool(tool: IMCPToolCall): Promise<JSONValue> {
    const result = await this.client.callTool({
      name: this.toolNamePrefix ? tool.name.split(`${this.toolNamePrefix}_`)[1] : tool.name,
      arguments: tool.arguments,
    })

    return result as JSONValue
  }

  public async close(): Promise<void> {
    await this.client.close()
  }
}
