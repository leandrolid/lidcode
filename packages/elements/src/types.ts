import type { LidcodeBadge } from './components/badge.js'
import type { LidcodeGithubLink } from './components/github-link.js'
import type { LidcodeMadeBy } from './components/made-by.js'

export type LidcodeGithubLinkAttributes = {
  href?: string
  target?: string
  rel?: string
  title?: string
  'aria-label'?: string
  size?: number | string
}

export type LidcodeBadgeAttributes = {
  text?: string
}

export type LidcodeMadeByAttributes = {
  href?: string
  author?: string
  prefix?: string
  target?: string
  rel?: string
  'sr-text'?: string
}

type CustomElementProps<T> = {
  [K in keyof T]?: T[K] | string
} & {
  class?: string
  className?: string
  style?: unknown
  children?: unknown
  id?: string
  slot?: string
}

declare global {
  interface HTMLElementTagNameMap {
    'lidcode-github-link': LidcodeGithubLink
    'lidcode-badge': LidcodeBadge
    'lidcode-made-by': LidcodeMadeBy
  }

  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'lidcode-github-link': CustomElementProps<LidcodeGithubLinkAttributes>
      'lidcode-badge': CustomElementProps<LidcodeBadgeAttributes>
      'lidcode-made-by': CustomElementProps<LidcodeMadeByAttributes>
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace React.JSX {
    interface IntrinsicElements {
      'lidcode-github-link': CustomElementProps<LidcodeGithubLinkAttributes>
      'lidcode-badge': CustomElementProps<LidcodeBadgeAttributes>
      'lidcode-made-by': CustomElementProps<LidcodeMadeByAttributes>
    }
  }
}
