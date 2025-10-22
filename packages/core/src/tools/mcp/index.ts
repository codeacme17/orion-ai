import type { StdioServerParameters } from '@modelcontextprotocol/sdk/client/stdio.js'
import type {
  IMCPSseClientOptions,
  IMCPSseTransportOptions,
  IMCPStreamableHttpClientOptions,
  IMCPClientOptions,
  IMCPStreamableHttpTransportOptions,
} from './types'
import { MCPTool } from './tool'
import { MCPStreamableHttpClient } from './streamable-http-client'
import { MCPStdioClient } from './stdio-client'
import { MCPSseClient } from './sse-client'

export * from './types'
export * from './stdio-client'
export * from './sse-client'
export * from './streamable-http-client'
export * from './tool'

export async function mcpStdioTools(
  options: IMCPClientOptions,
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

export async function mcpStreamableHttpClientTools(
  options: IMCPStreamableHttpClientOptions,
  transportOptions: IMCPStreamableHttpTransportOptions,
): Promise<MCPTool[]> {
  const client = new MCPStreamableHttpClient(options, transportOptions)
  await client.connect()
  const tools = await client.listTools()
  return tools.map((tool) => new MCPTool(tool, client))
}
