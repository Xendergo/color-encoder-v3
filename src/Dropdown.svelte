<script>
  export let value;
  export let label;
  export let options;
</script>

<style>
  div {
    display: flex;
    align-items: center;
  }

  select {
    margin: 4px;
    margin-left: 0;

    color: white;
    background-color: transparent;

    border: 2px solid white;
    appearance: none;
  }
</style>

<div>
  <select bind:value name="input">
    {#each options as option}
      <option value={option.value}>{option.name}</option>
    {/each}
  </select>
  <label for="input">- {label}</label>
</div>
