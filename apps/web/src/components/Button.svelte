<script lang="ts">
export let href: string | undefined = undefined;
export let variant: "primary" | "secondary" = "primary";
export let onClick: (() => void) | undefined = undefined;
</script>

{#if href}
  <a class="btn {variant === 'primary' ? 'btn-primary' : ''}" {href}>
    <slot />
  </a>
{:else}
  <button class="btn {variant === 'primary' ? 'btn-primary' : ''}" type="button" on:click={() => onClick?.()}>
    <slot />
  </button>
{/if}
