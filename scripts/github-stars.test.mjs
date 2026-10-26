import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const source = (
  await readFile(new URL('../public/github-stars.js', import.meta.url), 'utf8')
).replace('void showGithubStars();', 'showGithubStars();');

test('shows the exact current count and does not append it twice', async () => {
  const fixture = createFixture({ count: 12345 });
  await runInNewContext(source, fixture.context);
  assert.equal(fixture.badges.length, 1);
  assert.equal(fixture.badges[0].textContent, '12,345');
  assert.equal(
    fixture.attributes['aria-label'],
    'Star Viteval on GitHub (12,345 stars)'
  );
  fixture.notify();
  assert.equal(fixture.badges.length, 1);
});

test('waits for hydration before changing the button', async () => {
  const fixture = createFixture({ count: 51, isReady: false });
  await runInNewContext(source, fixture.context);
  assert.equal(fixture.badges.length, 0);
  fixture.context.document.documentElement.dataset.cpReady = 'true';
  fixture.notify();
  assert.equal(fixture.badges[0].textContent, '51');
});

test('keeps zero as a valid count', async () => {
  const fixture = createFixture({ count: 0 });
  await runInNewContext(source, fixture.context);
  assert.equal(fixture.badges[0].textContent, '0');
});

test('leaves the link unchanged on an unavailable or invalid GitHub response', async () => {
  for (const options of [
    { count: 51, isOk: false },
    { count: -1 },
    { count: '51' },
    { count: 1.5 },
    { count: 51, isOffline: true },
  ]) {
    const fixture = createFixture(options);
    await runInNewContext(source, fixture.context);
    assert.equal(fixture.badges.length, 0);
  }
});

function createFixture({
  count,
  isReady = true,
  isOk = true,
  isOffline = false,
}) {
  const badges = [];
  const attributes = {};
  let notify = () => {};
  const button = {
    querySelector: () => badges[0],
    append: (badge) => badges.push(badge),
    setAttribute: (key, value) => {
      attributes[key] = value;
    },
  };
  return {
    badges,
    attributes,
    notify: () => notify(),
    context: {
      AbortSignal,
      Intl,
      document: {
        documentElement: { dataset: { cpReady: String(isReady) } },
        querySelectorAll: () => [button],
        createElement: () => ({ setAttribute() {} }),
      },
      fetch: async () => {
        if (isOffline) throw new Error('Offline');
        return { ok: isOk, json: async () => ({ stargazers_count: count }) };
      },
      MutationObserver: function observe(callback) {
        notify = callback;
        return { observe() {} };
      },
    },
  };
}
