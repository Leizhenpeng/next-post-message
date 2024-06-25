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
  private receiveWindow = window
  private targetWindow = window

  constructor(options?: Options<string>) {
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
    this.receiveWindow.addEventListener('message', (event) => {
      const { data } = event
      if (typeof data === 'object' && 'npmFlag' in data && data.npmFlag)
        this.onMessageReceived(data as ProxyMessagePayload<Message>, event.source as Window)
    })
  }

  private onMessageReceived(messagePayload: ProxyMessagePayload<Message>, sourceWindow: Window) {
    if (this.msgHandlers.shouldIgnore(messagePayload.msgId))
      return

    if (this.msgHandlers.isMismatch(messagePayload))
      return this.debugger.debug(`Blocked proxy from channel ${messagePayload.channel} because it doesn't match this channel (${this.options.channel}).`)

    if (this.msgHandlers.isAnswer(messagePayload))
      this.msgHandlers.handleAnswer(messagePayload as ProxyMessagePayload<Answer>)
    else
      this.msgHandlers.handleMessage(messagePayload, sourceWindow)
  }

  private msgHandlers = {
    isAnswer(proxy: ProxyMessagePayload<Message | Answer>): proxy is ProxyMessagePayload<Answer> {
      return !!('origMsgId' in proxy && proxy.origMsgId)
    },

    shouldIgnore: (msgId: MessageId): boolean => {
      const index = this.ignoreList.indexOf(msgId)
      if (index >= 0) {
        this.ignoreList.splice(index, 1)
        return true
      }
      return false
    },

    isMismatch: (proxy: ProxyMessagePayload<Message>): boolean => {
      return !!(this.options.channel && proxy.channel && this.options.channel !== proxy.channel)
    },

    handleAnswer: (proxy: ProxyMessagePayload<Answer>) => {
      this.responders.resolveResponders(proxy)
    },

    handleMessage: (proxy: ProxyMessagePayload<Message>, sourceWindow: Window) => {
      this.debugger.debug('Received message from proxy <', proxy.msgId, '>.')
      this.handlers.handleMessage(proxy, this.options, (answerProxy) => {
        this.ignoreList.push(answerProxy.msgId)
        // 从发送的event.source中获取发送者的window对象
        // const
        sourceWindow.postMessage(answerProxy)
      })
    },
  }

  post(message: Message, targetWindow: Window = window, custom_timeout?: number): { msgId: MessageId, answer: Promise<Answer> } {
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
      return Promise.race([
        new Promise<Answer>((res) => {
          this.responders.addResponder(msgId, res)
        }),
        new Promise<never>((_, rej) => {
          setTimeout(() => rej(new Error('Response timeout reached.')), timeout)
        }),
      ])
    },
  }

  onReceive(handler: Handler<Message, Answer>): MessageId {
    return this.handlers.addHandler(handler)
  }

  removeHandler(msgId: MessageId): boolean {
    return this.handlers.removeHandler(msgId)
  }
}
