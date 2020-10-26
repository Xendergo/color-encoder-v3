<script>
  export let label;
  export let value;
</script>

<style>
  div {
    display: flex;
    align-items: center;
  }

  label {
    padding: 8px;
  }

  input {
    margin: 4px;
    margin-left: 0;
  }
</style>

<div>
  <input type="number" id={label} bind:value step="any" />
  <label for={label}>{label}</label>
</div>
