# next-post-message

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![License][license-src]][license-href]

🌳 Tiny & elegant & better windows post message,simple bnd powerful.

## Install the packag

```sh
pnpm install next-post-message
```
## Basic Usage

### Sender Window (windowA)
Sending messages has never been easier:

```javascript
import { NextPostMessage } from 'next-post-message'

const targetWindow = document.getElementById('iframeB').contentWindow
const npmA = new NextPostMessage({ channel: 'example_channel' })

const { answer } = npmA.post('Hello from A', targetWindow)

answer
  .then(response => console.log('Received in A:', response))
  .catch(error => console.error('Error in A:', error))
```

### Receiver Window (windowB)
In the receiver window, set up a handler to receive messages and send responses:

```javascript
import { NextPostMessage } from 'next-post-message'

const npmB = new NextPostMessage({ channel: 'example_channel' })

npmB.onReceive(async (message) => {
  console.log('Received in B:', message)
  return 'Hello back from B'
})
```

## Advanced Usage

### Why Use the `Postman` Class?
Let's be honest, specifying the target window every time you send a message can get tedious.

That's where the `Postman` class comes in. It helps manage message sending with custom options and a pre-specified target window.

#### Sender Window (windowA)
```javascript
import { NextPostMessage } from 'next-post-message'

const targetWindowB = document.getElementById('iframeB').contentWindow
const npmA = new NextPostMessage({ channel: 'example_channel' })

const postman = npmA.createPostman(targetWindowB, {
  maxWaitTime: 20000, // Custom timeout 20 seconds
  enableDebug: true
})

// Now you can send messages without specifying the window every time
const { answer } = postman.post('Hello from A through Postman')
const { answer: answer2 } = postman.post('Hello again from A through Postman')
// ...
```

#### Receiver Window (windowB)
```javascript
import { NextPostMessage } from 'next-post-message'

const npmB = new NextPostMessage({ channel: 'example_channel', enableDebug: true })

npmB.onReceive(async (message) => {
  console.log('Received in B with debug:', message)
  return 'Hello back from B with debug'
})
```

Hope these examples help you get started quickly and make the most of `NextPostMessage`!

## License

[MIT](./LICENSE) License © 2023-PRESENT [leizhenpeng](https://github.com/leizhenpeng)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/next-post-message?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/next-post-message
[npm-downloads-src]: https://img.shields.io/npm/dm/next-post-message?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/next-post-message
[bundle-src]: https://img.shields.io/bundlephobia/minzip/next-post-message?style=flat&colorA=080f12&colorB=1fa669&label=minzip
[bundle-href]: https://bundlephobia.com/result?p=next-post-message
[license-src]: https://img.shields.io/github/license/leizhenpeng/next-post-message.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/leizhenpeng/next-post-message/blob/main/LICENSE
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=1fa669
[jsdocs-href]: https://www.jsdocs.io/package/next-post-message
