<script lang="ts">
import { onMount } from "svelte";
import { type GuestProfile, ensureProfile, rerollProfile, updateHandle } from "../lib/profile";

let profile: GuestProfile | null = null;
let editing = false;
let draftHandle = "";

onMount(() => {
  profile = ensureProfile();
});

function startEdit() {
  if (!profile) return;
  draftHandle = profile.handle;
  editing = true;
}
function commitEdit() {
  if (!draftHandle.trim()) {
    editing = false;
    return;
  }
  profile = updateHandle(draftHandle.trim().slice(0, 24));
  editing = false;
}
function reroll() {
  profile = rerollProfile();
}
</script>

<div class="profile">
  {#if profile}
    <div class="row">
      <div class="avatar screentone" aria-hidden="true">
        <span class="initials">{profile.handle.slice(0, 2).toUpperCase()}</span>
      </div>
      <div class="who">
        {#if editing}
          <input bind:value={draftHandle} on:blur={commitEdit} on:keydown={(e) => e.key === "Enter" && commitEdit()} maxlength="24" autofocus />
        {:else}
          <button class="handle" on:click={startEdit}>@{profile.handle}</button>
        {/if}
        <span class="muted">guest profile · local</span>
      </div>
    </div>

    <dl class="grid-2">
      <div><dt>id</dt><dd>{profile.id}</dd></div>
      <div><dt>since</dt><dd>{profile.createdAt.slice(0, 10)}</dd></div>
    </dl>

    <div class="actions">
      <button class="btn" on:click={reroll}>reroll</button>
      <a class="btn" href="/settings">edit →</a>
    </div>
  {:else}
    <div class="muted">loading profile…</div>
  {/if}
</div>

<style>
  .profile { display: flex; flex-direction: column; gap: 0.75rem; }
  .row { display: flex; gap: 0.75rem; align-items: center; }
  .avatar {
    width: 3rem;
    height: 3rem;
    border: 1px solid var(--color-border);
    display: grid;
    place-items: center;
    font-family: var(--font-display);
    font-weight: 900;
  }
  .initials { font-size: 1rem; }
  .who { display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; }
  .handle {
    background: none;
    border: none;
    padding: 0;
    color: var(--color-fg);
    font-family: var(--font-display);
    font-weight: 900;
    font-size: 1.05rem;
    cursor: pointer;
    text-align: left;
  }
  .handle:hover { text-decoration: underline; }
  input {
    background: var(--color-panel);
    border: 1px solid var(--color-border);
    padding: 0.2rem 0.4rem;
    font-family: var(--font-display);
    font-weight: 900;
    font-size: 1.05rem;
  }
  .muted { font-family: var(--font-mono); font-size: 0.7rem; color: var(--color-fg-muted); }
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.4rem;
    margin: 0;
    font-family: var(--font-mono);
    font-size: 0.7rem;
  }
  .grid-2 dt { color: var(--color-fg-muted); text-transform: uppercase; font-size: 0.6rem; margin: 0; }
  .grid-2 dd { margin: 0; color: var(--color-fg-dim); word-break: break-all; }
  .actions { display: flex; gap: 0.4rem; }
</style>
