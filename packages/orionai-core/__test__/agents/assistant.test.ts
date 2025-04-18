import { z } from 'zod'
import { configDotenv } from 'dotenv'
import { beforeEach, describe, expect, it } from 'vitest'

import { AssistantAgent } from '@/agents'
import { userMessage } from '@/messages'
import { deepseekModel, openaiModel } from '@/models'
import { functionTool } from '@/tools/function'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { mcpSseTools, mcpStdioTools } from '@/tools'

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
    const sseTools = await mcpSseTools(
      {
        clientInfo: {
          toolNamePrefix: 'dsp',
          name: 'example-dsp',
          version: '1.0.0',
          verbose: true,
        },
      },
      {
        url: 'http://localhost:3000/sse',
      },
    )

    const fecthTools = await mcpStdioTools(
      {
        toolNamePrefix: 'fecth',
        clientName: 'example-fecth',
        clientVersion: '1.0.0',
      },
      {
        command: 'uvx',
        args: ['mcp-server-fetch'],
      },
    )

    const tools = [...sseTools, ...fecthTools]

    const agent = new AssistantAgent({
      name: 'assistant',
      systemMessage: 'you are an useful assistant, you can use tools',
      model: deepseekModel(),
      debug: true,
      tools,
    })

    const result = await agent.invoke([
      userMessage(
        'please give me the web content of https://alidocs.dingtalk.com/i/nodes/mExel2BLV59rgdDPiewzwOLwVgk9rpMq?corpId=dingd8e1123006514592&sideCollapsed=true&iframeQuery=utm_source%253Dportal%2526utm_medium%253Dportal_new_tab_open&utm_scene=team_space',
      ),
    ])

    expect(result).toBeDefined()
  })

  it('should stream the response without tools', async () => {
    try {
      const agent = new AssistantAgent({
        name: 'assistant',
        systemMessage: 'you are a helpful assistant',
        model: openaiModel({
          httpAgent: proxy,
          model: 'gpt-4o-mini',
        }),
        stream: true,
      })

      let response = ''
      const stream = agent.streamInvoke([userMessage('Hello, how are you?')])
      for await (const chunk of stream) {
        response += chunk
        console.log(chunk)
      }
      expect(response).toBeDefined()
      expect(response.length).toBeGreaterThan(0)
    } catch (error) {
      console.log(error)
    }
  })

  it('should stream the response with tools', async () => {
    const agent = new AssistantAgent({
      name: 'assistant',
      systemMessage: 'you are a helpful assistant that can use tools',
      model: openaiModel({
        httpAgent: proxy,
        model: 'gpt-4o-mini',
      }),
      debug: true,
      stream: true,
      tools: [
        functionTool({
          name: 'get_weather',
          description: 'Get the current weather for a location',
          schema: z.object({
            location: z.string().describe('The city and state, e.g. San Francisco, CA'),
          }),
          execute: async (args) => {
            return `The weather in ${args.location} is sunny and 72°F`
          },
        }),
      ],
    })

    let response = ''
    for await (const chunk of agent.streamInvoke([
      userMessage('What is the weather like in San Francisco?'),
    ])) {
      response += chunk
    }

    expect(response).toBeDefined()
    expect(response.length).toBeGreaterThan(0)
    expect(response).toContain('San Francisco')
  })

  it('should handle streaming errors gracefully', async () => {
    const agent = new AssistantAgent({
      name: 'assistant',
      systemMessage: 'you are a helpful assistant',
      model: openaiModel({
        httpAgent: proxy,
        model: 'gpt-4o-mini',
      }),
      debug: true,
      stream: true,
    })

    await expect(async () => {
      for await (const _ of agent.streamInvoke([userMessage('')])) {
        // This should throw an error due to empty message
      }
    }).rejects.toThrow()
  })
})
