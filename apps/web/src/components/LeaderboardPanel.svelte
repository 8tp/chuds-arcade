<script lang="ts">
import type { RunResult } from "@chuds/arcade-sdk";
import { onMount } from "svelte";
import { loadLocalRuns } from "../lib/runtime";

export let gameSlug: string | undefined = undefined;
export let mode: string | undefined = undefined;
export let limit = 10;

let entries: RunResult[] = [];

onMount(() => {
  let runs = loadLocalRuns();
  if (gameSlug) runs = runs.filter((r) => r.gameSlug === gameSlug);
  if (mode) runs = runs.filter((r) => r.mode === mode);
  entries = runs.sort((a, b) => b.score - a.score).slice(0, limit);
});

function deltaClass(i: number): string {
  if (i === 0) return "delta-up";
  if (i === entries.length - 1 && entries.length > 1) return "delta-down";
  return "delta-flat";
}
</script>

{#if entries.length === 0}
  <div class="empty">
    <span class="ascii-rule">— no runs yet — play a daily to seed the board —</span>
  </div>
{:else}
  <ol class="board" aria-label="recent runs">
    {#each entries as entry, i}
      <li>
        <span class="rank" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
        <span class="name {deltaClass(i)}" aria-label="rank {i + 1}">{entry.gameSlug}</span>
        <span class="score">{entry.score.toLocaleString()}</span>
        <span class="muted" aria-hidden="true">{entry.outcome}</span>
      </li>
    {/each}
  </ol>
{/if}

<style>
  .empty { text-align: center; padding: 0.5rem 0; }
  .muted { color: var(--color-fg-muted); font-size: 0.7rem; text-transform: uppercase; }
</style>
