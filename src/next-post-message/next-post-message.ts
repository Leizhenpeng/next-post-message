import type { Handler, MessageId, Options, ProxyMessagePayload } from './types'
import { Responders } from './responders'
import { proxyfy } from './util'
import { Handlers } from './handlers'
import { Debugger } from './debugger'
import { Postman } from './postman'

export class NextPostMessage<Message = unknown, Answer = Message | void> {
  private handlers = new Handlers<Message, Answer>()
  private responders = new Responders<Answer>()
  private ignoreList: MessageId[] = []
  readonly options: Options<string>
  private debugger: Debugger
  private receiveWindow = window // 开启监听消息的窗口
  private targetWindow = window // 发送消息去的窗口

  constructor(options?: Options<string>) {
    this.initSteps.validateOptions(options)
    this.options = this.initSteps.initializeOptions(options)
    this.initSteps.setupMessageListener()
    this.debugger = new Debugger(this.options.enableDebug || false, this.options.channel)
    this.responders.setLogger(this.debugger)
    this.debug('Instance created. CHANNEL =', this.options.channel || '<GLOBAL>')
  }

  private initSteps = {
    validateOptions: (options?: Options<string>) => {
      if (options?.channel?.includes(':'))
        throw new Error('Invalid channel name (note that channel cannot contain the character \':\').')
    },
    initializeOptions: (options?: Options<string>): Options<string> => {
      return options || {}
    },

    setupMessageListener: () => {
      this.receiveWindow.addEventListener('message', (event) => {
        const { data } = event
        if (typeof data === 'object' && 'npmFlag' in data && data.npmFlag)
          this.onMessageReceived(data as ProxyMessagePayload<Message>, event.source as Window)
      })
    },
  }

  debug(...message: any[]) {
    this.debugger.debug(...message)
  }

  warn(...message: any[]) {
    this.debugger.warn(...message)
  }

  private onMessageReceived(messagePayload: ProxyMessagePayload<Message>, sourceWindow: Window) {
    if (this.msgHandlers.shouldIgnore(messagePayload.msgId))
      return

    if (this.msgHandlers.isMismatch(messagePayload))
      return this.debugger.warn(`Blocked proxy from channel ${messagePayload.channel} because it doesn't match this channel (${this.options.channel}).`)

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
        this.debugger.debug('Answering proxy result:', answerProxy)
        sourceWindow.postMessage(answerProxy)
      })
    },
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

  onReceive(handler: Handler<Message, Answer>): MessageId {
    return this.handlers.addHandler(handler)
  }

  createPostman(targetWindow: Window, postManOptions?: Options): Postman<Message, Answer> {
    const newOptions = {
      ...this.options,
      ...postManOptions,
    }
    return new Postman(this, targetWindow, newOptions)
  }

  removeHandler(msgId: MessageId): boolean {
    return this.handlers.removeHandler(msgId)
  }
}
