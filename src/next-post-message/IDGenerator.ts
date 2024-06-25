import type { MessageId } from './types'

export class IDGenerator {
  constructor(private tunnel?: string) { }

  generateID(): MessageId {
    return (`${this.tunnel ? `${this.tunnel}::` : ''}${Date.now()}-${Math.floor(Math.random() * 1000)}`) as MessageId
  }
}
