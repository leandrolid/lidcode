export const SafeHTMLElement: {
  new (): HTMLElement
  prototype: HTMLElement
} =
  typeof globalThis !== 'undefined' && 'HTMLElement' in globalThis
    ? (globalThis.HTMLElement as { new (): HTMLElement; prototype: HTMLElement })
    : (class {} as unknown as { new (): HTMLElement; prototype: HTMLElement })
