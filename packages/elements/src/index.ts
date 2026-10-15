import { LidcodeBadge } from './components/badge.js'
import { LidcodeGithubLink } from './components/github-link.js'
import { LidcodeMadeBy } from './components/made-by.js'

export { LidcodeBadge } from './components/badge.js'
export { LidcodeGithubLink } from './components/github-link.js'
export { LidcodeMadeBy } from './components/made-by.js'
export * from './server/index.js'
export * from './types.js'

export function registerElements(): void {
  if (typeof window === 'undefined' || typeof customElements === 'undefined') {
    return
  }

  if (!customElements.get('lidcode-github-link')) {
    customElements.define('lidcode-github-link', LidcodeGithubLink)
  }
  if (!customElements.get('lidcode-badge')) {
    customElements.define('lidcode-badge', LidcodeBadge)
  }
  if (!customElements.get('lidcode-made-by')) {
    customElements.define('lidcode-made-by', LidcodeMadeBy)
  }
}

registerElements()
