type Callback = () => void

export class CancellationToken {
  private _cancelled: boolean = false
  private _callbacks: Callback[] = []

  constructor() {}

  public cancel(): void {
    if (!this._cancelled) {
      this._cancelled = true
      for (const callback of this._callbacks) {
        callback()
      }
    }
  }

  public isCancelled(): boolean {
    return this._cancelled
  }

  public addCallback(callback: Callback): void {
    if (this._cancelled) {
      callback()
    } else {
      this._callbacks.push(callback)
    }
  }

  public linkFuture<T>(future: Promise<T>): Promise<T> {
    if (this._cancelled) {
      return Promise.reject(new Error('Operation was cancelled'))
    } else {
      const cancelPromise = new Promise<T>((_, reject) => {
        this.addCallback(() => {
          reject(new Error('Operation was cancelled'))
        })
      })

      return Promise.race([future, cancelPromise])
    }
  }
}
