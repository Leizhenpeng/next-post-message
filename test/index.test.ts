// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { JSDOM } from 'jsdom'
import { Npm } from '../src'

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

  describe('options', () => {
    describe('channel', () => {
      it('should throw error if tunnel name contains \':\'', () => {
        const options = { channel: 'invalid:channel' }
        expect(() => new Npm(options)).toThrowError()
      })
      it('should create instance', () => {
        const options = { channel: 'valid_tunnel' }
        const bpm = new Npm(options)
        expect(bpm.options).toEqual(options)
      })
    })

    describe('maxWaitTime', () => {
      it('should timeout if no answer is received', async () => {
        const npm = new Npm({ maxWaitTime: 100 }) // short timeout for test
        const { answer } = npm.post('Hello', window)
        await expect(answer).rejects.toThrow('Response timeout reached.')
      })

      it('should not timeout if answer is received within maxWaitTime', async () => {
        const npm = new Npm({ maxWaitTime: 1000, enableDebug: true })
        const handler = vi.fn(_msg => Promise.resolve('Hello back'))
        npm.onReceive(handler)
        const { msgId, answer } = npm.post('Hello', window)

        setTimeout(() => {
          window.dispatchEvent(new MessageEvent('message', { data: { npmFlag: true, msgId, data: 'Hello' } }))
          const response = { npmFlag: true, msgId, data: 'Hello back', origMsgId: msgId }
          window.dispatchEvent(new MessageEvent('message', { data: response }))
        }, 100)
        await expect(answer).resolves.toBe('Hello back')
      })
    })

    it('should enable debug mode and log debug messages', () => {
      const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => { })
      const options = { enableDebug: true }
      const npm = new Npm(options)
      npm.post('Hello', window)
      expect(consoleDebugSpy).toHaveBeenCalled()
      consoleDebugSpy.mockRestore()
    })
  })

  describe('message Handlers', () => {
    it('should handle messages correctly', async () => {
      const npm = new Npm()
      const handler = vi.fn(message => Promise.resolve(message))
      npm.onReceive(handler)

      const testMessage = { npmFlag: true, msgId: '1-1', data: 'Test Msg' }
      window.dispatchEvent(new MessageEvent('message', { data: testMessage }))

      await new Promise(process.nextTick) // wait for promises to resolve
      expect(handler).toHaveBeenCalledWith('Test Msg')
    })

    it('should not receive messages from unregistered handlers', () => {
      const bpm = new Npm()
      const handlerID = bpm.onReceive(() => { })
      bpm.removeHandler(handlerID)
      const testMessage = { npmFlag: true, msgId: '1-2', data: 'Test' }
      window.dispatchEvent(new MessageEvent('message', { data: testMessage }))
      expect(postMessageSpy).not.toHaveBeenCalled()
    })
  })
})
