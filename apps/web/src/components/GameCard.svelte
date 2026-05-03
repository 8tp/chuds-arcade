<script lang="ts">
import type { GameManifest } from "@chuds/arcade-sdk";
export let manifest: GameManifest;
export let index = 0;
</script>

<a class="gcard" href={`/g/${manifest.slug}`}>
  <span class="gcard-stamp">ep. {String(index + 1).padStart(2, "0")}</span>
  <div class="gcard-thumb" style={`background-image: url(${manifest.thumbnail})`}></div>
  <div class="gcard-body">
    <h3 class="gcard-title">{manifest.title}</h3>
    <p class="gcard-tagline">{manifest.tagline}</p>
    <div class="gcard-tags">
      {#each manifest.tags as tag}
        <span class="pill">{tag}</span>
      {/each}
    </div>
  </div>
</a>
