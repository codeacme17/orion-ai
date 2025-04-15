import { DEV_LOGGER } from '@/lib/logger'
import { assistantMessage, UserMessage, userMessage } from '@/messages'
import { mcpStdioTools } from '@/tools'
import { describe, expect, it } from 'vitest'
import { config as dotConfig } from 'dotenv'

describe('tool message', () => {
  dotConfig()

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

  it('should get github mcp tool list and run get_pull_request_comments', async () => {
    try {
      const tools = await mcpStdioTools(
        {
          toolNamePrefix: 'github',
          clientName: 'github-client',
          clientVersion: '1.0.0',
          verbose: true,
        },
        {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-github'],
          env: {
            GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_TOKEN || '',
            PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin',
          },
        },
      )

      console.log('tools', tools)
      expect(tools).toBeDefined()

      const getPullRequestFilesTool = tools.find(
        (tool) => tool.name === 'github_get_pull_request_files',
      )

      console.log('getPullRequestCommentsTool', getPullRequestFilesTool?.toJSON())

      expect(getPullRequestFilesTool).toBeDefined()

      const response = await getPullRequestFilesTool?.run({
        owner: 'codeacme17',
        repo: 'orion-ai',
        pull_number: 1,
      })
      console.log('response', response)
      expect(response).toBeDefined()
    } catch (error) {
      console.error('Error in Github MCP test:', error)
      throw error
    }
  })

  it('should run mcp tool `echo`', async () => {
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
