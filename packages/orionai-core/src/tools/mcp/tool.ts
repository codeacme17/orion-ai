import { z } from 'zod'
import { BaseTool } from '../base'
import { MCPClient } from './client'
import type { IMCPClientOptions, IMCPTool } from './types'

export class MCPTool extends BaseTool {
  private client: MCPClient
  mcpName: string

  constructor(tool: IMCPTool, client: MCPClient) {
    super({
      name: tool.name,
      description: tool.description || '',
      schema: z.object(tool.inputSchema),
    })
    this.client = client
    this.mcpName = tool.name
  }

  async run(args: any): Promise<string> {
    const result = await this.client.callTool({
      name: this.mcpName,
      arguments: args,
    })
    return JSON.stringify(result.result)
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
    return this.toJSON()
  }
}

export async function createMCPTools(options: IMCPClientOptions = {}): Promise<MCPTool[]> {
  const client = new MCPClient(options)
  await client.connect()
  const tools = await client.listTools()
  return tools.tools.map((tool) => new MCPTool(tool, client))
}
