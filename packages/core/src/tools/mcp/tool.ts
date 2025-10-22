import { z } from 'zod'
import { BaseTool } from '../base'
import { MCPStdioClient } from './stdio-client'
import { MCPSseClient } from './sse-client'
import { MCPStreamableHttpClient } from './streamable-http-client'
import { DEV_LOGGER } from '@/lib/logger'

import type { IMCPTool } from './types'
import type { Client } from '@modelcontextprotocol/sdk/client/index.js'

export class MCPTool extends BaseTool {
  private _client: MCPStdioClient | MCPSseClient | MCPStreamableHttpClient
  mcpName: string

  constructor(tool: IMCPTool, client: MCPStdioClient | MCPSseClient | MCPStreamableHttpClient) {
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
