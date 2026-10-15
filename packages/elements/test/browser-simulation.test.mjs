import test from 'node:test'
import assert from 'node:assert/strict'

test('Custom Elements browser lifecycle and properties', async () => {
  // Setup minimal DOM mocks in global scope before importing component modules
  class MockShadowRoot {
    innerHTML = ''
  }

  class MockHTMLElement {
    #attributes = new Map()
    shadowRoot = null

    getAttribute(name) {
      return this.#attributes.get(name) ?? null
    }

    setAttribute(name, value) {
      const old = this.getAttribute(name)
      this.#attributes.set(name, String(value))
      if (typeof this.attributeChangedCallback === 'function') {
        this.attributeChangedCallback(name, old, String(value))
      }
    }

    hasAttribute(name) {
      return this.#attributes.has(name)
    }

    removeAttribute(name) {
      this.#attributes.delete(name)
    }

    attachShadow() {
      this.shadowRoot = new MockShadowRoot()
      return this.shadowRoot
    }
  }

  const registered = new Map()
  const mockCustomElements = {
    get(name) {
      return registered.get(name)
    },
    define(name, constructor) {
      registered.set(name, constructor)
    },
  }

  globalThis.HTMLElement = MockHTMLElement
  globalThis.customElements = mockCustomElements
  globalThis.window = globalThis

  // Dynamically import fresh instances
  const { LidcodeGithubLink } = await import('../dist/components/github-link.js')
  const { LidcodeBadge } = await import('../dist/components/badge.js')
  const { LidcodeMadeBy } = await import('../dist/components/made-by.js')
  const { registerElements } = await import('../dist/index.js')

  registerElements()

  assert.equal(mockCustomElements.get('lidcode-github-link'), LidcodeGithubLink)
  assert.equal(mockCustomElements.get('lidcode-badge'), LidcodeBadge)
  assert.equal(mockCustomElements.get('lidcode-made-by'), LidcodeMadeBy)

  // Test LidcodeGithubLink
  const githubEl = new LidcodeGithubLink()
  githubEl.connectedCallback()
  assert.ok(githubEl.shadowRoot)
  assert.match(githubEl.shadowRoot.innerHTML, /href="https:\/\/github\.com\/leandrolid\/lidcode"/)

  githubEl.href = 'https://github.com/leandrolid/custom'
  assert.match(githubEl.shadowRoot.innerHTML, /href="https:\/\/github\.com\/leandrolid\/custom"/)

  // Test LidcodeBadge
  const badgeEl = new LidcodeBadge()
  badgeEl.connectedCallback()
  assert.ok(badgeEl.shadowRoot)
  assert.match(badgeEl.shadowRoot.innerHTML, /A lidcode tool/)

  badgeEl.text = 'Beta Release'
  assert.match(badgeEl.shadowRoot.innerHTML, /Beta Release/)

  // Test LidcodeMadeBy
  const madeByEl = new LidcodeMadeBy()
  madeByEl.connectedCallback()
  assert.ok(madeByEl.shadowRoot)
  assert.match(madeByEl.shadowRoot.innerHTML, /Made by <strong>lidcode<\/strong>/)

  madeByEl.author = 'Lidcode Team'
  madeByEl.href = 'https://lidcode.com'
  assert.match(madeByEl.shadowRoot.innerHTML, /Made by <strong>Lidcode Team<\/strong>/)
  assert.match(madeByEl.shadowRoot.innerHTML, /href="https:\/\/lidcode\.com"/)
})
