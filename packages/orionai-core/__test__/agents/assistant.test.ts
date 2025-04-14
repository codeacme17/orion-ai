import { z } from 'zod'
import { configDotenv } from 'dotenv'
import { beforeEach, describe, expect, it } from 'vitest'

import { AssistantAgent } from '@/agents'
import { userMessage } from '@/messages'
import { deepseekModel, openaiModel } from '@/models'
import { functionTool } from '@/tools/function'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { mcpTool } from '@/tools'

describe('assistant agent', () => {
  let proxy: HttpsProxyAgent<string> | null = null

  beforeEach(() => {
    configDotenv()
    proxy = new HttpsProxyAgent(process.env.HTTPS_PROXY || '')
  })

  it('should generate an assistant agent', async () => {
    configDotenv()

    const agent = new AssistantAgent({
      name: 'assistant',
      systemMessage: 'hello',
      model: deepseekModel(),
    })

    expect(agent).toBeDefined()
  })

  it('should update the system message', async () => {
    configDotenv()

    const agent = new AssistantAgent({
      name: 'assistant',
      systemMessage: 'hello',
      model: deepseekModel(),
    })

    agent.updateSystemMessage('world')

    expect(agent.systemMessage).toBe('world')
  })

  it('should invoke the assistant agent (openai)', async () => {
    configDotenv()

    const agent = new AssistantAgent({
      name: 'assistant',
      systemMessage: 'your name is bob',
      model: openaiModel({
        httpAgent: proxy,
        model: 'gpt-4o-mini',
      }),
      debug: true,
    })

    const result = await agent.invoke([userMessage('hello, what is your name?')])

    expect(result).toBeDefined()
  })

  it('should invoke the assistant agent (deepseek)', async () => {
    configDotenv()

    const agent = new AssistantAgent({
      name: 'assistant',
      systemMessage: 'your name is bob',
      model: deepseekModel(),
    })

    const result = await agent.invoke([userMessage('hello, what is your name?')])

    console.log('result', result)
    expect(result).toBeDefined()
  })

  it('should use tool and give the result', async () => {
    const agent = new AssistantAgent({
      name: 'assistant',
      systemMessage: 'you are an useful assistant, you can use tools',
      model: openaiModel({
        httpAgent: proxy,
      }),
      // model: deepseekModel(),
      debug: true,
      tools: [
        functionTool({
          name: 'location_weather',
          description: 'this tool can get the weather of a location',
          schema: z.object({
            location: z.string().describe('the location to get the weather'),
          }),
          execute: async (args) => {
            return `thie weather in ${args.location} windy`
          },
        }),
        functionTool({
          name: 'location_time',
          description: 'this tool can get the time of a location',
          schema: z.object({
            location: z.string().describe('the location to get the time'),
          }),
          execute: async (args) => {
            return `the time in ${args.location} 12:00`
          },
        }),
      ],
    })

    const result = await agent.invoke([
      userMessage('can you give me the weather in beijing? and the time?'),
    ])

    expect(result).toBeDefined()
  })

  it('should invoke MCP agent', async () => {
    const tools = await mcpTool(
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

    const agent = new AssistantAgent({
      name: 'assistant',
      systemMessage: 'you are an useful assistant, you can use tools',
      // model: openaiModel({
      //   httpAgent: proxy,
      // }),
      model: deepseekModel(),
      debug: true,
      tools,
    })

    const result = await agent.invoke([userMessage('use echo tool to echo "hello"')])

    expect(result).toBeDefined()
  })
})
