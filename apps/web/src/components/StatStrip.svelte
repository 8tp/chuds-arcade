<script lang="ts">
export let stats: Array<{ label: string; value: string }> = [];
</script>

<div class="statgrid">
  {#each stats as stat}
    <div class="statcell">
      <span class="label">{stat.label}</span>
      <span class="value">{stat.value}</span>
    </div>
  {/each}
</div>
