const noble = require("@abandonware/noble");

noble.on("stateChange", (state) => {
    if (state === "poweredOn") {
        noble.startScanningAsync();
    }
});

let tx;
let rx;

noble.on("discover", async (device) => {
    console.log(device.advertisement.localName);
    if (device.advertisement.localName === "Adafruit Bluefruit LE") {
        noble.stopScanningAsync();
        await device.connectAsync();
        console.log("conencted");
        device.discoverServicesAsync();
        device.once("servicesDiscover", async (services) => {
            for (let i = 0; i < services.length; i++) {
                const chars = await services[i].discoverCharacteristicsAsync();
                for (let j = 0; j < chars.length; j++) {
                    chars[j].readAsync();
                    chars[j].on("data", (data) => {
                        console.log(data.toString('ascii'), ", ", chars[j].name, ", ", services[i].name);
                    });

                    // https://github.com/adafruit/adafruit-bluefruit-le-desktop/blob/master/src/main.js#L89 this would've been way harder without this

                    if (chars[j].uuid === "6e400002b5a3f393e0a9e50e24dcca9e") {
                        tx = chars[j];

                        // tx.write(Buffer.from([2, 255, 255, 255, 255]));
                    } else if (chars[j].uuid === "6e400003b5a3f393e0a9e50e24dcca9e") {
                        rx = chars[j];

                        rx.removeAllListeners("data");
                        rx.on("data", handleData);

                        rx.notify(true);
                        onStart();
                    }
                }
            }
        });
    }
});

function handleData(data) {
    if (data[0] === 0x30) {
        // status.ready = true;
    } else {
        console.log("\x1b[31m", `\> ${data.toString("ascii")}`, "\x1b[0m");
    }
}

const fs = require("fs");

const readWrite = require("./readWrite.js");

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
            if (status.commands.length < 2) {
                color(msg.c);
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

app.listen(8000);
console.log("Listening on port 8000");


const status = {
    set ready(v) {
        this.ready2 = v;

        if (v) {
            if (this.commands.length > 0) {
                execCmd();
            }
        }

    },
    set nextCmd(v) {
        this.commands.push(v);

        if (this.ready2) {
            execCmd();
        }
    },
    ready2: false,
    commands: []
}

function execCmd() {
    status.ready = false;

    let cmd = Buffer.from(status.commands.shift());

    console.log("cmd", cmd[3]);

    tx.write(cmd);
}

function warn(val) {
    status.nextCmd = val ? [0, 0] : [0, 1];
}

function enable(val) {
    status.nextCmd = val ? [0, 2] : [0, 3];
}

function brightness(val) {
    status.nextCmd = [1, val];
}

function color(c) {
    status.nextCmd = [3, ...c];
}

function onStart() {
    color([255, 0, 255, 255, 255, 0, 255, 255, 255, 0, 255, 255, 255, 0, 255, 255]);
    setInterval(() => {
        status.ready = true;
    }, 1000);
}