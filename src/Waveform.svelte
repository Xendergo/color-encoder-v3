<script>
  import { onMount } from "svelte";
  import LayerTabs from "./LayerTabs.svelte";

  export let color;

  export let socket;

  export let allowRender;
  export let audio;

  export let rendery;

  let layerTabs;
  export let layers = [];

  $: {
    socket.send(JSON.stringify({ cmd: "save", layers }));
  }

  let dragging = false;
  let clicked = false;

  let scale = [0, 1];

  let gridEnabled = false;
  let interval = 500;
  let offset = 0;

  let c;
  let draw;

  onMount(() => {
    draw = c.getContext("2d");
  });

  let len;

  allowRender = (audiot) => {
    audio = audiot;
    len = audio.buffer.length;

    layerTabs.startRender(audio);

    requestAnimationFrame(render);
  };

  function render() {
    draw.fillStyle = "#000000";
    draw.fillRect(0, 0, w, h);

    draw.lineWidth = 1;
    draw.strokeStyle = "#ff0080";
    for (let i = 0; i < w; i++) {
      // let point =
      //   audio.buffer[
      //     Math.round(remap(i, 0, w, scale[0] * len, scale[1] * len))
      //   ];
      let pos1 = Math.round(remap(i, 0, w, scale[0] * len, scale[1] * len));
      let pos2 = Math.min(
        Math.round(remap(i + 1, 0, w, scale[0] * len, scale[1] * len)),
        pos1 + 200
      );
      let point = avg(pos1, pos2);
      draw.beginPath();
      draw.moveTo(i, h / 2);
      draw.lineTo(i, h / 2 + (point * h) / 2);
      draw.stroke();
    }

    draw.strokeStyle = "#ffffff";
    let pos = remap(
      audio.time,
      audio.length * scale[0],
      audio.length * scale[1],
      0,
      w
    );
    draw.beginPath();
    draw.moveTo(pos, h);
    draw.lineTo(pos, 0);
    draw.stroke();

    draw.setLineDash([16, 16]);
    pos = remap(
      audio.stopTime,
      audio.length * scale[0],
      audio.length * scale[1],
      0,
      w
    );
    draw.beginPath();
    draw.moveTo(pos, h);
    draw.lineTo(pos, 0);
    draw.stroke();
    draw.setLineDash([]);

    requestAnimationFrame(render);
  }

  const intervalTime = 1000;
  const times = 4;
  const wait = intervalTime/(times+1);

  onMount(() => {
    setInterval(() => {
      if (audio && audio.playing) {
        const data = [];

        for (let t = 0; t < times; t += 1) {
          let c = {
            r: 0,
            g: 0,
            b: 0,
            w: 0,
          };

          const timeStep = audio.time + t*wait*audio.playbackSpeed;

          for (let i = layers.length - 1; i >= 0; i--) {
            const layer = layers[i];

            const toAdd = layer.getColor(timeStep);
            const a = (toAdd.a / 255) * (layer.alpha / 255);
            if (layer.blend === "normal") {
              const newC = {};

              newC.r = lerp(c.r, toAdd.r, a);
              newC.g = lerp(c.g, toAdd.g, a);
              newC.b = lerp(c.b, toAdd.b, a);
              newC.w = lerp(c.w, toAdd.w, a);

              c = newC;
            } else if (layer.blend === "additive") {
              c.r += toAdd.r * a;
              c.g += toAdd.g * a;
              c.b += toAdd.b * a;
              c.w += toAdd.w * a;
            } else if (layer.blend === "multiply") {
              const newC = {};

              newC.r = c.r * (toAdd.r / 255);
              newC.g = c.g * (toAdd.g / 255);
              newC.b = c.b * (toAdd.b / 255);
              newC.w = c.w * (toAdd.w / 255);

              c.r = lerp(c.r, newC.r, a);
              c.g = lerp(c.g, newC.g, a);
              c.b = lerp(c.b, newC.b, a);
              c.w = lerp(c.w, newC.w, a);
            }
          }

          c.r = Math.min(255, c.r);
          c.g = Math.min(255, c.g);
          c.b = Math.min(255, c.b);
          c.w = Math.min(255, c.w);
          c.a = Math.min(255, c.a);

          data.push(c.r);
          data.push(c.g);
          data.push(c.b);
          data.push(c.w);
        }

        console.log(data[2]);

        socket.send(JSON.stringify({ cmd: "color", c: data }));
      }
    }, intervalTime);
  });

  function avg(index, j) {
    let v = 0;
    for (let i = index; i < j; i++) {
      v += audio.buffer[i];
    }
    return v / (j - index);
  }

  let w = window.innerWidth;
  let h = window.innerHeight * 0.33;

  window.addEventListener("resize", () => {
    w = window.innerWidth;
    h = window.innerHeight * 0.33;
  });

  function remap(value, low1, high1, low2, high2) {
    return low2 + ((high2 - low2) * (value - low1)) / (high1 - low1);
  }

  function lerp(x1, x2, amt) {
    return x1 * (1 - amt) + x2 * amt;
  }
</script>

<style>
  canvas {
    position: fixed;
    top: 67vh;
    left: 0;
  }
</style>

<LayerTabs {scale} {color} bind:this={layerTabs} render={rendery} bind:layers />
<canvas
  width={w}
  height={h}
  bind:this={c}
  on:mousedown={function () {
    clicked = true;
  }}
  on:mouseup={function (e) {
    if (!dragging) {
      let newTime = Math.min(audio.length, Math.max(0, remap(e.clientX, 0, w, audio.length * scale[0], audio.length * scale[1])));
      if (e.button === 0) {
        if (audio.playing) {
          audio.pause();
          audio.pauseTime = newTime;
          audio.play();
        } else {
          audio.pauseTime = newTime;
        }
      } else if (e.button === 2) {
        audio.stopTime = newTime;
      }
    } else {
      dragging = false;
    }
    clicked = false;
  }}
  on:contextmenu|preventDefault
  on:wheel|preventDefault={function (e) {
    let amt = (scale[1] - scale[0]) * e.deltaY * -0.1;
    let ratio = e.clientX / w;

    scale[0] += amt * ratio;
    scale[1] -= amt * (1 - ratio);

    if (scale[1] - scale[0] > 1) {
      scale[0] = 0;
      scale[1] = 1;
    }
  }}
  on:mousemove={function (e) {
    if (clicked && !dragging && Math.abs(e.movementX) > 5) dragging = true;

    if (clicked && dragging) {
      const movement = (e.movementX / w) * (scale[0] - scale[1]);
      scale[0] += movement;
      scale[1] += movement;
    }
  }} />
