import {
  ANALYSIS_DNS_NOT_FOUND_MESSAGE,
  ANALYSIS_SITE_CONNECTION_MESSAGE,
  ANALYSIS_SITE_TIMEOUT_MESSAGE,
  ANALYSIS_SITE_UNREACHABLE_MESSAGE,
  ANALYSIS_URL_INVALID_MESSAGE,
  toUserFacingSiteUnreachableMessage,
} from "./analysis-user-messages";

describe("toUserFacingSiteUnreachableMessage", () => {
  it("traduit une erreur DNS ENOTFOUND en message clair", () => {
    expect(
      toUserFacingSiteUnreachableMessage("DNS: getaddrinfo ENOTFOUND www.glisstestk.fr"),
    ).toBe(ANALYSIS_DNS_NOT_FOUND_MESSAGE);
  });

  it("traduit une résolution DNS vide", () => {
    expect(toUserFacingSiteUnreachableMessage("Résolution DNS vide")).toBe(
      ANALYSIS_DNS_NOT_FOUND_MESSAGE,
    );
  });

  it("traduit un timeout", () => {
    expect(toUserFacingSiteUnreachableMessage("Timeout")).toBe(ANALYSIS_SITE_TIMEOUT_MESSAGE);
  });

  it("traduit une connexion refusée", () => {
    expect(toUserFacingSiteUnreachableMessage("connect ECONNREFUSED 1.2.3.4:443")).toBe(
      ANALYSIS_SITE_CONNECTION_MESSAGE,
    );
  });

  it("traduit une URL invalide", () => {
    expect(toUserFacingSiteUnreachableMessage("URL invalide")).toBe(ANALYSIS_URL_INVALID_MESSAGE);
  });

  it("traduit une erreur HTTP", () => {
    expect(toUserFacingSiteUnreachableMessage("HTTP 503")).toBe(
      "Le site a renvoyé une erreur et n’a pas pu être analysé.",
    );
  });

  it("renvoie le message générique pour une erreur système inconnue", () => {
    expect(toUserFacingSiteUnreachableMessage("EPERM: operation not permitted")).toBe(
      ANALYSIS_SITE_UNREACHABLE_MESSAGE,
    );
  });

  it("conserve un message déjà lisible", () => {
    expect(toUserFacingSiteUnreachableMessage("Trop de redirections HTTP")).toBe(
      "Trop de redirections HTTP",
    );
  });
});
