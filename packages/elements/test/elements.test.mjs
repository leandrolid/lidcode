import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

test('Node environment safety: importing package does not throw', async () => {
  const mod = await import('../dist/index.js')
  assert.ok(mod.LidcodeGithubLink)
  assert.ok(mod.LidcodeBadge)
  assert.ok(mod.LidcodeMadeBy)
  assert.equal(typeof mod.registerElements, 'function')
  assert.doesNotThrow(() => mod.registerElements())
})

test('Server rendering: renderGithubLink', async () => {
  const { renderGithubLink } = await import('../dist/server/index.js')

  const defaultHtml = renderGithubLink()
  assert.match(defaultHtml, /href="https:\/\/github\.com\/leandrolid\/lidcode"/)
  assert.match(defaultHtml, /title="View on GitHub"/)
  assert.match(defaultHtml, /<svg/)
  assert.match(defaultHtml, /class="github-link"/)

  const customHtml = renderGithubLink({
    href: 'https://github.com/myorg/myrepo',
    title: 'My Custom Repo',
    size: 24,
    className: 'custom-class',
  })
  assert.match(customHtml, /href="https:\/\/github\.com\/myorg\/myrepo"/)
  assert.match(customHtml, /title="My Custom Repo"/)
  assert.match(customHtml, /width="24"/)
  assert.match(customHtml, /class="github-link custom-class"/)

  const elementTag = renderGithubLink({ asElement: true })
  assert.equal(
    elementTag,
    '<lidcode-github-link href="https://github.com/leandrolid/lidcode" target="_blank" rel="noopener noreferrer" title="View on GitHub" aria-label="View Lidcode on GitHub (opens in a new tab)" size="19"></lidcode-github-link>',
  )
})

test('Server rendering: renderBadge', async () => {
  const { renderBadge } = await import('../dist/server/index.js')

  const defaultHtml = renderBadge()
  assert.equal(defaultHtml, '<span class="header-tag mono">A lidcode tool</span>')

  const customHtml = renderBadge({ text: 'Custom Badge', className: 'special' })
  assert.equal(customHtml, '<span class="header-tag mono special">Custom Badge</span>')

  const elementTag = renderBadge({ text: 'Custom Badge', asElement: true })
  assert.equal(elementTag, '<lidcode-badge text="Custom Badge"></lidcode-badge>')
})

test('Server rendering: renderMadeBy', async () => {
  const { renderMadeBy } = await import('../dist/server/index.js')

  const defaultHtml = renderMadeBy()
  assert.match(defaultHtml, /href="https:\/\/lidco\.de"/)
  assert.match(defaultHtml, /Made by <strong>lidcode<\/strong>/)
  assert.match(defaultHtml, /<svg/)
  assert.match(defaultHtml, /<span class="sr-only"> \(opens in a new tab\)<\/span>/)

  const customHtml = renderMadeBy({
    href: 'https://example.com',
    author: 'custom author',
    prefix: 'Crafted with passion by',
  })
  assert.match(customHtml, /Crafted with passion by <strong>custom author<\/strong>/)
  assert.match(customHtml, /href="https:\/\/example\.com"/)

  const elementTag = renderMadeBy({ asElement: true })
  assert.equal(
    elementTag,
    '<lidcode-made-by href="https://lidco.de" author="lidcode" prefix="Made by" target="_blank" rel="noopener noreferrer" sr-text="(opens in a new tab)"></lidcode-made-by>',
  )
})

test('Server rendering: renderElementsScriptTag', async () => {
  const { renderElementsScriptTag } = await import('../dist/server/index.js')

  assert.equal(
    renderElementsScriptTag(),
    '<script type="module" src="/bundle.js"></script>',
  )

  assert.equal(
    renderElementsScriptTag({ src: '/static/elements.min.js', defer: true }),
    '<script type="module" src="/static/elements.min.js" defer></script>',
  )
})

test('Standalone bundles are generated', () => {
  const bundlePath = path.resolve(rootDir, 'dist/bundle.js')
  const minBundlePath = path.resolve(rootDir, 'dist/bundle.min.js')

  assert.ok(fs.existsSync(bundlePath), 'dist/bundle.js should exist')
  assert.ok(fs.existsSync(minBundlePath), 'dist/bundle.min.js should exist')

  const bundleContent = fs.readFileSync(bundlePath, 'utf8')
  assert.match(bundleContent, /lidcode-github-link/)
  assert.match(bundleContent, /lidcode-badge/)
  assert.match(bundleContent, /lidcode-made-by/)
})
