export const betterAuth = jest.fn(() => ({
  api: {},
  handler: jest.fn(),
}))

export const drizzleAdapter = jest.fn(() => ({
  createTables: jest.fn(),
}))
