import type { Handler, MessageId, Options, ProxyMessagePayload } from './types'
import { Responders } from './responders'
import { proxyfy } from './util'
import { Handlers } from './handlers'
import { Debugger } from './Debugger'

export class NextPostMessage<Message = unknown, Answer = Message | void> {
  private handlers = new Handlers<Message, Answer>()
  private responders = new Responders<Answer>()
  private ignoreList: MessageId[] = []
  readonly options: Options<string>
  private debugger: Debugger

  constructor(private window: Window, options?: Options<string>) {
    this.validateOptions(options)
    this.options = this.initializeOptions(options)
    this.setupMessageListener()
    this.debugger = new Debugger(this.options.enableDebug || false, this.options.channel)
    this.debug('Instance created. CHANNEL =', this.options.channel || '<GLOBAL>')
  }

  private debug(...message: any[]) {
    this.debugger.debug(...message)
  }

  private validateOptions(options?: Options<string>) {
    if (options?.channel?.includes(':'))
      throw new Error('Invalid channel name (note that channel cannot contain the character \':\').')
  }

  private initializeOptions(options?: Options<string>): Options<string> {
    return options || {}
  }

  private setupMessageListener() {
    this.window.addEventListener('message', ({ data }) => {
      if (typeof data === 'object' && 'npmFlag' in data && data.npmFlag)
        this.messageReceived(data as ProxyMessagePayload<Message>)
    })
  }

  private isAnswer(proxy: ProxyMessagePayload<Message | Answer>): proxy is ProxyMessagePayload<Answer> {
    return !!('origMsgId' in proxy && proxy.origMsgId)
  }

  private messageReceived(proxy: ProxyMessagePayload<Message>) {
    if (this.shouldIgnoreMessage(proxy.msgId))
      return

    if (this.isChannelMismatch(proxy))
      return this.debugger.debug(`Blocked proxy from channel ${proxy.channel} because it doesn't match this channel (${this.options.channel}).`)

    if (this.isAnswer(proxy))
      this.handleAnswer(proxy as ProxyMessagePayload<Answer>)
    else
      this.handleMessage(proxy)
  }

  private shouldIgnoreMessage(msgId: MessageId): boolean {
    const index = this.ignoreList.indexOf(msgId)
    if (index >= 0) {
      this.ignoreList.splice(index, 1)
      return true
    }
    return false
  }

  private isChannelMismatch(proxy: ProxyMessagePayload<Message>): boolean {
    return !!(this.options.channel && proxy.channel && this.options.channel !== proxy.channel)
  }

  private handleAnswer(proxy: ProxyMessagePayload<Answer>) {
    this.responders.resolveResponders(proxy)
  }

  private handleMessage(proxy: ProxyMessagePayload<Message>) {
    this.debugger.debug('Received message from proxy <', proxy.msgId, '>.')
    this.handlers.handleMessage(proxy, this.options, (answerProxy) => {
      this.ignoreList.push(answerProxy.msgId)
      this.window.postMessage(answerProxy)
    })
  }
  // private messageReceived(proxy: ProxyMessagePayload<Message>) {
  //   const ignoredIndex = this.ignoreThoseProxies.indexOf(proxy.msgId)
  //   if (ignoredIndex >= 0) {
  //     this.ignoreThoseProxies.splice(ignoredIndex, 1)
  //     return
  //   }

  //   if (this.options.channel && proxy.channel && this.options.channel !== proxy.channel)
  //     return this.debug(`Blocked proxy from channel ${proxy.channel} because it doesn't match this channel (${this.options.channel}).`)

  //   if (this.isAnswer(proxy)) {
  //     this.responders.resolveResponders(proxy)
  //   }
  //   else {
  //     this.debug('Received message from proxy <', proxy.msgId, '>.')
  //     this.handlers.handleMessage(proxy, this.options, (answerProxy) => {
  //       this.ignoreThoseProxies.push(answerProxy.msgId)
  //       this.window.postMessage(answerProxy)
  //     })
  //   }
  // }

  post(message: Message, custom_timeout?: number): { msgId: MessageId, answer: Promise<Answer> } {
    const proxy = proxyfy(message, this.options)
    this.ignoreList.push(proxy.msgId)
    this.window.postMessage(proxy)

    const timeout = custom_timeout || this.options.maxWaitTime || 15_000
    this.debug('Proxified message posted:', proxy, '(answer timeout:', timeout / 1000, 'seconds).')

    const answer: ReturnType<typeof this.post>['answer'] = Promise.race([
      new Promise<Answer>((res) => {
        this.responders.addResponder(proxy.msgId, res)
      }),
      new Promise<never>((_, rej) => {
        setTimeout(() => rej(new Error('Response timeout reached.')), timeout)
      }),
    ])

    return { msgId: proxy.msgId, answer }
  }

  onReceive(handler: Handler<Message, Answer>): MessageId {
    return this.handlers.addHandler(handler)
  }

  removeHandler(msgId: MessageId): boolean {
    return this.handlers.removeHandler(msgId)
  }
}
