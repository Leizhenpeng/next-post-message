import type { Options } from './types'

export class Debugger {
  constructor(private options: Options<string>) { }

  debug(...message: unknown[]) {
    if (!this.options.enableDebug)
      return
    // eslint-disable-next-line no-console
    console.debug(`[BetterPostMessage${this.options.tunnel ? ` - ${this.options.tunnel}` : ''}]>`, ...message)
  }
}
