<script>
  import Lights from "./Lights.svelte";
  import Load from "./Load.svelte";
  import Waveform from "./Waveform.svelte";
  export let socket;
  export let color;
  export let brightness;
  export let enable;
  export let warning;
  export let audio;
  let allowRender;
  let render;
  let layers = [];
</script>

<svelte:head>
  <title>Color Encoder v3</title>
  <style>
    body {
      background-color: black;
      color: white;
    }

    input[type="range"] {
      -webkit-appearance: none;
      height: 15px;
      border-radius: 7.5px;
      outline: none;
      padding: 0;
    }

    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 22.5px;
      height: 22.5px;
      border-radius: 50%;
      cursor: pointer;
      border: 2px solid white;
    }

    input[type="range"]::-moz-range-thumb {
      width: 22.5px;
      height: 22.5px;
      border-radius: 50%;
      cursor: pointer;
      border: 2px solid white;
    }

    input {
      border: 2px solid white;
      background: none;
      color: white;

      margin: 4px;
    }

    #container {
      display: flex;
      align-items: flex-start;
    }
  </style>
</svelte:head>

<main>
  <div id="container">
    <Lights {socket} bind:render bind:color bind:brightness bind:enable bind:warning />
    <Load {audio} {allowRender} bind:layers />
    <Waveform bind:audio bind:allowRender bind:layers {color} {socket} rendery={render}/>
  </div>
</main>
