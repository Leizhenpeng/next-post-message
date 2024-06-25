export class Debugger {
  constructor(private enableDebug: boolean, private channel?: string) { }

  debug(...message: any[]) {
    if (!this.enableDebug)
      return
    // eslint-disable-next-line no-console
    console.debug(`[NextPostMessage${this.channel ? ` - ${this.channel}` : ''}]>`, ...message)
  }
}
