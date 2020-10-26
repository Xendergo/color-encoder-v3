<script>
  export let value;
  export let gradient;
  export let label;
  export let color;

  function setColor(node) {
    node.style.setProperty(`--slider`, color);
    node.value = value;
  }
</script>

<style>
  div {
    display: flex;
    align-items: center;
  }

  input {
    --slider: white;
    margin: 0;
  }

  label {
    padding: 8px;
  }

  #slider::-webkit-slider-thumb {
    background-color: var(--slider);
  }

  #slider::-moz-range-thumb {
    background-color: var(--slider);
  }
</style>

<div>
  <input
    id="slider"
    type="range"
    min="0"
    max="255"
    value="255"
    style="background-image: {gradient}"
    on:input={function () {
      value = parseInt(this.value);
      this.style.setProperty(`--slider`, color);
    }}
    use:setColor />
  <label for="slider">{value} - {label}</label>
</div>
