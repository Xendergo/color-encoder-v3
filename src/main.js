import App from './App.svelte';
const socket = new WebSocket("ws://localhost:3000/ws");

let app;
socket.onopen = () => {
	app = new App({
		target: document.body,
		props: {
			color: {
				r: 255,
				g: 0,
				b: 255,
				w: 0,
				a: 255,
			},
			brightness: 32,
			enable: true,
			warning: true,
			socket
		}
	});
}

export default app;