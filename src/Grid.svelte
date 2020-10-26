<script>
  import Number from "./Number.svelte";
  import Checkbox from "./Checkbox.svelte";

  export let interval;
  export let offset;
  export let enabled;
</script>

<style>
  div {
    position: fixed;
    bottom: 39vh;
    right: 16px;
  }
</style>

<div>
  {#if enabled}
    <Number bind:value={interval} label="Interval (ms)" />
    <Number bind:value={offset} label="Offset (ms)" />
  {/if}
  <Checkbox bind:value={enabled} label="Enable snapping" />
</div>
