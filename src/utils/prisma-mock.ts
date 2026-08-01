/**
 * A single, self-extending Prisma mock shared by every service test suite.
 *
 * Rather than hand-listing the delegate methods each entity touches, this is a Proxy that lazily
 * mints a stable `jest.fn()` the first time any `prisma.<model>.<method>` is accessed. Two Prisma
 * idioms get special default implementations so the services-under-test behave naturally:
 *
 *  - `$transaction(cb)` runs the interactive callback against the same mock (`cb(mockPrisma)`).
 *  - `<model>.paginate(args).withPages(pageArgs)` — the fluent `prisma-extension-pagination` API —
 *    where `paginate()` returns `{ withPages }` and tests drive `<model>.withPages` directly.
 *
 * Jest's `moduleNameMapper` redirects `datasources/prisma` to this file for the whole test run
 * (see jest.config.ts), so the service-under-test's `getPrismaInstance()` returns `mockPrisma`
 * without any `jest.mock(...)` boilerplate. A test just reads and drives the proxy:
 *
 *   import { mockPrisma, resetPrismaMock } from 'utils/prisma-mock';
 *   const prisma = mockPrisma;
 *   beforeEach(() => resetPrismaMock());
 */

// Dynamic Jest proxy: model/method access is intentionally loose for test stubs.
// biome-ignore lint/suspicious/noExplicitAny: Prisma mock proxy must allow arbitrary delegate access
export type MockedPrisma = Record<string, any>;

const registry = new Map<string, jest.Mock>();

function applyDefaultImpl(key: string, fn: jest.Mock): void {
  if (key === "$transaction") {
    // Interactive transaction: run the callback against the same mock; pass arrays through.
    fn.mockImplementation((arg: unknown) =>
      typeof arg === "function" ? (arg as (tx: unknown) => unknown)(mockPrisma) : arg,
    );
    return;
  }
  if (key.endsWith(".paginate")) {
    const model = key.slice(0, key.lastIndexOf("."));
    fn.mockImplementation(() => ({ withPages: fnFor(`${model}.withPages`) }));
  }
}

function fnFor(key: string): jest.Mock {
  let fn = registry.get(key);
  if (!fn) {
    fn = jest.fn();
    registry.set(key, fn);
    applyDefaultImpl(key, fn);
  }
  return fn;
}

const modelCache = new Map<string, unknown>();

function modelProxy(model: string): unknown {
  return new Proxy(
    {},
    {
      get(_target, method) {
        if (typeof method !== "string") return undefined;
        return fnFor(`${model}.${method}`);
      },
    },
  );
}

export const mockPrisma = new Proxy<MockedPrisma>(
  {},
  {
    get(_target, prop) {
      if (typeof prop !== "string") return undefined;
      if (prop === "then") return undefined; // never let the proxy masquerade as a thenable
      if (prop === "$transaction") return fnFor("$transaction");
      if (!modelCache.has(prop)) modelCache.set(prop, modelProxy(prop));
      return modelCache.get(prop);
    },
  },
);

/** Reset every stubbed method (clears calls + implementations) and re-wire the special defaults. */
export function resetPrismaMock(): void {
  for (const [key, fn] of registry) {
    fn.mockReset();
    applyDefaultImpl(key, fn);
  }
}

/**
 * Stand-in for the real `datasources/prisma` export. Because `moduleNameMapper` maps
 * `datasources/prisma` to this module during tests, services that call `getPrismaInstance()` at
 * import time transparently receive the shared mock.
 */
export const getPrismaInstance = () => mockPrisma;
