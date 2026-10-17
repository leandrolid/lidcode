import assert from 'node:assert/strict'
import { setTimeout } from 'node:timers/promises'
import { test } from 'node:test'
import { createHttpFixture, json } from './test/http.js'
import {
  approveCode,
  authorizationQuery,
  createBrowser,
  createTestClients,
  exchangeCode,
  introspect,
  registerUser,
  responseRedirect,
  tokenRequest,
  userInfo,
} from './test/oauth.js'

for (const grant of ['authorization_code', 'refresh_token'] as const) {
  test(`${grant} racing revoke/reapproval cannot release descendants into the new lifecycle across instances`, async () => {
    const first = await createHttpFixture()
    const second = await createHttpFixture({ databaseUrl: first.store.url })
    const barrier = await first.store.pool.connect()
    let pending: Promise<Response> | undefined
    try {
      const { alpha, beta } = await createTestClients(first)
      const { browser } = await registerUser(first)
      const remoteBrowser = createBrowser(second, browser.cookie)
      const alphaTokens = await exchangeCode(first, alpha, await approveCode(browser, alpha))
      const betaTokens = await exchangeCode(first, beta, await approveCode(browser, beta))
      const code = await approveCode(browser, alpha)
      assert.ok(alphaTokens.refresh_token)
      await first.store.pool.query(`
        CREATE FUNCTION pause_native_issuance() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN PERFORM pg_advisory_xact_lock(50037, 1); RETURN NEW; END $$;
        CREATE TRIGGER pause_native_issuance BEFORE INSERT ON oauth_refresh_token
          FOR EACH ROW EXECUTE FUNCTION pause_native_issuance();
      `)
      await barrier.query('SELECT pg_advisory_lock(50037, 1)')
      const fields: Record<string, string> =
        grant === 'authorization_code'
          ? {
              grant_type: grant,
              code: code.code,
              code_verifier: code.verifier,
              redirect_uri: alpha.redirect_uris[0] ?? '',
              resource: alpha.resource,
            }
          : {
              grant_type: grant,
              refresh_token: alphaTokens.refresh_token,
              resource: alpha.resource,
            }
      pending = tokenRequest(first, alpha, fields)
      let blocked = false
      for (let attempt = 0; attempt < 250; attempt++) {
        const waiting = await first.store.pool.query<{ blocked: boolean }>(`
          SELECT EXISTS (SELECT 1 FROM pg_locks WHERE locktype = 'advisory' AND NOT granted
            AND classid = 50037 AND database = (SELECT oid FROM pg_database WHERE datname = current_database())) AS blocked
        `)
        if (waiting.rows[0]?.blocked) {
          blocked = true
          break
        }
        await setTimeout(20)
      }
      assert.ok(blocked, 'Native token issuance must reach the database barrier')
      const revoke = await remoteBrowser.request(`/api/v1/authorized-apps/${alpha.client_id}`, {
        method: 'DELETE',
      })
      assert.equal(revoke.status, 200)
      assert.equal(
        (await (await introspect(second, alpha, alphaTokens.access_token)).json()).active,
        false,
      )
      assert.equal((await userInfo(second, alphaTokens.access_token)).status, 401)
      const reconnect = authorizationQuery(alpha)
      const consent = await responseRedirect(
        await remoteBrowser.request(`/api/auth/oauth2/authorize?${reconnect.query}`),
      )
      assert.equal(
        consent.pathname,
        '/consent',
        'An existing central session must still approve reconnect',
      )
      const callback = await responseRedirect(
        await remoteBrowser.request(
          '/api/auth/oauth2/consent',
          json({
            accept: true,
            oauth_query: consent.search.slice(1),
          }),
        ),
      )
      const freshCode = callback.searchParams.get('code')
      assert.ok(freshCode)
      await barrier.query('SELECT pg_advisory_unlock(50037, 1)')
      const raced = await pending
      assert.ok(raced.status >= 400)
      assert.ok(!(await raced.json()).access_token)
      const fresh = await exchangeCode(second, alpha, {
        code: freshCode,
        verifier: reconnect.verifier,
        query: reconnect.query,
      })
      assert.equal((await (await introspect(first, alpha, fresh.access_token)).json()).active, true)
      assert.equal(
        (await (await introspect(second, alpha, alphaTokens.access_token)).json()).active,
        false,
      )
      assert.equal(
        (await (await introspect(second, beta, betaTokens.access_token)).json()).active,
        true,
      )
      const oldAttempts: Record<string, string>[] = [
        {
          grant_type: 'refresh_token',
          refresh_token: alphaTokens.refresh_token,
          resource: alpha.resource,
        },
        {
          grant_type: 'authorization_code',
          code: code.code,
          code_verifier: code.verifier,
          redirect_uri: alpha.redirect_uris[0] ?? '',
          resource: alpha.resource,
        },
      ]
      for (const oldFields of oldAttempts) {
        const old = await tokenRequest(second, alpha, oldFields)
        assert.ok(old.status >= 400)
        assert.ok(!(await old.json()).access_token)
      }
    } finally {
      await barrier.query('SELECT pg_advisory_unlock_all()')
      barrier.release()
      await pending?.catch(() => undefined)
      await second.close()
      await first.close()
    }
  })
}
