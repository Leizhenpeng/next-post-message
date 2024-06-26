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

const tgtWin = document.getElementById('iframeB').contentWindow
const npm = new NextPostMessage({ channel: '/chat' })

const { answer } = npm.post('Hello!', tgtWin)

answer
  .then(res => console.log('Received：', res))
  .catch(err => console.error('Error：', err))
```

### Receiver Window (windowB)
In the receiver window, set up a handler to receive messages and send responses:

```javascript
import { NextPostMessage } from 'next-post-message'

const npm = new NextPostMessage({ channel: '/chat' })

npm.onReceive(async (msg) => {
  console.log('Received :', msg)
  return 'Hello back'
})
```

## Advanced Usage

Let's be honest, specifying the target window every time you send a message can get tedious.

That's where the `Postman` class comes in. It helps manage message sending with custom options and a pre-specified target window.

#### Sender Window (windowA)
```javascript
import { NextPostMessage } from 'next-post-message'

const tgtWin = document.getElementById('iframeB').contentWindow
const npm = new NextPostMessage({ channel: '/detail/blog' })

const postman = npmA.createPostman(targetWindowB, {
  maxWaitTime: 20000, // Custom timeout 20 seconds
  enableDebug: true
})

// Now you can send messages without specifying the window every time
const { answer } = postman.post('Hello from through Postman')
const { answer: answer2 } = postman.post('Hello again through Postman')
// ...
```

#### Receiver Window (windowB)
```javascript
import { NextPostMessage } from 'next-post-message'

const npm = new NextPostMessage({ channel: '/detail/blog', enableDebug: true })

npm.onReceive(async (msg) => {
  console.log('Received in:', message)
  return 'Hello back'
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
