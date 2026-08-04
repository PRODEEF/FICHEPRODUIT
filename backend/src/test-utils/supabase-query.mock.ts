/** Mock chainable PostgREST pour les tests de repositories. */
export function buildSupabaseQueryMock(result: { data?: unknown; error?: unknown }) {
  const terminal = {
    maybeSingle: jest.fn().mockResolvedValue(result),
    single: jest.fn().mockResolvedValue(result),
    limit: jest.fn().mockResolvedValue(result),
  };

  const chain: Record<string, jest.Mock> = {
    from: jest.fn(),
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    eq: jest.fn(),
    in: jest.fn(),
    ilike: jest.fn(),
    contains: jest.fn(),
    order: jest.fn(),
    gte: jest.fn(),
    lte: jest.fn(),
    ...terminal,
  };

  for (const key of Object.keys(chain)) {
    if (key === "maybeSingle" || key === "single" || key === "limit") continue;
    chain[key]!.mockReturnValue(chain);
  }

  return chain;
}

export function createSupabaseServiceMock(userClient: ReturnType<typeof buildSupabaseQueryMock>) {
  const adminClient = buildSupabaseQueryMock({ data: null, error: null });
  return {
    forUser: jest.fn().mockReturnValue(userClient),
    admin: adminClient,
    anon: userClient,
    getUser: jest.fn(),
  };
}
