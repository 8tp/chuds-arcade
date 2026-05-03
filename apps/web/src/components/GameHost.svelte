<script lang="ts">
import type { GameInstance } from "@chuds/arcade-sdk";
import { onDestroy, onMount } from "svelte";
import { getManifest, loadGame } from "../lib/games";
import { ensureProfile } from "../lib/profile";
import { buildRuntime, startRun } from "../lib/runtime";

export let slug: string;
export let mode: string | undefined = undefined;
export let daily = true;

let mountEl: HTMLDivElement;
let instance: GameInstance | null = null;
let status: "idle" | "loading" | "ready" | "error" = "idle";
let error: string | null = null;

onMount(async () => {
  status = "loading";
  const manifest = getManifest(slug);
  if (!manifest) {
    status = "error";
    error = `Unknown game: ${slug}`;
    return;
  }
  const resolvedMode = mode ?? manifest.modes[0]?.id;
  if (!resolvedMode) {
    status = "error";
    error = `No mode declared for ${slug}`;
    return;
  }
  try {
    const player = ensureProfile();
    const run = await startRun({
      player,
      gameSlug: slug,
      mode: resolvedMode,
      rulesetVersion: manifest.rulesetVersion,
      daily,
    });
    const game = await loadGame(slug);
    if (!game) {
      status = "error";
      error = `Game module not found: ${slug}`;
      return;
    }
    const runtime = buildRuntime(player, run);
    instance = game.mount(mountEl, runtime);
    instance.start();
    status = "ready";
  } catch (e) {
    status = "error";
    error = e instanceof Error ? e.message : String(e);
  }
});

onDestroy(() => {
  instance?.destroy();
});
</script>

<div class="game-host">
  {#if status === "loading"}
    <div class="status">// loading {slug}…</div>
  {:else if status === "error"}
    <div class="status error">// error: {error}</div>
  {/if}
  <div class="mount" bind:this={mountEl}></div>
</div>

<style>
  .game-host {
    display: flex;
    flex-direction: column;
    min-height: 480px;
  }
  .status {
    padding: 0.6rem 0.85rem;
    font-family: var(--font-mono);
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-fg-muted);
  }
  .error { color: var(--color-fg); border-bottom: 1px solid var(--color-fg); }
  .mount {
    flex: 1;
    display: grid;
    place-items: center;
    min-height: 480px;
  }
</style>
