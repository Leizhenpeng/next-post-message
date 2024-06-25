import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
  ],
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: true,
    // output: {
    //   format: 'umd', // 指定 UMD 格式
    //   name: 'npm', // UMD 包的全局变量名称
    // },
  },
})
