const serialport = require("serialport");
const Readline = require('@serialport/parser-readline');
const port = new serialport("COM3", {
    baudRate: 9600
});

const fs = require("fs");

const readWrite = require("./readWrite.js");

const parser = new Readline();
port.pipe(parser);

const express = require('express');
const app = express();
const expressWs = require("express-ws")(app);

let fileSent;
let savePath;

app.use("/loadSound", (req, res) => {
    fileSent = decodeURIComponent(req.url.slice(1));
    res.sendFile(fileSent);
    // https://stackoverflow.com/questions/830855/what-regex-would-capture-everything-from-mark-to-the-end-of-a-line
    savePath = fileSent.replace(/\..*/g, ".seq");
});

app.use("/loadSeq", async (req, res) => {
    let read;
    try {
        read = (await readWrite.read(fs.readFileSync(savePath))).v;
    } catch {
        read = [{
            seq: [],
            alpha: 255,
            type: "switch" /*Switch: Immediately switch colors, Gradient: Each color is like a stop in a gradient, Pulse: Pulses a color and dims down*/ ,
            blend: "normal" /*Blend modes, normal, additive, & multiply*/ ,
            exp: 1 /*How the colors drop off over time, c.a*e^(-x*t) where c.a is the alpha of the color of a point in the sequence, x is exp, & t is time in seconds*/ ,
        }, ]
    }

    console.log("read: ", read);

    res.send(JSON.stringify(read));
})

app.use("/", express.static(__dirname + '/public'));

app.ws("/ws", function (ws, req) {
    ws.on("message", async function (msgStringy) {
        const msg = JSON.parse(msgStringy);

        if (msg.cmd === "color") {
            if (status.commands.length < 5) {
                color(msg.r, msg.g, msg.b, msg.w);
            }
        } else if (msg.cmd === "brightness") {
            brightness(msg.brightness);
        } else if (msg.cmd === "enable") {
            enable(msg.enable);
        } else if (msg.cmd === "warning") {
            warn(msg.warning);
        } else if (msg.cmd === "save") {

            if (savePath) {
                const toWrite = msg.layers;
                for (const layer of toWrite) {
                    delete layer.drawLoop;
                    delete layer.getColor;
                }

                fs.writeFileSync(savePath, await readWrite.write({
                    v: toWrite
                }));
            }
        }
    });

    ws.on("close", () => {
        fileSent = null;
        savePath = null;
    })
})

app.listen(3000);
console.log("Listening on port 3000");


const status = {
    set ready(v) {
        this.ready2 = v;

        if (v) {
            if (this.commands.length > 0) {
                execCmd();
            }
            onReady();
        }

    },
    set nextCmd(v) {
        this.commands.push(v);

        if (this.ready2) {
            execCmd();
        }
    },
    ready2: false,
    started: false,
    commands: []
}

function execCmd() {
    status.ready = false;

    let cmd = Buffer.from(status.commands.shift());

    port.write(cmd);
}

parser.on("data", (line) => {
    if (line === "ready") {
        status.ready = true;
        status.started = true;

        onStart();
    }

    if (line === "r") {
        status.ready = true;
    } else {
        console.log("\x1b[31m", `\> ${line}`, "\x1b[0m");
    }
});

function warn(val) {
    status.nextCmd = val ? [0, 0] : [0, 1];
}

function enable(val) {
    status.nextCmd = val ? [0, 2] : [0, 3];
}

function brightness(val) {
    status.nextCmd = [1, val];
}

function color(r, g, b, w) {
    status.nextCmd = [3, r, g, b, w];
}

function onStart() {
    // enable(false);
    // warn(false);
    color(255, 0, 255, 255);
    // setInterval(() => {
    // console.log(amt);
    // amt = 0;
    // }, 1000);
}

function onReady() {
    // color(255, 255, 0, 255);
}

function map(v, min1, max1, min2, max2) {
    return (v - min1) * (max2 - min2) / (max1 - min1) + min2;
}