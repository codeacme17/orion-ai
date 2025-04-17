import { AssistantAgent, deepseekModel } from '@orion-ai/core'

const agent = new AssistantAgent({
  name: 'assistant',
  systemMessage: 'You are a helpful assistant.',
  model: deepseekModel(),
})

agent.invoke([
  {
    role: 'user',
    content: 'What is the capital of the moon?',
  },
])
