import { z } from 'zod'
import { BaseTool } from '../base'
import { MCPStdioClient } from './stdio-client'
import { MCPSseClient } from './sse-client'
import type {
  IMCPSseClientOptions,
  IMCPSseTransportOptions,
  IMCPClientOptions as IMCPStdioClientOptions,
  IMCPTool,
} from './types'
import type { StdioServerParameters } from '@modelcontextprotocol/sdk/client/stdio.js'
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js'
import type { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { DEV_LOGGER } from '@/lib/logger'

export class MCPTool extends BaseTool {
  private _client: MCPStdioClient | MCPSseClient
  mcpName: string

  constructor(tool: IMCPTool, client: MCPStdioClient | MCPSseClient) {
    super({
      name: tool.name,
      description: tool.description || '',
      schema: tool.inputSchema as z.ZodObject<any, any, any, any>,
    })

    this._client = client
    this.mcpName = tool.name
  }

  async run(args: any = {}): Promise<string> {
    const result = await this._client.callTool({
      name: this.mcpName,
      arguments: args,
    })
    return JSON.stringify(result)
  }

  async close(): Promise<void> {
    await this._client.close()
  }

  getClient(): Client {
    if (!this._client.client) {
      throw DEV_LOGGER.ERROR('Client is not initialized')
    }
    return this._client.client
  }

  toJSON() {
    return {
      type: 'function',
      function: {
        name: this.name,
        description: this.description,
        parameters: this.schema,
      },
    }
  }

  toResponseJson() {
    return {
      type: 'function',
      name: this.name,
      description: this.description,
      parameters: this.schema,
    }
  }
}

export async function mcpStdioTools(
  options: IMCPStdioClientOptions,
  transportOptions: StdioServerParameters,
): Promise<MCPTool[]> {
  const client = new MCPStdioClient(options, transportOptions)
  await client.connect()
  const tools = await client.listTools()
  return tools.map((tool) => new MCPTool(tool, client))
}

export async function mcpSseTools(
  options: IMCPSseClientOptions,
  transportOptions: IMCPSseTransportOptions,
): Promise<MCPTool[]> {
  const client = new MCPSseClient(options, transportOptions)
  await client.connect()
  const tools = await client.listTools()
  return tools.map((tool) => new MCPTool(tool, client))
}
