# next-post-message

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![License][license-src]][license-href]

🌳 Tiny & elegant & better windows post message,simple bnd powerful.

  <img src='https://github.com/Leizhenpeng/next-post-message/assets/50035229/b2258dc9-2dc7-4f11-bf9d-d4e76855becd' alt='Npm Example' width='600'/>

## Install the package

```sh
pnpm install next-post-message
```
## Basic Usage

### Sender Window (windowA)
Sending messages has never been easier:

```javascript
import { Npm } from 'next-post-message'

const tgtWin = document.getElementById('iframeB').contentWindow
const npm = new Npm({ channel: '/chat' })

const { answer } = npm.post('Hello!', tgtWin)

answer
  .then(res => console.log('Received：', res))
  .catch(err => console.error('Error：', err))
```

### Receiver Window (windowB)
In the receiver window, set up a handler to receive messages and send responses:

```javascript
import { Npm } from 'next-post-message'

const npm = new Npm({ channel: '/chat' })

npm.onReceive(async (msg) => {
  console.log('Received :', msg)
  return 'Hello back'
})
```

## Advanced Usage

### 🚀 PostMan
Let's be honest, specifying the target window every time you send a message can get tedious.

That's where the `PostMan` class comes in. It helps manage message sending with custom options and a pre-specified target window.

#### Sender Window (windowA)
```javascript
import { Npm } from 'next-post-message'

const tgtWin = document.getElementById('iframeB').contentWindow
const npm = new Npm({ channel: '/detail/blog' })

const postMan = npm.createPostMan(tgtWin, {
  maxWaitTime: 20000,
  enableDebug: true
})

const { answer: answer1 } = postMan.post('Hello through PostMan')
const { answer: answer2 } = postMan.post('Hello again through PostMan')
```

#### Receiver Window (windowB)
```javascript
import { Npm } from 'next-post-message'

const npm = new Npm({ channel: '/detail/blog', enableDebug: true })

npm.onReceive(async (msg) => {
  console.log('Received in:', message)
  return 'Hello back'
})
```

### 🚀 GetMan
Using Multiple `GetMan` Instances for Listening Different Channels

#### Receiver Window (windowB)
```javascript
import { Npm } from 'next-post-message'

const npm = new Npm({ enableDebug: true })

const getMan = npm.createGetMan({ channel: '/chat' })
getMan.onReceive(msg => console.log('Chat:', msg))

const getMan2 = npm.createGetMan({ channel: '/update' })
getMan2.onReceive(msg => console.log('Update:', msg))
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
