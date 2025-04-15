import { DEV_LOGGER } from '@/lib/logger'
import { assistantMessage, UserMessage, userMessage } from '@/messages'
import { mcpStdioTool } from '@/tools'
import { describe, expect, it } from 'vitest'

describe('tool message', () => {
  it('should create a user message', () => {
    const res = userMessage('hello')
    DEV_LOGGER.SUCCESS('user message', res.content)
    expect(res).instanceOf(UserMessage)
  })

  it('should create a image user message', () => {
    const res = userMessage({
      content: [
        {
          type: 'text',
          text: 'hello',
        },
        {
          type: 'image_url',
          image_url: 'https://www.google.com',
        },
      ],
    })
    DEV_LOGGER.SUCCESS('user message', res.content)
    expect(res).instanceOf(UserMessage)
  })

  it('should craete a assistant message', () => {
    const res = assistantMessage({
      content: 'hello',
    })
    DEV_LOGGER.SUCCESS('assistant message', res)
    expect(res).toBeDefined()
  })

  it('should support everything service', async () => {
    // Skip test if MCP server is not available
    try {
      // Initialize MCP tools
      const tools = await mcpStdioTool(
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
        console.log('tools =====', tools)
        const echoTool = tools.find((tool) => tool.name === 'everything_echo')
        expect(echoTool).toBeDefined()

        const echoResponse = await echoTool?.run({ message: 'Hello, MCP!' })
        console.log('echoResponse', echoResponse)
        expect(echoResponse).toBeDefined()
      } catch (error) {
        console.error('Error in Everything MCP test:', error)
        throw error
      } finally {
        await Promise.all(tools.map((tool) => tool.close()))
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('ENOENT')) {
        console.warn('MCP server is not available. Skipping test.')
        return
      }
      throw error
    }
  })

  it('should run mcp tool `echo`', async () => {
    const tools = await mcpStdioTool(
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
      const echoTool = tools.find((tool) => tool.name === 'everything_echo')
      const json = echoTool?.toJSON()
      console.log('json', json)
      expect(json).toBeDefined()
    } catch (error) {
      console.error('Error in Everything MCP test:', error)
      throw error
    } finally {
      await Promise.all(tools.map((tool) => tool.close()))
    }
  })
})
