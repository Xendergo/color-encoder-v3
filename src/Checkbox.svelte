<script>
  export let value;
  export let label;

  function setDefault(node) {
    node.checked = value;
  }
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
    margin: 0;
  }
</style>

<div>
  <input id={label} type="checkbox" bind:checked={value} use:setDefault />
  <label for={label}>{label}</label>
</div>
