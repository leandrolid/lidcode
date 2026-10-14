import base from '@lidcode/eslint/base'

export default [...base, { ignores: ['coverage/**', 'src/infra/adapters/drizzle/migrations/**'] }]
