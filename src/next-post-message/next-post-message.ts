import type { Handler, MessageId, Options } from './types'
import { Responders } from './responders'
import { Debugger } from './debugger'
import { Postman } from './postman'
import { GetMan } from './getman'

export class NextPostMessage<Message = unknown, Answer = Message | void> {
  readonly options: Options<string>
  private debugger: Debugger
  constructor(options?: Options<string>) {
    this.initSteps.validateOptions(options)
    this.options = this.initSteps.initializeOptions(options)

    this.debugger = new Debugger(this.options.enableDebug || false, this.options.channel)
    this.debug('Instance app created.')
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

  createGetman(optionos?: Options): GetMan<Message, Answer> {
    const newOptions = {
      ...this.options,
      ...optionos,
    }
    const aGetMan = new GetMan(newOptions)
    aGetMan.start()
    return aGetMan as any
  }

  onReceive(handler: Handler<Message, Answer>): MessageId {
    const getMan = this.createGetman(this.options)
    return getMan.onReceive(handler)
  }

  createPostman(targetWindow: Window, postManOptions?: Options): Postman<Message, Answer> {
    const newOptions = {
      ...this.options,
      ...postManOptions,
    }
    return new Postman(targetWindow, newOptions)
  }

  post(message: Message, targetWindow: Window = window): { msgId: MessageId, answer: Promise<Answer> } {
    const newPostMan = this.createPostman(targetWindow)
    return newPostMan.post(message)
  }
}
