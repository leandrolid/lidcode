export const AuthModule = {
  forRootAsync: (config: any) => ({
    module: class MockAuthModule {},
    providers: config?.providers || [],
    exports: config?.exports || [],
    imports: [],
  }),
}

export const AllowAnonymous = () => jest.fn()
export const Session = () => jest.fn()
