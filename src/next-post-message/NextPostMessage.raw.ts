import type { Handler, MessageId, Options, ProxyMessagePayload } from './types'

export class BetterPostMessage< Message = unknown, Answer = Message | void,
> {
  private handlers: { id: MessageId, handler: Handler<Message, Answer> }[] = []
  private responders: {
    proxyID: MessageId
    promiseResponder: (res: Answer | PromiseLike<Answer>) => void
  }[] = []

  private ignoreThoseProxies: MessageId[] = []
  readonly options: Options<string>

  constructor(private window: Window, options?: Options<string>) {
    if (options?.tunnel?.includes(':')) {
      throw new Error(
        'Invalid tunnel name (note that tunnel cannot contain the character \':\').',
      )
    }
    this.options = options || {}

    window.addEventListener('message', ({ data }) => {
      if (
        typeof data === 'object'
        && '__BETTER_POST_MESSAGE' in data
        && data.__BETTER_POST_MESSAGE
      )
        this.messageReceived(data as ProxyMessagePayload<Message, Answer>)
    })
    this.debug('Instance created. TUNNEL =', options?.tunnel || '<GLOBAL>')
  }

  private debug(...message: any[]) {
    if (!this.options.enableDebug)
      return
    // eslint-disable-next-line no-console
    console.debug(
            `[BetterPostMessage${this.options.tunnel ? ` - ${this.options.tunnel}` : ''
            }]>`,
            ...message,
    )
  }

  private isAnswer(
    proxy: ProxyMessagePayload<Message | Answer>,
  ): proxy is ProxyMessagePayload<Answer> {
    return !!('init_proxy' in proxy && proxy.init_proxy)
  }

  private messageReceived(proxy: ProxyMessagePayload<Message, Answer>) {
    //* The next 4 lines are here to prevent handling message sent from this context
    const ignoredIndex = this.ignoreThoseProxies.indexOf(proxy.id)
    if (ignoredIndex >= 0) {
      this.ignoreThoseProxies.splice(ignoredIndex, 1)
      return
    }

    if (
      this.options.tunnel
      && proxy.tunnel
      && this.options.tunnel !== proxy.tunnel
    ) {
      return this.debug(
                `Blocked proxy from tunnel ${proxy.tunnel} because it doesn't match this tunnel (${this.options.tunnel}).`,
      )
    }

    if (this.isAnswer(proxy)) {
      const responders = this.responders.filter(
        resp => resp.proxyID === proxy.initProxy,
      )
      if (responders.length) {
        this.debug(
          'Received answer <',
          proxy.id,
          '> from proxy <',
          proxy.initProxy,
          '>.',
          responders.length,
          'message promises will be resolved. Answer content: ',
          proxy.data,
        )
        this.deleteResponders(proxy.initProxy)

        responders.forEach(r => r.promiseResponder(proxy.data))
      }
      else {
        this.debug(
          'Answer message received but no responders found for it.',
          proxy,
          this.responders,
        )
      }
    }
    else {
      this.debug(
        'Received message from proxy <',
        proxy.id,
        '>.',
        this.handlers.length,
        'handlers will be triggered. Message content: ',
        proxy.data,
      )
      this.handlers.forEach(async ({ handler, id: handlerID }) => {
        const answer = await handler(proxy.data)

        const answerProxy = this.proxyfy(answer, undefined, proxy.id)
        this.ignoreThoseProxies.push(answerProxy.id)

        this.window.postMessage(answerProxy)
        this.debug(
          'Handler <',
          handlerID,
          '> has handled to the message <',
          proxy.id,
          '> with answer :',
          answer,
        )
      })
    }
  }

  private deleteResponders(proxyID: MessageId) {
    this.responders = this.responders.filter(
      resp => resp.proxyID !== proxyID,
    )
    this.debug('Deleted all responders for proxy <', proxyID, '>.')
  }

  private generateID() {
    const { tunnel } = this.options
    return (`${tunnel ? `${tunnel}::` : ''
            }${Date.now()}-${Math.floor(Math.random() * 1000)}`) as MessageId
  }

  private proxyfy<D extends Message | Answer>(
    data: D,
    id?: MessageId,
    fromProxy?: MessageId,
  ): ProxyMessagePayload<D> {
    return {
      __BETTER_POST_MESSAGE: true,
      id: id || this.generateID(),
      data,
      tunnel: this.options.tunnel,
      initProxy: fromProxy,
    }
  }

  post(
    message: Message,
    /**
     * Specify a custom timeout for this message (in milliseconds)
     */
    custom_timeout?: number,
  ): { messageID: MessageId, answer: Promise<Answer> } {
    const proxy = this.proxyfy(message)
    this.ignoreThoseProxies.push(proxy.id)

    this.window.postMessage(proxy)
    const timeout = custom_timeout || this.options.maxWaitTime || 15_000
    this.debug(
      'Proxified message posted:',
      proxy,
      '(answer timeout :',
      timeout / 1000,
      'seconds).',
    )

    const answer: ReturnType<typeof this.post>['answer'] = Promise.race([
      new Promise<Answer>((res) => {
        this.responders.push({
          proxyID: proxy.id,
          promiseResponder: res,
        })
      }),
      new Promise<never>((_, rej) => {
        setTimeout(() => rej(new Error('Response timeout reached.')), timeout)
      }),
    ])

    return {
      messageID: proxy.id,
      answer,
    }
  }

  onReceive(handler: Handler<Message, Answer>): MessageId {
    const handler_proxy: (typeof this.handlers)[number] = {
      id: this.generateID(),
      handler,
    }
    this.handlers.push(handler_proxy)

    this.debug('New handler has been registered:', handler_proxy)
    return handler_proxy.id
  }

  removeHandler(id: MessageId): boolean {
    const index = this.handlers.findIndex(proxy => proxy.id === id)
    if (index < 0)
      return false
    this.handlers.splice(index, 1)

    this.debug('Handler <', id, '> has been deleted.')
    return true
  }
}
