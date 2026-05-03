<script lang="ts">
export let heading = "";
export let action = "";
export let actionHref = "";
/** Override the right-side metadata text in the title bar. */
export let meta = "";
</script>

<section class="win">
  {#if heading || meta}
    <header class="win-title">
      <span class="left">
        <span class="dots"><span></span><span></span><span></span></span>
        <span>// {heading}</span>
      </span>
      {#if action}
        {#if actionHref}
          <a class="right action" href={actionHref}>{action} →</a>
        {:else}
          <span class="right">{action}</span>
        {/if}
      {:else if meta}
        <span class="right">{meta}</span>
      {/if}
    </header>
  {/if}
  <div class="win-body">
    <slot />
  </div>
</section>

<style>
  .left { display: inline-flex; align-items: center; gap: 0.5rem; }
  .action:hover { color: var(--color-panel); text-decoration: underline; }
</style>
