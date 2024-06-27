import type { Handler, MessageId, Options, ProxyMessagePayload } from './types'
import { Responders } from './responders'
import { proxyfy } from './util'
import { Handlers } from './handlers'
import { Debugger } from './debugger'
import { Postman } from './postman'
import { GetMan } from './getman'

export class NextPostMessage<Message = unknown, Answer = Message | void> {
  private responders = new Responders<Answer>()
  private ignoreList: MessageId[] = []
  readonly options: Options<string>
  private debugger: Debugger
  private getMan: GetMan<Message, Answer>
  private targetWindow = window // 发送消息去的窗口

  constructor(options?: Options<string>) {
    this.initSteps.validateOptions(options)
    this.options = this.initSteps.initializeOptions(options)

    this.getMan = new GetMan<Message, Answer>(this.options)
    this.getMan.setResponders(this.responders)
    this.getMan.start() // 开启监听消息

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
  }

  debug(...message: any[]) {
    this.debugger.debug(...message)
  }

  warn(...message: any[]) {
    this.debugger.warn(...message)
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
    return this.getMan.onReceive(handler)
  }

  removeHandler(msgId: MessageId): boolean {
    return this.getMan.removeHandler(msgId)
  }

  createPostman(targetWindow: Window, postManOptions?: Options): Postman<Message, Answer> {
    const newOptions = {
      ...this.options,
      ...postManOptions,
    }
    return new Postman(this, targetWindow, newOptions)
  }

  createGetman(optionos?: Options): GetMan<Message, Answer> {
    const newOptions = {
      ...this.options,
      ...optionos,
    }
    const aGetMan = new GetMan(newOptions)
    aGetMan.start()
    return aGetMan as any
  }
}
