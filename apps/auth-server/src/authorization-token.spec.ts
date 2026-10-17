import assert from 'node:assert/strict'
import { test } from 'node:test'
import { eq } from 'drizzle-orm'
import { authorizationBindings } from './infra/adapters/drizzle/schemas/index.js'
import {
  createAuthorizationStore,
  credentialDigest,
} from './infra/repositories/authorization-store.js'
import { createHttpFixture } from './test/http.js'
import {
  approveCode,
  createTestClients,
  exchangeCode,
  registerUser,
  tokenRequest,
} from './test/oauth.js'

test('code and rotated token outputs all retain the input lifecycle across later reapproval', async () => {
  const fixture = await createHttpFixture()
  try {
    const { alpha } = await createTestClients(fixture)
    const { browser, user } = await registerUser(fixture)
    const store = createAuthorizationStore(fixture.store.database)
    const code = await approveCode(browser, alpha)
    const original = await store.resolve('code', code.code)
    assert.ok(original)
    const tokens = await exchangeCode(fixture, alpha, code)
    assert.ok(tokens.refresh_token)
    assert.equal(
      (await store.resolve('access', tokens.access_token))?.authorization.id,
      original.authorization.id,
    )
    assert.equal(
      (await store.resolve('refresh', tokens.refresh_token))?.authorization.id,
      original.authorization.id,
    )
    const renewal = await tokenRequest(fixture, alpha, {
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh_token,
      resource: alpha.resource,
    })
    assert.equal(renewal.status, 200)
    const rotated = await renewal.json()
    assert.equal(
      (await store.resolve('access', rotated.access_token))?.authorization.id,
      original.authorization.id,
    )
    assert.equal(
      (await store.resolve('refresh', rotated.refresh_token))?.authorization.id,
      original.authorization.id,
    )
    const pending = await approveCode(browser, alpha)
    await store.revoke(user.id, alpha.client_id)
    const fresh = await approveCode(browser, alpha)
    const freshBinding = await store.resolve('code', fresh.code)
    assert.ok(freshBinding)
    assert.notEqual(freshBinding.authorization.id, original.authorization.id)
    const attempts: Record<string, string>[] = [
      {
        grant_type: 'refresh_token',
        refresh_token: rotated.refresh_token,
        resource: alpha.resource,
      },
      {
        grant_type: 'authorization_code',
        code: pending.code,
        code_verifier: pending.verifier,
        redirect_uri: alpha.redirect_uris[0] ?? '',
        resource: alpha.resource,
      },
    ]
    for (const fields of attempts) {
      const response = await tokenRequest(fixture, alpha, fields)
      assert.ok(response.status >= 400)
      assert.ok(!(await response.json()).access_token)
    }
    assert.equal(await store.resolve('access', rotated.access_token), null)
    assert.equal(await store.resolve('refresh', rotated.refresh_token), null)
  } finally {
    await fixture.close()
  }
})

test('missing code bindings and failed output persistence withhold native credentials', async () => {
  const fixture = await createHttpFixture()
  try {
    const { alpha } = await createTestClients(fixture)
    const { browser } = await registerUser(fixture)
    const code = await approveCode(browser, alpha)
    await fixture.store.database
      .delete(authorizationBindings)
      .where(eq(authorizationBindings.digest, credentialDigest(code.code)))
    const missing = await tokenRequest(fixture, alpha, {
      grant_type: 'authorization_code',
      code: code.code,
      code_verifier: code.verifier,
      redirect_uri: alpha.redirect_uris[0] ?? '',
      resource: alpha.resource,
    })
    assert.equal(missing.status, 400)
    assert.ok(!(await missing.json()).access_token)
    const another = await approveCode(browser, alpha)
    await fixture.store.pool.query(`
      CREATE FUNCTION deny_access_binding() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN IF NEW.kind = 'access' THEN RAISE EXCEPTION 'test persistence failure'; END IF; RETURN NEW; END $$;
      CREATE TRIGGER deny_access_binding BEFORE INSERT ON authorization_bindings FOR EACH ROW EXECUTE FUNCTION deny_access_binding();
    `)
    const failed = await tokenRequest(fixture, alpha, {
      grant_type: 'authorization_code',
      code: another.code,
      code_verifier: another.verifier,
      redirect_uri: alpha.redirect_uris[0] ?? '',
      resource: alpha.resource,
    })
    assert.equal(failed.status, 503)
    assert.deepEqual(await failed.json(), { error: 'temporarily_unavailable' })
  } finally {
    await fixture.close()
  }
})
