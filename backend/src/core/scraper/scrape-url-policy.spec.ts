import * as dnsPromises from "node:dns/promises";
import { assertUrlSafeForServerFetch } from "./scrape-url-policy";

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
    await expect(assertUrlSafeForServerFetch("http://localhost/foo")).resolves.toMatchObject({ ok: false });
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
    await expect(assertUrlSafeForServerFetch("http://good.example/")).resolves.toEqual({ ok: true });
  });
});
