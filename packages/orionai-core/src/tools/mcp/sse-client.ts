import { Client, type ClientOptions } from '@modelcontextprotocol/sdk/client/index.js'
import {
  SSEClientTransport,
  type SSEClientTransportOptions,
} from '@modelcontextprotocol/sdk/client/sse.js'
import type { Implementation } from '@modelcontextprotocol/sdk/types.js'

export interface SSEClientOptions {
  url: string
  headers?: Record<string, string>
  retryInterval?: number
  maxRetries?: number
}

export interface SSEMessage {
  id?: string
  event?: string
  data: string
  retry?: number
}

export interface IMCPSseClientOptions {
  clientInfo: Implementation
  options?: ClientOptions
}

export interface IMCPSseTransportOptions {
  url: string
  options?: SSEClientTransportOptions
}

export class MCPSseClient {
  private retryCount: number
  private eventSource: EventSource | null
  private _isConnected: boolean

  private client: Client
  private transport: SSEClientTransport

  constructor(clientOptions: IMCPSseClientOptions, transportOptions: IMCPSseTransportOptions) {
    this.retryCount = 0
    this.eventSource = null
    this._isConnected = false

    this.client = new Client(clientOptions.clientInfo, clientOptions.options)
    this.transport = new SSEClientTransport(new URL(transportOptions.url), transportOptions.options)
  }

  public connect(): void {
    this.client.connect(this.transport)
  }

  private setupEventListeners(): void {
    if (!this.eventSource) return

    this.eventSource.onopen = () => {
      this._isConnected = true
      this.retryCount = 0
    }

    this.eventSource.onmessage = (event: MessageEvent) => {
      const message: SSEMessage = {
        data: event.data,
      }
    }

    this.eventSource.onerror = (error: Event) => {
      this._isConnected = false
    }
  }

  public disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
      this._isConnected = false
    }
  }

  public getConnectionStatus(): boolean {
    return this._isConnected
  }

  public addEventListener(event: string, listener: (message: SSEMessage) => void): void {
    if (!this.eventSource) return
    this.eventSource.addEventListener(event, (event: MessageEvent) => {
      const message: SSEMessage = {
        data: event.data,
        event: event.type,
      }
      listener(message)
    })
  }

  public removeEventListener(event: string, listener: (message: SSEMessage) => void): void {
    if (!this.eventSource) return
    const wrappedListener = (event: Event) => {
      if (event instanceof MessageEvent) {
        const message: SSEMessage = {
          data: event.data,
          event: event.type,
        }
        listener(message)
      }
    }
    this.eventSource.removeEventListener(event, wrappedListener)
  }
}
