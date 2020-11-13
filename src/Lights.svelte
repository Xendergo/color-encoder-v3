<script>
  export let socket;
  import Slider from "./Slider.svelte";
  import Checkbox from "./Checkbox.svelte";
  export let color = {
    r: 255,
    g: 0,
    b: 255,
    w: 0,
    a: 255,
  };

  $: {
    socket.send(
      JSON.stringify({
        cmd: "color",
        ...color
      })
    );
  }

  export let brightness = 32;

  $: {
    socket.send(
      JSON.stringify({
        cmd: "brightness",
        brightness,
      })
    );
  }

  export let enable = true;

  $: {
    socket.send(JSON.stringify({ cmd: "enable", enable }));
  }

  export let warning = true;

  $: {
    socket.send(JSON.stringify({ cmd: "warning", warning }));
  }
</script>

<div style="display:block">
  <Slider
    bind:value={color.r}
    gradient="linear-gradient(to right, rgb(0, {color.g}, {color.b}), rgb(255, {color.g}, {color.b}))"
    label="Red"
    color="rgb({color.r}, 0, 0)" /><br />
  <Slider
    bind:value={color.g}
    gradient="linear-gradient(to right, rgb({color.r}, 0, {color.b}), rgb({color.r}, 255, {color.b}))"
    label="Green"
    color="rgb(0, {color.g}, 0)" /><br />
  <Slider
    bind:value={color.b}
    gradient="linear-gradient(to right, rgb({color.r}, {color.g}, 0), rgb({color.r}, {color.g}, 255))"
    label="Blue"
    color="rgb(0, 0, {color.b})" /><br />
  <Slider
    bind:value={color.w}
    gradient="linear-gradient(to right, black, white)"
    label="White"
    color="rgb({color.w}, {color.w}, {color.w})" /><br />
  <Slider
    bind:value={color.a}
    gradient="linear-gradient(to right, rgba(255, 255, 255, 0), rgba(255, 255, 255, 1))"
    label="Alpha"
    color="rgba(255, 255, 255, {color.a / 255})" /><br /><br /><br /><br />

  <Slider
    bind:value={brightness}
    gradient="linear-gradient(to right, black, white)"
    label="Brightness"
    color="rgb({color.w}, {color.w}, {color.w})" /><br />
  <Checkbox bind:value={enable} label="Enabled" />
  <Checkbox bind:value={warning} label="Warning" />
</div>
