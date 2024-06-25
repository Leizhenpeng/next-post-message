# next-post-message

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![License][license-src]][license-href]

🌳 Tiny & elegant & better windows post message

## Usage

**Install the package**
  ```sh
   npm install next-post-message
  ```
 **Basic usage**

**Sender window (windowA)**:

```js
import { NextPostMessage } from 'next-post-message'

const npmA = new NextPostMessage(window, { channel: 'example_channel' })

const { answer } = npmA.post('Hello from A')

answer
  .then(response => console.log('Received in A:', response))
  .catch(error => console.error('Error in A:', error))
```
 **Receiver window (windowB)**:

```javascript
import { NextPostMessage } from 'next-post-message'

const npmB = new NextPostMessage(window, { channel: 'example_channel' })

npmB.onReceive(async (message) => {
  console.log('Received in B:', message)
  return 'Hello back from B'
})
```

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
