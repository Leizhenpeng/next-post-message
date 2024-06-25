import type { Handler, HandlerId, Options, ProxyMessagePayload } from './types'
import { createRandomString, proxyfy } from './util'

interface HandlerProxy<Message, Answer> {
  msgId: HandlerId
  handler: Handler<Message, Answer>
}

export class Handlers<Message, Answer> {
  private handlers: HandlerProxy<Message, Answer>[] = []

  addHandler(handler: Handler<Message, Answer>): HandlerId {
    const msgId = this.generateID()
    this.handlers.push({ msgId, handler })
    return msgId
  }

  removeHandler(msgId: HandlerId): boolean {
    const index = this.handlers.findIndex(h => h.msgId === msgId)
    if (index === -1)
      return false
    this.handlers.splice(index, 1)
    return true
  }

  async handleMessage(
    proxy: ProxyMessagePayload<Message>,
    options: Options<string>,
    postMessage: (proxy: ProxyMessagePayload<Answer>) => void,
  ) {
    for (const { handler, msgId: _msg } of this.handlers) {
      const answer = await handler(proxy.data)
      const answerProxy = proxyfy(answer, options, undefined, proxy.msgId)
      postMessage(answerProxy)
    }
  }

  private generateID(): HandlerId {
    const randomString = createRandomString()
    return `${Date.now()}-${randomString}` as HandlerId
  }
}
