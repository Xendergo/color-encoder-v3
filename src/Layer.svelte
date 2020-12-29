<script>
  import { onMount } from "svelte";
  import Slider from "./Slider.svelte";
  import Dropdown from "./Dropdown.svelte";
  import Number from "./Number.svelte";
  import Grid from "./Grid.svelte";

  let entered = false;

  let mouseTime = 0;

  export let audio;

  export let color;

  export let seq;
  export let alpha;
  export let scale;
  export let type;
  export let blend;
  export let exp;

  export let render;

  export let save;

  export let visible;

  export let deleteFunction;

  let gridEnable = false;
  let interval = 500;
  let offset = 0;

  let c;
  let draw;
  onMount(function () {
    draw = c.getContext("2d");

    console.log("oof");

    drawLoop();
  });

  let w = window.innerWidth;
  let h = window.innerHeight * 0.05;
  window.addEventListener("resize", () => {
    w = window.innerWidth;
    h = window.innerHeight * 0.05;
  });

  export function drawLoop() {
    draw.fillStyle = "#000000";
    draw.fillRect(0, 0, w, h);

    if (render) {
      renderBackground();
    }

    draw.lineWidth = 2;

    draw.strokeStyle = "rgba(255, 0, 128, 0.5)";
    if (gridEnable && interval && interval > 0) {
      let intervalPx =
        (interval / audio.length) * w * (1 / (scale[1] - scale[0]));
      for (
        let i = remap(
          offset,
          audio.length * scale[0],
          audio.length * scale[1],
          0,
          w
        );
        i < w;
        i += intervalPx
      ) {
        draw.beginPath();
        draw.moveTo(i, 0);
        draw.lineTo(i, h);
        draw.stroke();
      }
    }
    draw.strokeStyle = "white";

    draw.beginPath();
    draw.moveTo(0, 1);
    draw.lineTo(w, 1);
    draw.stroke();

    draw.beginPath();
    draw.moveTo(0, h - 2);
    draw.lineTo(w, h - 2);
    draw.stroke();

    if (entered) {
      let pos = remap(
        mouseTime,
        audio.length * scale[0],
        audio.length * scale[1],
        0,
        w
      );

      draw.beginPath();
      draw.moveTo(pos, 0);
      draw.lineTo(pos, h);
      draw.stroke();
    }

    // Loop the seq backwards to make transparent colors render properly
    for (let i = 0; i < seq.length; i++) {
      const stop = seq[i];

      const pos = remap(
        stop.t,
        audio.length * scale[0],
        audio.length * scale[1],
        0,
        w
      );
      draw.beginPath();
      draw.moveTo(pos, 0);
      draw.lineTo(pos, h);
      draw.stroke();

      draw.fillStyle = `rgba(${stop.c.r},${stop.c.g}, ${stop.c.b}, ${
        stop.c.a / 255
      })`;
      draw.fillRect(pos - h * 0.3, h * 0.2, h * 0.6, h * 0.3);
      draw.fillStyle = `rgba(${stop.c.w},${stop.c.w}, ${stop.c.w}, ${
        stop.c.a / 255
      })`;
      draw.fillRect(pos - h * 0.3, h * 0.5, h * 0.6, h * 0.3);
      draw.strokeRect(pos - h * 0.3, h * 0.2, h * 0.6, h * 0.6);
    }

    draw.beginPath();
    draw.moveTo(0, h * 0.5);
    draw.lineTo(w, h * 0.5);
    draw.stroke();

    requestAnimationFrame(drawLoop);
  }

  function renderBackground() {
    const seq2 = [
      {
        t: 0,
        c: { r: 0, g: 0, b: 0, w: 0, a: 0 },
      },
      ...seq,
      {
        t: audio.length,
        c: { r: 0, g: 0, b: 0, w: 0, a: 0 },
      },
    ];

    const positions = [];
    for (let i = 0; i < seq2.length; i++) {
      positions.push(
        remap(seq2[i].t, audio.length * scale[0], audio.length * scale[1], 0, w)
      );
    }

    if (type === "switch") {
      for (let i = 0; i < seq2.length - 1; i++) {
        const stop = seq2[i];
        draw.fillStyle = `rgba(${stop.c.r}, ${stop.c.g}, ${stop.c.b}, ${
          stop.c.a / 255
        })`;
        draw.fillRect(
          positions[i],
          0,
          positions[i + 1] - positions[i],
          h * 0.5
        );
        draw.fillStyle = `rgba(${stop.c.w},${stop.c.w}, ${stop.c.w}, ${
          stop.c.a / 255
        })`;
        draw.fillRect(
          positions[i],
          h * 0.5,
          positions[i + 1] - positions[i],
          h * 0.5
        );
      }
    } else if (type === "gradient") {
      const x1 = remap(
        0,
        audio.length * scale[0],
        audio.length * scale[1],
        0,
        w
      );
      const x2 = remap(
        audio.length,
        audio.length * scale[0],
        audio.length * scale[1],
        0,
        w
      );

      const positions2 = [];
      for (let i = 0; i < seq2.length; i++) {
        positions2.push(remap(positions[i], x1, x2, 0, 1));
      }

      let gradient = draw.createLinearGradient(x1, 0, x2, 0);
      for (let i = 0; i < seq2.length; i++) {
        const stop = seq2[i];

        gradient.addColorStop(
          positions2[i],
          `rgba(${stop.c.r}, ${stop.c.g}, ${stop.c.b}, ${stop.c.a / 255})`
        );
      }
      draw.fillStyle = gradient;
      draw.fillRect(0, 0, w, h * 0.5);

      gradient = draw.createLinearGradient(x1, 0, x2, 0);
      for (let i = 0; i < seq2.length; i++) {
        const stop = seq2[i];

        gradient.addColorStop(
          positions2[i],
          `rgba(${stop.c.w}, ${stop.c.w}, ${stop.c.w}, ${stop.c.a / 255})`
        );
      }
      draw.fillStyle = gradient;
      draw.fillRect(0, h * 0.5, w, h * 0.5);
    } else if (type === "pulse") {
      draw.lineWidth = 1;
      for (let i = 0; i < w; i++) {
        let c = {
          r: 0,
          g: 0,
          b: 0,
          w: 0,
          a: 0,
        };

        let t = remap(
          i,
          0,
          w,
          audio.length * scale[0],
          audio.length * scale[1]
        );
        for (let j = seq2.length - 1; j >= 0; j--) {
          if (seq2[j].t < t) {
            const c2 = seq2[j].c;
            const a = Math.E ** (((t - seq2[j].t) / 1000) * -exp);
            c.r += c2.r * (c2.a / 255) * a;
            c.g += c2.g * (c2.a / 255) * a;
            c.b += c2.b * (c2.a / 255) * a;
            c.w += c2.w * (c2.a / 255) * a;
            c.a += (c2.a / 255) * a * 255;
          }
        }

        draw.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})`;
        draw.beginPath();
        draw.moveTo(i, 0);
        draw.lineTo(i, h * 0.5);
        draw.stroke();

        draw.strokeStyle = `rgba(${c.w}, ${c.w}, ${c.w}, ${c.a})`;
        draw.beginPath();
        draw.moveTo(i, h * 0.5);
        draw.lineTo(i, h);
        draw.stroke();
      }
      draw.lineWidth = 2;
      draw.strokeStyle = "#ffffff";
    }
  }

  export function getColor(time) {
    const seq2 = [
      {
        t: 0,
        c: { r: 0, g: 0, b: 0, w: 0, a: 0 },
      },
      ...seq,
      {
        t: audio.length,
        c: { r: 0, g: 0, b: 0, w: 0, a: 0 },
      },
    ];

    if (type === "switch") {
      for (let i = seq2.length - 1; i >= 0; i--) {
        if (seq2[i].t < time) {
          return seq2[i].c;
        }
      }
    } else if (type === "gradient") {
      let i;
      for (let j = seq2.length - 2; j >= 0; j--) {
        if (seq2[j].t < time) {
          i = j;
          break;
        }
      }

      const lerpAmt = remap(time, seq2[i].t, seq2[i + 1].t, 0, 1);

      return {
        r: lerp(seq2[i].c.r, seq2[i + 1].c.r, lerpAmt),
        g: lerp(seq2[i].c.g, seq2[i + 1].c.g, lerpAmt),
        b: lerp(seq2[i].c.b, seq2[i + 1].c.b, lerpAmt),
        w: lerp(seq2[i].c.w, seq2[i + 1].c.w, lerpAmt),
        a: lerp(seq2[i].c.a, seq2[i + 1].c.a, lerpAmt),
      };
    } else if (type === "pulse") {
      let c = {
        r: 0,
        g: 0,
        b: 0,
        w: 0,
        a: 0,
      };

      for (let i = seq2.length - 1; i >= 0; i--) {
        if (seq2[i].t < time) {
          const c2 = seq2[i].c;
          const a = Math.E ** (((time - seq2[i].t) / 1000) * -exp);
          c.r += c2.r * (c2.a / 255) * a;
          c.g += c2.g * (c2.a / 255) * a;
          c.b += c2.b * (c2.a / 255) * a;
          c.w += c2.w * (c2.a / 255) * a;
          c.a += (c2.a / 255) * a * 255;
          return c;
        }
      }

    }
  }

  function lerp(x1, x2, amt) {
    return x1 * (1 - amt) + x2 * amt;
  }

  // this needs to be in vanilla js it's soooo useful
  function remap(value, low1, high1, low2, high2) {
    return low2 + ((high2 - low2) * (value - low1)) / (high1 - low1);
  }
</script>

<style>
  canvas {
    position: fixed;
    top: 62vh;
    left: 0;
  }

  div {
    position: fixed;
    right: 16px;
  }
</style>

<div style="display: {visible ? 'block' : 'none'}">
  <Grid bind:enabled={gridEnable} bind:interval bind:offset />
  <Slider
    bind:value={alpha}
    gradient="linear-gradient(to right, rgba(255, 255, 255, 0), rgba(255, 255, 255, 255))"
    label="Alpha"
    color="rgba(255, 255, 255, {alpha / 255})" />
  <Dropdown
    bind:value={blend}
    label="Blend mode"
    options={[{ value: 'normal', name: 'Normal' }, { value: 'additive', name: 'Additive' }, { value: 'multiply', name: 'Multiply' }]} />
  <Dropdown
    bind:value={type}
    label="Color changing mode"
    options={[{ value: 'switch', name: 'Switch' }, { value: 'gradient', name: 'Gradient' }, { value: 'pulse', name: 'Pulse' }]} />
  {#if type === 'pulse'}
    <Number bind:value={exp} label="Exponent" />
  {/if}
  <input type="button" value="Delete" on:click={deleteFunction} />
  <canvas
    bind:this={c}
    width={w}
    height={h}
    on:mouseenter={() => (entered = true)}
    on:mouseleave={() => (entered = false)}
    on:mousemove={function (e) {
      if (entered) {
        mouseTime = remap(e.clientX, 0, w, audio.length * scale[0], audio.length * scale[1]);
      }
    }}
    on:mouseup={function (e) {
      if (e.button === 0) {
        // Clone the color object so changing the color object doesn't change the color of the stop
        const c = {};
        for (const key in color) {
          if (key !== 'cmd') {
            c[key] = color[key];
          }
        }

        let t = mouseTime;
        if (gridEnable) {
          let maxDist = 10000 * (scale[1] - scale[0]);

          let nearestGridPos = Math.round((t - offset) / interval) * interval + offset;

          if (Math.abs(t - nearestGridPos) < maxDist) {
            t = nearestGridPos;
          }
        }

        seq.push({ t: Math.min(audio.length, Math.max(0, t)), c });
        seq.sort((a, b) => a.t - b.t);

        save();
      } else if (e.button === 2) {
        for (let i = seq.length - 1; i >= 0; i--) {
          const pos = remap(seq[i].t, audio.length * scale[0], audio.length * scale[1], 0, w);

          if (e.clientX > pos - h * 0.3 && e.clientX < pos + h * 0.3) {
            seq.splice(i, 1);
            break;
          }
        }

        save();
      }
    }}
    on:contextmenu|preventDefault />
</div>
