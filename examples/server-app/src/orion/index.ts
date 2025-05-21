import { assistantAgent, deepseekModel } from '@orion-ai/core'

export const createAgent = async () => {
  // const mcpTools = await mcpStdioTools(
  //   {
  //     toolNamePrefix: 'fecth',
  //     clientName: 'example-fecth',
  //     clientVersion: '1.0.0',
  //   },
  //   {
  //     command: 'npx',
  //     args: ['@browsermcp/mcp@latest'],
  //   },
  // )

  // const tools = [...mcpTools]

  const agent = assistantAgent({
    name: 'My Assistant',
    systemMessage: 'My Assistant is a helpful assistant',
    model: deepseekModel({
      apiKey: process.env.DEEPSEEK_API_KEY,
    }),
    // tools: tools,
  })

  return agent
}
