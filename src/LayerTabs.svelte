<script>
  import Layer from "./Layer.svelte";

  export let audio;

  export let color;
  export let scale;
  export let layers;

  let visible = null;

  export function startRender(audiot) {
    audio = audiot;
    visible = 0;
  }

  function save() {
    layers = layers; // Force the thing that detects changes in layers to save
  }
</script>

<style>
  #layers {
    height: 5vh;
    position: fixed;
    left: 0;
    top: 57vh;

    outline: white inset 2px;

    display: flex;
  }

  .layerSelect {
    width: 5vh;
    height: 5vh;

    display: flex;
    justify-content: center;
    align-items: center;

    margin: 0;
  }
</style>

{#if visible !== null}
  <div id="layers">
    {#each layers as layer, i}
      <div
        style="background-color: {visible === i ? 'rgba(255, 0, 128, 0.2)' : 'black'}; left: {i * 5}vh"
        class="layerSelect"
        on:click={function () {
          visible = i;
        }}>
        {i}
      </div>
    {/each}
    <div
      class="layerSelect"
      on:click={function () {
        visible = layers.length;
        layers.push({
          seq: [],
          alpha: 255,
          type: 'switch',
          blend: 'normal',
          exp: 1,
        });
        setTimeout(() => {
          layers[layers.length - 1].drawLoop();
        }, 1);
      }}>
      +
    </div>
  </div>
{/if}

{#each layers as layer, i}
  <Layer
    {scale}
    {save}
    seq={layer.seq}
    {color}
    bind:alpha={layer.alpha}
    bind:type={layer.type}
    bind:blend={layer.blend}
    bind:exp={layer.exp}
    bind:drawLoop={layer.drawLoop}
    bind:getColor={layer.getColor}
    visible={visible === i}
    deleteFunction={function () {
      if (layers.length > 1 && confirm('Are you sure?')) {
        layers.splice(i, 1);
        visible--;

        if (visible < 0) {
          visible = 0;
        }
      }
    }}
    {audio} />
{/each}
