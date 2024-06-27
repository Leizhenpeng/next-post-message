import { Debugger } from './debugger'
import { GetMan } from './getman'
import type { NextPostMessage } from './next-post-message'
import { Responders } from './responders'
import type { MessageId, Options, ProxyMessagePayload } from './types'
import { proxyfy } from './util'

export class Postman<Message, Answer> {
  private targetWindow: Window
  private options: Options
  private debugger: Debugger
  private ignoreList: MessageId[] = []
  private responders = new Responders<Answer>()
  private getMan: GetMan<Message, Answer>
  setResponders(responders: Responders<Answer>) {
    this.responders = responders
  }

  constructor(targetWindow: Window, options: Options) {
    this.targetWindow = targetWindow || window
    this.options = options
    this.debugger = new Debugger(options.enableDebug || false, options.channel)
    this.debugger.debug('Postman instance created.')

    this.responders.setLogger(this.debugger)
    this.getMan = new GetMan<Message, Answer>(this.options)
    this.getMan.setResponders(this.responders)
    this.getMan.start()
    this.debugger.debug('GetMan instance for postman created.')
  }

  post(message: Message, targetWindow: Window = this.targetWindow, custom_timeout?: number): { msgId: MessageId, answer: Promise<Answer> } {
    const proxy = this.PostHelper.createProxyMessage(message)
    this.PostHelper.addToIgnoreList(proxy.msgId)
    this.PostHelper.postMessage(proxy, targetWindow)
    this.PostHelper.logMessagePosted(proxy, custom_timeout)
    const answer = this.PostHelper.createAnswerPromise(proxy.msgId, custom_timeout)
    return { msgId: proxy.msgId, answer }
  }

  private PostHelper = {
    createProxyMessage: (message: Message): ProxyMessagePayload<Message> => {
      return proxyfy(message, this.options)
    },

    addToIgnoreList: (msgId: MessageId): void => {
      this.ignoreList.push(msgId)
    },

    postMessage: (proxy: ProxyMessagePayload<Message>, targetWindow: Window): void => {
      targetWindow.postMessage(proxy)
    },

    logMessagePosted: (proxy: ProxyMessagePayload<Message>, custom_timeout?: number): void => {
      const timeout = custom_timeout || this.options.maxWaitTime || 15_000
      this.debugger.debug('Proxified message posted:', proxy, '(answer timeout:', timeout / 1000, 'seconds).')
    },

    createAnswerPromise: (msgId: MessageId, custom_timeout?: number): Promise<Answer> => {
      const timeout = custom_timeout || this.options.maxWaitTime || 15_000
      return new Promise<Answer>((resolve, reject) => {
        this.responders.addResponder(msgId, resolve, reject, timeout)
      })
    },
  }
}
