import { assistantAgent, deepseekModel } from '@orion-ai/core'

const agent = assistantAgent({
  name: 'assistant',
  systemMessage: 'You are a helpful assistant.',
  model: deepseekModel({
    apiKey: process.env.OPENAI_API_KEY,
  }),
})

agent.invoke([
  {
    role: 'user',
    content: 'What is the capital of the moon?',
  },
])
