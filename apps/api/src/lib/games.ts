// Server-side registry: slug → ruleset version + which mode requires which
// verification level. The web app's manifests are mirrored here so the
// worker never trusts client-supplied rulesetVersion.

type ServerGame = {
  slug: string;
  rulesetVersion: string;
  modes: Record<
    string,
    {
      dailyEligible: boolean;
      requiredVerification: "client" | "sanity" | "resim" | "server";
    }
  >;
};

export const SERVER_GAMES: Record<string, ServerGame> = {
  "captcha-dungeon": {
    slug: "captcha-dungeon",
    rulesetVersion: "captcha-rules-v1",
    modes: { "daily-dungeon": { dailyEligible: true, requiredVerification: "sanity" } },
  },
  "one-button-samurai": {
    slug: "one-button-samurai",
    rulesetVersion: "obs-rules-v1",
    modes: { "daily-dojo": { dailyEligible: true, requiredVerification: "sanity" } },
  },
  "synth-runner": {
    slug: "synth-runner",
    rulesetVersion: "synth-rules-v1",
    modes: { "daily-song": { dailyEligible: true, requiredVerification: "sanity" } },
  },
  "cursor-wars": {
    slug: "cursor-wars",
    rulesetVersion: "cursor-rules-v1",
    modes: { "daily-bot-arena": { dailyEligible: true, requiredVerification: "sanity" } },
  },
};

export function getServerGame(slug: string): ServerGame | null {
  return SERVER_GAMES[slug] ?? null;
}
