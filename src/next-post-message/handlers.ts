import type { Handler, MessageId, Options, ProxyMessagePayload } from './types'
import { proxyfy } from './util'

interface HandlerProxy<Message, Answer> {
  msgId: MessageId
  handler: Handler<Message, Answer>
}

export class Handlers<Message, Answer> {
  private handlers: HandlerProxy<Message, Answer>[] = []

  addHandler(handler: Handler<Message, Answer>): MessageId {
    const msgId = this.generateID()
    this.handlers.push({ msgId, handler })
    return msgId
  }

  removeHandler(msgId: MessageId): boolean {
    const index = this.handlers.findIndex(h => h.msgId === msgId)
    if (index === -1)
      return false
    this.handlers.splice(index, 1)
    return true
  }

  async handleMessage(proxy: ProxyMessagePayload<Message>, options: Options<string>, postMessage: (proxy: ProxyMessagePayload<Answer>) => void) {
    for (const { handler, msgId: _msg } of this.handlers) {
      const answer = await handler(proxy.data)
      const answerProxy = proxyfy(answer, options, undefined, proxy.msgId)
      postMessage(answerProxy)
    }
  }

  private generateID(): MessageId {
    return `${Date.now()}-${Math.floor(Math.random() * 1000)}` as MessageId
  }
}
