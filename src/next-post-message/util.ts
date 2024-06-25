import type { MessageId, Options, ProxyMessagePayload } from './types'

export function createRandomString(): string {
  const cryptoObj = window.crypto // 处理兼容性
  const array = new Uint32Array(1)
  cryptoObj.getRandomValues(array)
  return array[0].toString(36)
}

export function generateID(tunnel?: string): MessageId {
  const randomString = createRandomString()
  return `${tunnel ? `${tunnel}::` : ''}${Date.now()}-${randomString}` as MessageId
}

export function proxyfy<D>(data: D, options: Options<string>, id?: MessageId, origMsgId?: MessageId): ProxyMessagePayload<D> {
  return {
    npmFlag: true,
    channel: options.channel,
    msgId: id || generateID(options.channel),
    origMsgId,
    data,
  }
}
