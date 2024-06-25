import type { MessageId, ProxyMessagePayload } from './types'

interface Responder<Answer> {
  proxyID: MessageId
  promiseResponder: (res: Answer | PromiseLike<Answer>) => void
}

export class Responders<Answer> {
  private responders: Responder<Answer>[] = []

  addResponder(proxyID: MessageId, promiseResponder: (res: Answer | PromiseLike<Answer>) => void) {
    this.responders.push({ proxyID, promiseResponder })
  }

  resolveResponders(proxy: ProxyMessagePayload<Answer>) {
    const responders = this.responders.filter(r => r.proxyID === proxy.origMsgId)
    if (responders.length) {
      for (const r of responders)
        r.promiseResponder(proxy.data)

      this.deleteResponders(proxy.origMsgId as MessageId)
    }
  }

  private deleteResponders(proxyID: MessageId) {
    this.responders = this.responders.filter(r => r.proxyID !== proxyID)
  }
}
