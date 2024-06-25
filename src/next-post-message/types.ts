export type MessageId = string
export type HandlerId = string

export interface Options<T = string> {
  channel?: T
  enableDebug?: boolean
  maxWaitTime?: number
}

export interface ProxyMessagePayload<T> {
  npmFlag: boolean // This is a flag to identify the message as a Next-Post-Msg message
  msgId: MessageId
  data: T
  channel?: string
  origMsgId?: MessageId
}

export type Handler<Message, Answer> = (message: Message) => Promise<Answer> | Answer
