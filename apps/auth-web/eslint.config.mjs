import react from '@lidcode/eslint/react'

export default [
  ...react,
  { ignores: ['src/routeTree.gen.ts'] },
  { rules: { 'react/prop-types': 'off' } },
]
