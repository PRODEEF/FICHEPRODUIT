import * as dnsPromises from "node:dns/promises";
import { assertUrlSafeForServerFetch, fetchHtmlSafeForServer } from "./scrape-url-policy";

describe("assertUrlSafeForServerFetch", () => {
  let lookupSpy: jest.SpiedFunction<typeof dnsPromises.lookup>;

  beforeAll(() => {
    lookupSpy = jest.spyOn(dnsPromises, "lookup");
  });

  afterAll(() => {
    lookupSpy.mockRestore();
  });

  beforeEach(() => {
    lookupSpy.mockReset();
  });

  it("refuse file:", async () => {
    const r = await assertUrlSafeForServerFetch("file:///etc/passwd");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain("Protocole");
  });

  it("refuse 127.0.0.1", async () => {
    await expect(assertUrlSafeForServerFetch("http://127.0.0.1/")).resolves.toEqual({
      ok: false,
      reason: "Adresse IP non autorisée",
    });
  });

  it("refuse localhost", async () => {
    await expect(assertUrlSafeForServerFetch("http://localhost/foo")).resolves.toMatchObject({
      ok: false,
    });
  });

  it("accepte une IP publique littérale", async () => {
    await expect(assertUrlSafeForServerFetch("http://1.1.1.1/")).resolves.toEqual({ ok: true });
  });

  it("refuse si le DNS renvoie une IP privée", async () => {
    lookupSpy.mockResolvedValue([{ address: "10.0.0.1", family: 4 }] as never);
    await expect(assertUrlSafeForServerFetch("http://evil.example/")).resolves.toEqual({
      ok: false,
      reason: "La résolution DNS pointe vers une adresse privée ou locale",
    });
    expect(lookupSpy).toHaveBeenCalledWith("evil.example", { all: true, verbatim: true });
  });

  it("accepte si le DNS renvoie une IP publique", async () => {
    lookupSpy.mockResolvedValue([{ address: "1.1.1.1", family: 4 }] as never);
    await expect(assertUrlSafeForServerFetch("http://good.example/")).resolves.toEqual({
      ok: true,
    });
  });
});

describe("fetchHtmlSafeForServer", () => {
  const originalFetch = global.fetch;
  let redirectLookupSpy: jest.SpiedFunction<typeof dnsPromises.lookup>;

  beforeAll(() => {
    redirectLookupSpy = jest.spyOn(dnsPromises, "lookup");
  });

  afterAll(() => {
    redirectLookupSpy.mockRestore();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    redirectLookupSpy.mockReset();
    jest.restoreAllMocks();
  });

  it("re-valide l’URL après une redirection", async () => {
    redirectLookupSpy.mockResolvedValue([{ address: "1.1.1.1", family: 4 }] as never);

    global.fetch = jest.fn().mockResolvedValueOnce(
      new Response(null, {
        status: 302,
        headers: { Location: "http://127.0.0.1/" },
      }),
    ) as typeof fetch;

    const result = await fetchHtmlSafeForServer("http://good.example/", {
      timeoutMs: 5000,
      userAgent: "test",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Adresse IP non autorisée");
    }
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://good.example/",
      expect.objectContaining({ redirect: "manual" }),
    );
  });
});
