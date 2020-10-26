// Code from another one of my projects

const zlib = require("zlib");

function write(obj) {
  return new Promise((resolve) => {
    if (typeof obj === "object") {
      let arr = [];

      let keys = Object.keys(obj);
      let len = keys.length;
      for (let i = 0; i < len; i++) {
        arr = arr.concat(encodeTag(true, obj[keys[i]], keys[i]));
      }

      arr.push(0);

      zlib.gzip(Buffer.from(arr), (err, data) => {
        if (err) throw err;

        resolve(data);
      });
    } else {
      console.error(`You can't write a ${typeof obj}`);
    }
  });
}

function encodeTag(named, value, name) {
  if (value === undefined || value === null) {
    console.warn(`Ignoring undefined or null value of ${name}`);
    return [];
  }

  ret = [];

  let type = typeof value;

  let nameBin;
  let nameLen = 0;
  if (named) {
    nameBin = Array.from(Buffer.from(name, "utf-8"));
    nameLen = nameBin.length;
    if (nameLen >= 4096) {
      console.error(`The name ${name} takes up too many bytes`);
    }
  }

  if (type === "function") {
    console.warn(`Ignoring function value of ${name}`);
  } else if (type === "string") {
    let str = Array.from(Buffer.from(value, "utf-8"));
    if (str.length < 256) {
      ret.push((1 << 4) + (nameLen >>> 8));
      if (named) {
        ret.push(nameLen & 0b11111111);
        ret = ret.concat(nameBin);
      }

      ret.push(str.length);
      ret = ret.concat(str);
    } else if (str.length < 4294967296) {
      ret.push((2 << 4) + (nameLen >>> 8));
      if (named) {
        ret.push(nameLen & 0b11111111);
        ret = ret.concat(nameBin);
      }

      ret.push((str.length & 0b11111111000000000000000000000000) >>> 24);
      ret.push((str.length & 0b00000000111111110000000000000000) >>> 16);
      ret.push((str.length & 0b00000000000000001111111100000000) >>> 8);
      ret.push((str.length & 0b00000000000000000000000011111111) >>> 0);

      ret = ret.concat(str);
    } else {
      console.error(`Your string ${name} takes up too many bytes`);
    }
  } else if (type === "number") {
    if (value <= Number.MAX_SAFE_INTEGER) {
      if (value !== Math.floor(value) || value < -2147483648 || value > 2147483647) {
        ret.push((3 << 4) + (nameLen >>> 8));
        if (named) {
          ret.push(nameLen & 0b11111111);
          ret = ret.concat(nameBin);
        }

        let buf = Buffer.allocUnsafe(8);
        buf.writeDoubleBE(value)
        ret = ret.concat(Array.from(buf));
      } else if (value >= -128 && value <= 127) {
        ret.push((4 << 4) + (nameLen >>> 8));
        if (named) {
          ret.push(nameLen & 0b11111111);
          ret = ret.concat(nameBin);
        }

        ret.push(value < 0 ? value + 256 : value);
      } else if (value >= -32768 && value <= 32767) {
        ret.push((5 << 4) + (nameLen >>> 8));
        if (named) {
          ret.push(nameLen & 0b11111111);
          ret = ret.concat(nameBin);
        }

        let v = value < 0 ? value + 65536 : value;
        ret.push(v >>> 8);
        ret.push(v & 0b11111111);
      } else {
        ret.push((6 << 4) + (nameLen >>> 8));
        if (named) {
          ret.push(nameLen & 0b11111111);
          ret = ret.concat(nameBin);
        }

        let v = value < 0 ? value + 4294967296 : value;
        ret.push((v & 0b11111111000000000000000000000000) >>> 24);
        ret.push((v & 0b00000000111111110000000000000000) >>> 16);
        ret.push((v & 0b00000000000000001111111100000000) >>> 8);
        ret.push((v & 0b00000000000000000000000011111111) >>> 0);
      }
    } else {
      console.error(`Your number ${name} is too big!`);
    }
  } else if (type === "bigint") {
    if (value < 2n ** (2040n) - 1n && value > -1n * (2n ** (2040n))) {
      ret.push((7 << 4) + (nameLen >>> 8));
      if (named) {
        ret.push(nameLen & 0b11111111);
        ret = ret.concat(nameBin);
      }

      let v = value;
      let len = BigInt(Math.ceil((v.toString(2).length + (v < 0n ? -1 : 0)) / 8));
      ret.push(Number(len));
      if (v < 0n) {
        v += 256n ** len;
      }

      let bin = [];
      for (let i = 0; i < len; i++) {
        bin.push(Number(v & 255n /*0b11111111*/ ));
        v = v >> 8n;
      }

      bin = bin.reverse();

      ret = ret.concat(bin);
    } else {
      console.error(`Your bigint is out of range!`)
    }
  } else if (type === "boolean") {
    ret.push(((value ? 8 : 9) << 4) + (nameLen >>> 8));
    if (named) {
      ret.push(nameLen & 0b11111111);
      ret = ret.concat(nameBin);
    }
  } else if (type === "object") {
    if (Array.isArray(value)) {
      let len = value.length;
      ret.push((10 << 4) + (nameLen >>> 8));
      if (named) {
        ret.push(nameLen & 0b11111111);
        ret = ret.concat(nameBin);
      }

      for (let i = 0; i < len; i++) {
        ret = ret.concat(encodeTag(false, value[i]));
      }

      ret.push(0);
    } else if (isSet(value)) {
      let v = Array.from(value);
      let len = v.length;
      ret.push((11 << 4) + (nameLen >>> 8));
      if (named) {
        ret.push(nameLen & 0b11111111);
        ret = ret.concat(nameBin);
      }

      for (let i = 0; i < len; i++) {
        ret = ret.concat(encodeTag(false, v[i]));
      }

      ret.push(0);
    } else if (isMap(value)) {
      let v = Array.from(value.entries());

      let len = v.length;
      ret.push((13 << 4) + (nameLen >>> 8));
      if (named) {
        ret.push(nameLen & 0b11111111);
        ret = ret.concat(nameBin);
      }

      for (let i = 0; i < len; i++) {
        ret = ret.concat(encodeTag(true, v[i][1], v[i][0]));
      }

      ret.push(0);
    } else if (Buffer.isBuffer(value)) {
      let len = value.length;

      ret.push((14 << 4) + (nameLen >>> 8));
      if (named) {
        ret.push(nameLen & 0b11111111);
        ret = ret.concat(nameBin);
      }

      ret.push(Math.ceil(len.toString(2).length / 8));

      let bin = [];
      for (let i = 0; i < len; i++) {
        bin.push(Number(len & 255 /*0b11111111*/ ));
        len = len >> 8;
      }

      bin = bin.reverse();
      ret = ret.concat(bin);
      ret = ret.concat(Array.from(value));
    } else {
      ret.push((12 << 4) + (nameLen >>> 8));
      if (named) {
        ret.push(nameLen & 0b11111111);
        ret = ret.concat(nameBin);
      }

      let keys = Object.keys(value);
      let len = keys.length;
      for (let i = 0; i < len; i++) {
        ret = ret.concat(encodeTag(true, value[keys[i]], keys[i]));
      }

      ret.push(0);
    }
  } else {
    console.warn(`Can't encode the symbol ${name}`);
  }

  return ret;
}

// https://stackoverflow.com/questions/29924932/how-to-reliably-check-an-object-is-an-ecmascript-6-map-set
function isMap(o) {
  try {
    Map.prototype.has.call(o); // throws if o is not an object or has no [[MapData]]
    return true;
  } catch (e) {
    return false;
  }
}

function isSet(o) {
  try {
    Set.prototype.has.call(o); // throws if o is not an object or has no [[SetData]]
    return true;
  } catch (e) {
    return false;
  }
}

function read(buffer) {
  return new Promise((resolve) => {
    zlib.gunzip(buffer, (err, newBuffer) => {
      if (err) throw err;

      let ret = {};
      while (newBuffer.length > 0) {
        let tag = decodeTag(true, newBuffer);
        if (tag[2] === "end") {
          resolve(ret);
          return;
        } else {
          ret[tag[1]] = tag[2];
          newBuffer = newBuffer.slice(tag[0]);
        }
      }

      resolve(ret);
      return;
    })
  })
}

function decodeTag(named, bufferBuffer) {
  let buffer = Array.from(bufferBuffer);
  let i = 0;
  let type = buffer[i] >>> 4;
  i++;
  if (type === 0) {
    return [i, "", "end"];
  }

  let nameLen = 0;
  let name = "";
  if (named) {
    nameLen = buffer[i] + ((buffer[i - 1] & 0b1111) << 8);
    i++;

    let nameBuf = Buffer.from(buffer.slice(i, i + nameLen));
    name = nameBuf.toString("utf-8");
    i += nameLen;
  }

  let ret;
  if (type === 1) {
    let len = buffer[i];
    i++;
    ret = Buffer.from(buffer.slice(i, i + len)).toString("utf-8");
    i += len;
  } else if (type === 2) {
    let num = buffer.slice(i, i + 4).reverse();
    i += 4;

    let len = 0;
    for (let j = 0; j < 4; j++) {
      len += num[j] * (256 ** j);
    }

    ret = Buffer.from(buffer.slice(i, i + len)).toString("utf-8");
    i += len;
  } else if (type === 3) {
    ret = Buffer.from(buffer.slice(i, i + 8)).readDoubleBE();
    i += 8;
  } else if (type === 4) {
    ret = buffer[i];
    if (ret > 127) {
      ret -= 256;
    }
    i++;
  } else if (type === 5) {
    ret = Buffer.from(buffer.slice(i, i + 2)).readInt16BE()
    i += 2;
  } else if (type === 6) {
    ret = Buffer.from(buffer.slice(i, i + 4)).readInt32BE();
    i += 4;
  } else if (type === 7) {
    let len = buffer[i];
    i++;

    let num = 0n;
    for (let j = 0; j < len; j++) {
      num += BigInt(buffer[i + j]) * (256n ** BigInt(len - j - 1));
    }
    i += len;

    if (num > 256n ** BigInt(len - 1) - 1n) {
      num -= 256n ** BigInt(len);
    }

    ret = num;
  } else if (type === 8) {
    ret = true;
  } else if (type === 9) {
    ret = false;
  } else if (type === 10) {
    let toStop = false;
    ret = [];
    while (!toStop) {
      let tag = decodeTag(false, buffer.slice(i));
      if (tag[2] === "end") {
        toStop = true;
        i += tag[0];
      } else {
        i += tag[0];
        ret.push(tag[2]);
      }
    }
  } else if (type === 11) {
    let toStop = false;
    ret = new Set();
    while (!toStop) {
      let tag = decodeTag(false, buffer.slice(i));
      if (tag[2] === "end") {
        toStop = true;
        i += tag[0];
      } else {
        i += tag[0];
        ret.add(tag[2]);
      }
    }
  } else if (type === 12) {
    ret = {};
    let toStop = false;
    while (!toStop) {
      let tag = decodeTag(true, buffer.slice(i));
      if (tag[2] === "end") {
        toStop = true;
        i += tag[0];
      } else {
        i += tag[0];
        ret[tag[1]] = tag[2];
      }
    }
  } else if (type === 13) {
    ret = new Map();
    let toStop = false;
    while (!toStop) {
      let tag = decodeTag(true, buffer.slice(i));
      if (tag[2] === "end") {
        toStop = true;
        i += tag[0];
      } else {
        i += tag[0];
        ret.set(tag[1], tag[2]);
      }
    }
  } else if (type === 14) {
    let len = buffer[i];
    i++;

    let num = 0n;
    for (let j = 0; j < len; j++) {
      num += BigInt(buffer[i + j]) * (256n ** BigInt(len - j - 1));
    }
    i += len;

    ret = Buffer.from(buffer.slice(i, i + Number(num)));

    i += Number(num);
  } else {
    return [i, "", "end"];
  }

  return [i, name, ret];
}

module.exports = {
  read,
  write
}