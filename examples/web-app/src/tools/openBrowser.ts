import { BaseTool } from '@orion-ai/core'
import { useBrowserStore } from '@/store/browser'
import { z } from 'zod'

const schema = z.object({
  url: z.string().describe('The URL to open in the browser'),
})

export class OpenBrowserTool extends BaseTool<typeof schema> {
  constructor() {
    super({
      name: 'open_browser',
      description: 'Open a browser window to display a webpage',
      schema,
    })
  }

  async run(args: z.input<typeof schema>): Promise<string> {
    const { openBrowser } = useBrowserStore.getState()
    openBrowser(args.url)
    return `Opened browser to ${args.url}`
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      description: this.description,
      parameters: this.schema,
    }
  }

  toResponseJson(): Record<string, unknown> {
    return {
      name: this.name,
      description: this.description,
      parameters: this.schema,
    }
  }
}
