import type { Handler, MessageId, Options, ProxyMessagePayload } from './types'
import { Handlers } from './handlers'
import { Debugger } from './debugger'
import type { Responders } from './responders'

export class GetMan<Message = unknown, Answer = Message | void> {
  private handlers = new Handlers<Message, Answer>()
  private ignoreList: MessageId[] = []
  readonly options: Options<string>
  private debugger: Debugger
  private receiveWindow = window
  private listening = false
  private responders = {} as Responders<Answer> // PostMan 需要设置 responders

  constructor(options: Options<string>, responders?: Responders<Answer>) {
    this.options = options
    this.debugger = new Debugger(this.options.enableDebug || false, this.options.channel)
    this.responders = responders ?? this.responders
    if (this.isForPostMan)
      this.debug('GetMan instance for PostMan created.')
    else
      this.debug('GetMan instance created.')
  }

  setResponders(responders: Responders<Answer>) {
    this.responders = responders
  }

  start() {
    if (this.listening)
      return
    this.receiveWindow.addEventListener('message', this.onMessageReceived)
    this.listening = true
    // this.debug('GetMan listening started.')
  }

  stop() {
    if (!this.listening)
      return
    this.receiveWindow.removeEventListener('message', this.onMessageReceived)
    this.listening = false
    this.debug('GetMan listening stopped.')
  }

  private onMessageReceived = (event: MessageEvent) => {
    const { data } = event
    if (typeof data === 'object' && 'npmFlag' in data && data.npmFlag)
      this.handleMessageReceived(data as ProxyMessagePayload<Message>, event.source as Window)
  }

  private handleMessageReceived(messagePayload: ProxyMessagePayload<Message>, sourceWindow: Window) {
    if (this.msgHandlers.shouldIgnore(messagePayload.msgId))
      return

    if (this.msgHandlers.isMismatch(messagePayload))
      return this.debugger.warn(`Blocked proxy from channel ${messagePayload.channel} because it doesn't match this channel (${this.options.channel}).`)

    if (this.isForPostMan && this.msgHandlers.isAnswer(messagePayload))
      return this.msgHandlers.handleAnswer(messagePayload)
    if (!this.msgHandlers.isAnswer(messagePayload))
      this.msgHandlers.handleMessage(messagePayload, sourceWindow)
  }

  get isForPostMan() {
    return this.responders && Object.keys(this.responders).length > 0
  }

  private msgHandlers = {
    isAnswer: (proxy: ProxyMessagePayload<Message | Answer>): proxy is ProxyMessagePayload<Answer> => {
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

  onReceive(handler: Handler<Message, Answer>): MessageId {
    return this.handlers.addHandler(handler)
  }

  removeHandler(msgId: MessageId): boolean {
    return this.handlers.removeHandler(msgId)
  }

  debug(...message: any[]) {
    this.debugger.debug(...message)
  }

  warn(...message: any[]) {
    this.debugger.warn(...message)
  }
}
