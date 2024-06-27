import type { MessageId, ProxyMessagePayload } from './types'
import type { Debugger } from './debugger'

interface Responder<Answer> {
  proxyID: MessageId
  promiseResponder: (res: Answer | PromiseLike<Answer>) => void
  promiseRejecter: (reason?: any) => void
  timeoutId: NodeJS.Timeout
}

export class Responders<Answer> {
  private responders: Responder<Answer>[] = []

  constructor(
    private logger?: Debugger,
  ) { }

  setLogger(logger: Debugger) {
    this.logger = logger
  }

  warn(...message: any[]) {
    this.logger?.warn(...message)
  }

  addResponder(proxyID: MessageId, promiseResponder: (res: Answer | PromiseLike<Answer>) => void, promiseRejecter: (reason?: any) => void, timeout: number) {
    const timeoutId = setTimeout(() => {
      this.rejectResponders(proxyID, new Error('Response timeout reached.'))
    }, timeout)
    this.responders.push({ proxyID, promiseResponder, promiseRejecter, timeoutId })
  }

  resolveResponders(proxy: ProxyMessagePayload<Answer>) {
    const responders = this.responders.filter(r => r.proxyID === proxy.origMsgId)
    if (responders.length) {
      for (const r of responders) {
        clearTimeout(r.timeoutId)
        if (this.isError(proxy))
          r.promiseRejecter(new Error(proxy.error))
        else
          r.promiseResponder(proxy.data)
      }
      this.deleteResponders(proxy.origMsgId as MessageId)
    }
  }

  private deleteResponders(proxyID: MessageId) {
    this.responders = this.responders.filter(r => r.proxyID !== proxyID)
  }

  rejectResponders(proxyID: MessageId, reason?: any) {
    const responders = this.responders.filter(r => r.proxyID === proxyID)
    for (const r of responders) {
      clearTimeout(r.timeoutId)
      r.promiseRejecter(reason)
    }
    this.warn('Reject responders for proxyID:', proxyID)
    this.deleteResponders(proxyID)
  }

  private isError(proxy: ProxyMessagePayload<Answer>): boolean {
    return !!proxy.error
  }
}
