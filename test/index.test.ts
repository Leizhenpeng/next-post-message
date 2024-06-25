// @vitest-environment jsdom
import { channel } from 'node:diagnostics_channel'
import type { MockInstance } from 'vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { JSDOM } from 'jsdom'
import { NextPostMessage } from '../src'
import { Handlers } from '../src/next-post-message/handlers'

describe('should', () => {
  let dom: JSDOM
  let window: Window
  let postMessageSpy: any
  it('exported', () => {
    expect(typeof window).not.toBe('undefined')
  })

  beforeEach(() => {
    dom = new JSDOM(`<!DOCTYPE html><p>Hello world</p>`)
    window = dom.window as unknown as Window // 强制类型转换
    // Type casting may be necessary to align types with the custom postMessage function
    postMessageSpy = vi.spyOn(window, 'postMessage').mockImplementation((message, targetOrigin = '*' as any) => {
      // eslint-disable-next-line no-console
      console.log(`Message sent: ${message}, Target Origin: ${targetOrigin}`)
    })
  })

  describe('channel ', () => {
    it('should throw error if tunnel name contains \':\'', () => {
      const options = { channel: 'invalid:channel' }
      expect(() => new NextPostMessage(window, options)).toThrowError()
    })

    it('should create instance', () => {
      const options = { channel: 'valid_tunnel' }
      const bpm = new NextPostMessage(window, options)
      expect(bpm.options).toEqual(options)
    })
  })

  describe('message Handlers', () => {
    it('should handle messages correctly', async () => {
      const npm = new NextPostMessage(window)
      const handler = vi.fn(message => Promise.resolve(message))
      npm.onReceive(handler)

      const testMessage = { npmFlag: true, msgId: '1-1', data: 'Test Msg' }
      window.dispatchEvent(new MessageEvent('message', { data: testMessage }))

      await new Promise(process.nextTick) // wait for promises to resolve
      expect(handler).toHaveBeenCalledWith('Test Msg')
    })

    it('should not receive messages from unregistered handlers', () => {
      const bpm = new NextPostMessage(window)
      const handlerID = bpm.onReceive(() => { })
      bpm.removeHandler(handlerID)
      const testMessage = { npmFlag: true, msgId: '1-2', data: 'Test' }
      window.dispatchEvent(new MessageEvent('message', { data: testMessage }))
      expect(postMessageSpy).not.toHaveBeenCalled()
    })
  })

  describe('options', () => {
    it('should correctly timeout if no answer is received', async () => {
      const npm = new NextPostMessage(window, { maxWaitTime: 100 }) // short timeout for test
      const { answer } = npm.post('Hello')
      await expect(answer).rejects.toThrow('Response timeout reached.')
    })
  })
})
