import { Debugger } from './debugger'
import type { NextPostMessage } from './next-post-message'
import type { MessageId, Options } from './types'

export class Postman<Message, Answer> {
  private nextPostMessage: NextPostMessage<Message, Answer>
  private targetWindow: Window
  private customTimeout?: number
  private enableDebug?: boolean
  private debugger: Debugger

  constructor(
    nextPostMessage: NextPostMessage<Message, Answer>,
    targetWindow: Window,
    options: Options,
  ) {
    this.nextPostMessage = nextPostMessage
    this.targetWindow = targetWindow || window
    this.customTimeout = options.maxWaitTime
    this.enableDebug = options.enableDebug
    this.debugger = new Debugger(options.enableDebug || false, options.channel)
  }

  post(msg: Message): { msgId: MessageId, answer: Promise<Answer> } {
    if (this.enableDebug)
      this.debugger.debug('Postman: Sending message with debug enabled')

    return this.nextPostMessage.post(msg, this.targetWindow, this.customTimeout)
  }
}
