# Orion AI Provider Packages

This directory contains provider-specific packages for Orion AI. Each package is a separate installable module that provides integration with a specific LLM provider using the Vercel AI SDK.

## Available Providers

### @orion-ai/openai

OpenAI provider package supporting GPT models.

**Installation:**
```bash
pnpm add @orion-ai/openai
```

**Usage:**
```typescript
import { createOpenAIModel } from '@orion-ai/openai'
import { assistantAgent } from '@orion-ai/core'

const model = createOpenAIModel({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o-mini', // or 'gpt-4o', 'gpt-4-turbo', etc.
})

const agent = assistantAgent({
  name: 'assistant',
  model,
  systemMessage: 'You are a helpful assistant',
})
```

### @orion-ai/anthropic

Anthropic provider package supporting Claude models.

**Installation:**
```bash
pnpm add @orion-ai/anthropic
```

**Usage:**
```typescript
import { createAnthropicModel } from '@orion-ai/anthropic'
import { assistantAgent } from '@orion-ai/core'

const model = createAnthropicModel({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-3-5-sonnet-20240620', // or other Claude models
})

const agent = assistantAgent({
  name: 'assistant',
  model,
  systemMessage: 'You are a helpful assistant',
})
```

### @orion-ai/deepseek

DeepSeek provider package supporting DeepSeek models (uses OpenAI-compatible API).

**Installation:**
```bash
pnpm add @orion-ai/deepseek
```

**Usage:**
```typescript
import { createDeepSeekModel } from '@orion-ai/deepseek'
import { assistantAgent } from '@orion-ai/core'

const model = createDeepSeekModel({
  apiKey: process.env.DEEPSEEK_API_KEY,
  model: 'deepseek-chat', // or 'deepseek-reasoner'
})

const agent = assistantAgent({
  name: 'assistant',
  model,
  systemMessage: 'You are a helpful assistant',
})
```

## Architecture

All provider packages are built on the [Vercel AI SDK](https://sdk.vercel.ai/), which provides:

- ✅ Unified API across all providers
- ✅ Automatic tool execution
- ✅ Streaming support
- ✅ Type safety
- ✅ Built-in retry logic and error handling

## Package Structure

```
packages/libs/
├── orionai-openai/        # OpenAI provider
│   ├── src/
│   │   └── index.ts       # createOpenAIModel factory
│   └── package.json
├── orionai-anthropic/     # Anthropic provider
│   ├── src/
│   │   └── index.ts       # createAnthropicModel factory
│   └── package.json
└── orionai-deepseek/      # DeepSeek provider
    ├── src/
    │   └── index.ts       # createDeepSeekModel factory
    └── package.json
```

## Development

### Building a Provider Package

```bash
cd packages/libs/orionai-openai  # or anthropic/deepseek
pnpm build
```

### Testing a Provider Package

```bash
cd packages/libs/orionai-openai
pnpm test
```

### Type Checking

```bash
cd packages/libs/orionai-openai
pnpm typecheck
```

## Benefits of This Architecture

1. **Smaller bundle sizes** - Install only the providers you need
2. **Cleaner dependencies** - Each provider manages its own SDK dependencies
3. **Easier maintenance** - Provider-specific logic is isolated
4. **Better tree-shaking** - Unused providers are not included in your bundle
5. **Flexibility** - Easy to add new providers without touching core

## Adding a New Provider

To add support for a new LLM provider:

1. Create a new directory: `packages/libs/orionai-{provider}`
2. Copy the structure from an existing provider
3. Install the AI SDK provider: `pnpm add @ai-sdk/{provider}`
4. Implement the factory function
5. Update `pnpm-workspace.yaml` if needed
6. Add documentation

Example for a hypothetical "Gemini" provider:

```typescript
// packages/libs/orionai-gemini/src/index.ts
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import type { LanguageModel } from 'ai'

export interface IGeminiConfig {
  apiKey?: string
  model?: string
  baseURL?: string
}

export function createGeminiModel(config: IGeminiConfig = {}): LanguageModel {
  const { model = 'gemini-pro', apiKey, baseURL, ...rest } = config

  const gemini = createGoogleGenerativeAI({
    apiKey: apiKey || process.env.GEMINI_API_KEY,
    baseURL,
    ...rest,
  })

  return gemini(model)
}

export const geminiModel = createGeminiModel
export default createGeminiModel
```
