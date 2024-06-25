// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    ignores: [
      // eslint ignore globs here
    ],
  },
  {
    rules: {
      // overrides
      '@typescript-eslint/no-unnecessary-type-constraint': 'error',
    },
  },
)
