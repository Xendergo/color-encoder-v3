<script>
  import Number from "./Number.svelte";

  export let allowRender;
  export let audio;
  export let layers;
  let file;
  let err;
  let playing = false;
  const context = new (window.AudioContext || window.webkitAudioContext)();

  class audioControl {
    constructor(bufferThingy) {
      this.bufferThingy = bufferThingy; // The buffer

      this.playing = false; // Whether the music is playing
      this.stopTime = 0; // The time that stopping the music jumps back to
      this.startTime = 0; // The time IRL when the music starts playing
      this.startTimeMusic = 0; // The time in the music when the music starts playing
      this.pauseTime = 0; // When the music is paused

      this.playbackSpeedx = 1;

      const bufferWeird /*as in not normalized*/ = this.bufferThingy.getChannelData(
        0
      );

      let max = 0;
      let len = bufferWeird.length;
      for (let i = 0; i < len; i++) {
        if (bufferWeird[i] > max) {
          max = bufferWeird[i];
        }
      }

      this.buffer = bufferWeird.map((v) => v / max);

      this.length = (this.buffer.length / context.sampleRate) * 1000;
    }

    set playbackSpeed(v) {
      this.playbackSpeedx = v;
      if (v) {
        if (this.playing) {
          this.pause();
          this.play();
        }
      }
    }

    get playbackSpeed() {
      return this.playbackSpeedx;
    }

    play() {
      // why do i have to do this this is so dumb
      this.sound = context.createBufferSource();
      this.sound.buffer = this.bufferThingy;
      this.sound.connect(context.destination);

      this.sound.playbackRate.value = this.playbackSpeed;

      playing = true;
      this.playing = true;
      this.startTime = Date.now();
      this.startTimeMusic = this.pauseTime;
      this.sound.start(0, this.pauseTime / 1000);
    }

    pause() {
      this.pauseTime = this.time;

      // also dumb
      this.sound.disconnect();
      this.sound.stop();
      this.sound = null;

      playing = false;
      this.playing = false;
    }

    stop() {
      // also dumb
      this.sound.disconnect();
      this.sound.stop();
      this.sound = null;

      playing = false;
      this.pauseTime = this.stopTime;
      this.playing = false;
    }

    get time() {
      if (this.playing) {
        return (
          (Date.now() - this.startTime) * this.playbackSpeed +
          this.startTimeMusic
        );
      } else {
        return this.pauseTime;
      }
    }
  }

  file = localStorage.getItem("file");
</script>

<div>
  <input bind:value={file} />
  <input
    type="button"
    value="Load file"
    on:click={function () {
      localStorage.setItem('file', file);

      const node = this;

      // https://stackoverflow.com/questions/46856331/web-audio-api-get-audiobuffer-of-audio-element
      const request = new XMLHttpRequest();
      request.open('GET', 'loadSound/' + file, true);
      request.responseType = 'arraybuffer';
      request.onload = function () {
        const audioData = request.response;
        context.decodeAudioData(audioData, onBuffer, (errMsg) => {
          err = errMsg;
        });
      };
      request.onerror = (errMsg) => {
        err = errMsg;
        console.log(errMsg);
      };
      request.send();

      async function onBuffer(bufferThingy) {
        node.parentElement.remove();

        layers = await (await fetch('loadSeq')).json();

        allowRender(new audioControl(bufferThingy));
      }
    }} /><br />

  {#if err}
    <p>{err}</p>
  {/if}
</div>

{#if audio !== undefined}
  <div>
    {#if playing}
      <input type="button" value="Pause" on:click={audio.pause()} />
      <input type="button" value="Stop" on:click={audio.stop()} />
      <input
        type="button"
        value="Go to stop"
        on:click={function () {
          audio.stop();
          audio.play();
        }} />
      <input
        type="button"
        value="Reset stop position"
        on:click={(audio.stopTime = 0)} />
    {:else}
      <input type="button" value="Play" on:click={audio.play()} />
    {/if}<br />
    <Number bind:value={audio.playbackSpeed} label="Playback speed" />
  </div>
{/if}
