import { z } from 'zod'
import { BaseTool } from '../base'
import { MCPStdioClient } from './client'
import type { IMCPClientOptions, IMCPTool } from './types'
import type { StdioServerParameters } from '@modelcontextprotocol/sdk/client/stdio.js'

export class MCPTool extends BaseTool {
  private client: MCPStdioClient
  mcpName: string

  constructor(tool: IMCPTool, client: MCPStdioClient) {
    super({
      name: tool.name,
      description: tool.description || '',
      schema: tool.inputSchema as z.ZodObject<any, any, any, any>,
    })

    this.client = client
    this.mcpName = tool.name
  }

  async run(args: any): Promise<string> {
    const result = await this.client.callTool({
      name: this.mcpName,
      arguments: args,
    })
    return JSON.stringify(result)
  }

  async close(): Promise<void> {
    await this.client.close()
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

export async function mcpStdioTool(
  options: IMCPClientOptions = {},
  transportOptions: StdioServerParameters,
): Promise<MCPTool[]> {
  const client = new MCPStdioClient(options, transportOptions)
  await client.connect()
  const tools = await client.listTools()
  return tools.map((tool) => new MCPTool(tool, client))
}
