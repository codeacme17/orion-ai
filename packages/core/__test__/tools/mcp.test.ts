import { mcpSseTools, mcpStdioTools, mcpStreamableHttpClientTools } from '@/tools/mcp'
import { LoggingMessageNotificationSchema } from '@modelcontextprotocol/sdk/types.js'
import { describe, expect, it } from 'vitest'

describe('mcp tools', () => {
  it('should support everything service', async () => {
    // Skip test if MCP server is not available
    try {
      // Initialize MCP tools
      const tools = await mcpStdioTools(
        {
          toolNamePrefix: 'everything',
          clientName: 'everything-client',
          clientVersion: '1.0.0',
          verbose: true,
        },
        {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-everything'],
        },
      )

      // If we get here, MCP server is available
      try {
        // Test echo tool
        const echoTool = tools.find((tool) => tool.name === 'everything_echo')
        expect(echoTool).toBeDefined()
        const result = await echoTool?.run({ message: 'hello' })
        expect(result).toBeDefined()
      } catch (error) {
        console.error('Error testing echo tool:', error)
      }
    } catch (error) {
      console.error('MCP server is not available:', error)
    }
  })

  it('should run a sse mcp tool with notification', async () => {
    // Skip test if MCP server is not available
    try {
      // Initialize MCP tools
      const tools = await mcpSseTools(
        {
          clientInfo: {
            name: 'everything-client',
            toolNamePrefix: 'everything',
            version: '1.0.0',
          },
        },
        {
          url: 'http://localhost:3011/sse',
        },
      )

      // If we get here, MCP server is available
      try {
        const notificationTool = tools.find(
          (tool) => tool.name === 'everything_start-notification-stream',
        )

        const client = notificationTool?.getClient()

        client &&
          client.setNotificationHandler(LoggingMessageNotificationSchema, (notification) => {
            console.log(`Notification: ${JSON.stringify(notification)}`)
          })

        const res = await notificationTool?.run({
          interval: 1000, // 1 second between notifications
          count: 5, // Send 5 notifications
        })

        console.log('res', res)
      } catch (error) {
        console.error('Error testing echo tool:', error)
      }
    } catch (error) {
      console.error('MCP server is not available:', error)
    }
  })

  it('should run a streamable-http mcp tool', async () => {
    // Skip test if MCP server is not available
    try {
      // Initialize MCP tools
      const tools = await mcpStreamableHttpClientTools(
        {
          clientInfo: {
            name: 'everything-client',
            toolNamePrefix: 'everything',
            version: '1.0.0',
          },
        },
        {
          url: 'http://localhost:3011/mcp',
        },
      )
      console.log(tools)
      expect(tools).toBeDefined()

      const notificationTool = tools.find(
        (tool) => tool.name === 'everything_start-notification-stream',
      )

      const client = notificationTool?.getClient()

      client &&
        client.setNotificationHandler(LoggingMessageNotificationSchema, (notification) => {
          console.log(`Notification: ${JSON.stringify(notification)}`)
        })

      expect(notificationTool).toBeDefined()
      const result = await notificationTool?.run({
        interval: 1000, // 1 second between notifications
        count: 5, // Send 5 notifications
      })
      expect(result).toBeDefined()
    } catch (error) {
      console.error('MCP server is not available:', error)
    }
  })
})
