import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const ROOT = process.cwd();

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n += 1) {
  let c = n;
  for (let k = 0; k < 8; k += 1) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c >>> 0;
}

const crc32 = (buffer) => {
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    c = crcTable[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
};

const chunk = (type, data) => {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
};

const createCanvas = (width, height, base = [0, 0, 0, 0]) => {
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    data[i * 4] = base[0];
    data[i * 4 + 1] = base[1];
    data[i * 4 + 2] = base[2];
    data[i * 4 + 3] = base[3];
  }
  return { width, height, data };
};

const clampByte = (value) => Math.max(0, Math.min(255, Math.round(value)));

const blendPixel = (canvas, x, y, r, g, b, a = 255) => {
  if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height || a <= 0) {
    return;
  }

  const i = (y * canvas.width + x) * 4;
  const srcA = a / 255;
  const dstA = canvas.data[i + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);

  if (outA <= 0) {
    canvas.data[i] = 0;
    canvas.data[i + 1] = 0;
    canvas.data[i + 2] = 0;
    canvas.data[i + 3] = 0;
    return;
  }

  const dstR = canvas.data[i];
  const dstG = canvas.data[i + 1];
  const dstB = canvas.data[i + 2];

  const outR = (r * srcA + dstR * dstA * (1 - srcA)) / outA;
  const outG = (g * srcA + dstG * dstA * (1 - srcA)) / outA;
  const outB = (b * srcA + dstB * dstA * (1 - srcA)) / outA;

  canvas.data[i] = clampByte(outR);
  canvas.data[i + 1] = clampByte(outG);
  canvas.data[i + 2] = clampByte(outB);
  canvas.data[i + 3] = clampByte(outA * 255);
};

const fillRect = (canvas, x, y, w, h, color) => {
  const [r, g, b, a = 255] = color;
  const x0 = Math.max(0, Math.floor(x));
  const y0 = Math.max(0, Math.floor(y));
  const x1 = Math.min(canvas.width, Math.ceil(x + w));
  const y1 = Math.min(canvas.height, Math.ceil(y + h));

  for (let yy = y0; yy < y1; yy += 1) {
    for (let xx = x0; xx < x1; xx += 1) {
      blendPixel(canvas, xx, yy, r, g, b, a);
    }
  }
};

const fillRoundedRect = (canvas, x, y, w, h, radius, color) => {
  const [r, g, b, a = 255] = color;
  const rr = Math.max(0, Math.min(radius, Math.floor(Math.min(w, h) / 2)));
  const x0 = Math.max(0, Math.floor(x));
  const y0 = Math.max(0, Math.floor(y));
  const x1 = Math.min(canvas.width, Math.ceil(x + w));
  const y1 = Math.min(canvas.height, Math.ceil(y + h));

  const left = x;
  const right = x + w - 1;
  const top = y;
  const bottom = y + h - 1;

  for (let yy = y0; yy < y1; yy += 1) {
    for (let xx = x0; xx < x1; xx += 1) {
      let inside = false;

      if (xx >= left + rr && xx <= right - rr) {
        inside = true;
      } else if (yy >= top + rr && yy <= bottom - rr) {
        inside = true;
      } else {
        const cx = xx < left + rr ? left + rr : right - rr;
        const cy = yy < top + rr ? top + rr : bottom - rr;
        const dx = xx - cx;
        const dy = yy - cy;
        inside = dx * dx + dy * dy <= rr * rr;
      }

      if (inside) {
        blendPixel(canvas, xx, yy, r, g, b, a);
      }
    }
  }
};

const strokeRoundedRect = (canvas, x, y, w, h, radius, thickness, color) => {
  fillRoundedRect(canvas, x, y, w, h, radius, color);
  fillRoundedRect(
    canvas,
    x + thickness,
    y + thickness,
    w - thickness * 2,
    h - thickness * 2,
    Math.max(0, radius - thickness),
    [0, 0, 0, 0],
  );
};

const fillCircle = (canvas, cx, cy, radius, color) => {
  const [r, g, b, a = 255] = color;
  const x0 = Math.max(0, Math.floor(cx - radius));
  const y0 = Math.max(0, Math.floor(cy - radius));
  const x1 = Math.min(canvas.width, Math.ceil(cx + radius));
  const y1 = Math.min(canvas.height, Math.ceil(cy + radius));
  const rr = radius * radius;

  for (let yy = y0; yy < y1; yy += 1) {
    const dy = yy - cy;
    for (let xx = x0; xx < x1; xx += 1) {
      const dx = xx - cx;
      if (dx * dx + dy * dy <= rr) {
        blendPixel(canvas, xx, yy, r, g, b, a);
      }
    }
  }
};

const fillEllipse = (canvas, cx, cy, rx, ry, color) => {
  const [r, g, b, a = 255] = color;
  const x0 = Math.max(0, Math.floor(cx - rx));
  const y0 = Math.max(0, Math.floor(cy - ry));
  const x1 = Math.min(canvas.width, Math.ceil(cx + rx));
  const y1 = Math.min(canvas.height, Math.ceil(cy + ry));

  for (let yy = y0; yy < y1; yy += 1) {
    const dy = (yy - cy) / ry;
    for (let xx = x0; xx < x1; xx += 1) {
      const dx = (xx - cx) / rx;
      if (dx * dx + dy * dy <= 1) {
        blendPixel(canvas, xx, yy, r, g, b, a);
      }
    }
  }
};

const drawLinearGradient = (canvas, topColor, bottomColor) => {
  for (let y = 0; y < canvas.height; y += 1) {
    const t = y / (canvas.height - 1);
    const r = topColor[0] + (bottomColor[0] - topColor[0]) * t;
    const g = topColor[1] + (bottomColor[1] - topColor[1]) * t;
    const b = topColor[2] + (bottomColor[2] - topColor[2]) * t;
    const a = topColor[3] + (bottomColor[3] - topColor[3]) * t;
    fillRect(canvas, 0, y, canvas.width, 1, [r, g, b, a]);
  }
};

const drawRadialGlow = (canvas, cx, cy, radius, color, maxAlpha) => {
  const [r, g, b] = color;
  const x0 = Math.max(0, Math.floor(cx - radius));
  const y0 = Math.max(0, Math.floor(cy - radius));
  const x1 = Math.min(canvas.width, Math.ceil(cx + radius));
  const y1 = Math.min(canvas.height, Math.ceil(cy + radius));
  const rr = radius * radius;

  for (let yy = y0; yy < y1; yy += 1) {
    for (let xx = x0; xx < x1; xx += 1) {
      const dx = xx - cx;
      const dy = yy - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 <= rr) {
        const t = 1 - Math.sqrt(d2) / radius;
        blendPixel(canvas, xx, yy, r, g, b, maxAlpha * t * t);
      }
    }
  }
};

const addNoise = (canvas, intensity = 10, seed = 1) => {
  let s = seed >>> 0;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };

  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const n = (rand() - 0.5) * intensity;
      const i = (y * canvas.width + x) * 4;
      if (canvas.data[i + 3] === 0) {
        continue;
      }
      canvas.data[i] = clampByte(canvas.data[i] + n);
      canvas.data[i + 1] = clampByte(canvas.data[i + 1] + n);
      canvas.data[i + 2] = clampByte(canvas.data[i + 2] + n);
    }
  }
};

const drawSunSymbol = (canvas, cx, cy, radius, palette) => {
  fillCircle(canvas, cx, cy, radius + 18, [palette.glow[0], palette.glow[1], palette.glow[2], 100]);
  fillCircle(canvas, cx, cy, radius, palette.core);
  fillCircle(canvas, cx, cy, radius - 18, palette.inner);

  for (let i = 0; i < 16; i += 1) {
    const angle = (Math.PI * 2 * i) / 16;
    const sx = cx + Math.cos(angle) * (radius + 16);
    const sy = cy + Math.sin(angle) * (radius + 16);
    const ex = cx + Math.cos(angle) * (radius + 56);
    const ey = cy + Math.sin(angle) * (radius + 56);
    const dx = ex - sx;
    const dy = ey - sy;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    for (let t = 0; t <= steps; t += 1) {
      const xx = Math.round(sx + (dx * t) / steps);
      const yy = Math.round(sy + (dy * t) / steps);
      blendPixel(canvas, xx, yy, palette.ray[0], palette.ray[1], palette.ray[2], 220);
    }
  }
};

const drawMoonSymbol = (canvas, cx, cy, radius, palette) => {
  fillCircle(canvas, cx, cy, radius + 22, [palette.glow[0], palette.glow[1], palette.glow[2], 90]);
  fillCircle(canvas, cx, cy, radius, palette.core);
  fillCircle(canvas, cx + radius * 0.35, cy - radius * 0.1, radius * 0.82, palette.cut);

  const stars = [
    [cx - 115, cy - 88, 10],
    [cx + 96, cy - 66, 9],
    [cx - 90, cy + 92, 8],
    [cx + 118, cy + 78, 10],
  ];

  for (const [sx, sy, size] of stars) {
    fillCircle(canvas, sx, sy, size, palette.star);
    fillCircle(canvas, sx, sy, size + 10, [palette.star[0], palette.star[1], palette.star[2], 45]);
  }
};

const drawScrollBase = (canvas, palette) => {
  drawLinearGradient(canvas, palette.top, palette.bottom);
  drawRadialGlow(canvas, canvas.width * 0.5, canvas.height * 0.42, canvas.width * 0.54, palette.centerGlow, 145);

  const margin = 34;
  fillRoundedRect(
    canvas,
    margin,
    margin,
    canvas.width - margin * 2,
    canvas.height - margin * 2,
    36,
    [palette.paper[0], palette.paper[1], palette.paper[2], 240],
  );

  strokeRoundedRect(
    canvas,
    margin,
    margin,
    canvas.width - margin * 2,
    canvas.height - margin * 2,
    36,
    8,
    [palette.border[0], palette.border[1], palette.border[2], 240],
  );

  fillEllipse(canvas, canvas.width * 0.5, 28, canvas.width * 0.42, 28, [palette.roll[0], palette.roll[1], palette.roll[2], 220]);
  fillEllipse(
    canvas,
    canvas.width * 0.5,
    canvas.height - 28,
    canvas.width * 0.42,
    28,
    [palette.roll[0], palette.roll[1], palette.roll[2], 220],
  );

  for (let y = 86; y < canvas.height - 86; y += 42) {
    fillRect(canvas, 76, y, canvas.width - 152, 3, [palette.line[0], palette.line[1], palette.line[2], 105]);
  }

  addNoise(canvas, 9, palette.seed);
};

const makeYesScroll = (outputFile) => {
  const canvas = createCanvas(512, 768, [0, 0, 0, 0]);
  const palette = {
    seed: 41,
    top: [84, 54, 18, 255],
    bottom: [47, 29, 11, 255],
    centerGlow: [229, 185, 86],
    paper: [223, 197, 146],
    border: [128, 83, 29],
    roll: [151, 108, 49],
    line: [122, 87, 41],
  };

  drawScrollBase(canvas, palette);

  drawSunSymbol(canvas, 256, 384, 68, {
    glow: [251, 228, 148],
    core: [211, 138, 47, 245],
    inner: [247, 215, 126, 255],
    ray: [255, 224, 136],
  });

  fillRoundedRect(canvas, 168, 540, 176, 84, 18, [78, 47, 16, 170]);
  fillRect(canvas, 190, 582, 132, 6, [242, 198, 112, 230]);
  fillRect(canvas, 196, 566, 120, 6, [242, 198, 112, 220]);

  writePng(outputFile, canvas);
};

const makeNoScroll = (outputFile) => {
  const canvas = createCanvas(512, 768, [0, 0, 0, 0]);
  const palette = {
    seed: 93,
    top: [58, 44, 26, 255],
    bottom: [29, 21, 13, 255],
    centerGlow: [146, 125, 184],
    paper: [200, 186, 158],
    border: [93, 74, 52],
    roll: [112, 91, 65],
    line: [100, 80, 57],
  };

  drawScrollBase(canvas, palette);

  drawMoonSymbol(canvas, 256, 384, 74, {
    glow: [178, 162, 229],
    core: [109, 91, 169, 245],
    cut: [200, 186, 158, 255],
    star: [233, 225, 255, 255],
  });

  fillRoundedRect(canvas, 168, 540, 176, 84, 18, [52, 41, 66, 160]);
  fillRect(canvas, 190, 582, 132, 6, [181, 166, 234, 225]);
  fillRect(canvas, 196, 566, 120, 6, [181, 166, 234, 210]);

  writePng(outputFile, canvas);
};

const drawFrameBackground = (canvas, top, bottom, glow, seed) => {
  drawLinearGradient(canvas, top, bottom);
  drawRadialGlow(canvas, canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.48, glow, 140);
  addNoise(canvas, 8, seed);
};

const makeSarcophagus = (outputFile, state) => {
  const isClosed = state === 'closed';
  const isBlessed = state === 'blessed';
  const canvas = createCanvas(768, 768, [0, 0, 0, 0]);
  drawFrameBackground(
    canvas,
    isBlessed ? [20, 14, 10, 255] : [14, 10, 10, 255],
    isBlessed ? [9, 8, 8, 255] : [11, 8, 9, 255],
    isBlessed ? [220, 180, 90] : [193, 82, 82],
    isClosed ? 81 : isBlessed ? 118 : 136,
  );

  fillRoundedRect(canvas, 192, 170, 384, 440, 72, [90, 66, 35, 255]);
  fillRoundedRect(canvas, 214, 202, 340, 380, 54, [129, 95, 51, 245]);

  for (let y = 235; y < 560; y += 42) {
    fillRect(canvas, 250, y, 270, 8, [166, 122, 66, 220]);
  }

  fillEllipse(canvas, 384, 300, 86, 98, [170, 131, 74, 220]);
  fillCircle(canvas, 350, 286, 10, [46, 33, 20, 255]);
  fillCircle(canvas, 418, 286, 10, [46, 33, 20, 255]);
  fillRect(canvas, 356, 334, 56, 10, [73, 52, 29, 230]);

  if (isClosed) {
    fillRoundedRect(canvas, 172, 110, 424, 122, 58, [154, 115, 64, 245]);
    fillRoundedRect(canvas, 194, 126, 380, 84, 44, [189, 147, 84, 230]);
  } else if (isBlessed) {
    drawRadialGlow(canvas, 384, 390, 232, [255, 211, 117], 160);
    fillRoundedRect(canvas, 112, 126, 326, 102, 50, [148, 108, 60, 230]);
    fillRoundedRect(canvas, 128, 138, 290, 78, 36, [180, 138, 78, 220]);

    for (let i = 0; i < 16; i += 1) {
      const angle = (Math.PI * 2 * i) / 16;
      const x = 384 + Math.cos(angle) * 148;
      const y = 390 + Math.sin(angle) * 118;
      fillCircle(canvas, x, y, 7, [252, 224, 145, 170]);
    }
  } else {
    drawRadialGlow(canvas, 384, 390, 232, [230, 86, 86], 180);
    fillRoundedRect(canvas, 112, 126, 326, 102, 50, [116, 70, 58, 235]);
    fillRoundedRect(canvas, 128, 138, 290, 78, 36, [145, 82, 67, 220]);

    for (let i = 0; i < 15; i += 1) {
      const x = 280 + i * 18;
      const y = 290 + ((i % 2) * 16);
      fillRect(canvas, x, y, 7, 180, [40, 24, 24, 180]);
    }

    fillCircle(canvas, 350, 286, 11, [245, 86, 86, 255]);
    fillCircle(canvas, 418, 286, 11, [245, 86, 86, 255]);
  }

  addNoise(canvas, 10, isClosed ? 164 : isBlessed ? 192 : 214);
  writePng(outputFile, canvas);
};

const makeVessel = (outputFile, state) => {
  const isClosed = state === 'closed';
  const isBlessed = state === 'blessed';
  const canvas = createCanvas(768, 768, [0, 0, 0, 0]);
  drawFrameBackground(
    canvas,
    isBlessed ? [18, 13, 12, 255] : [16, 11, 12, 255],
    isBlessed ? [8, 7, 9, 255] : [8, 6, 10, 255],
    isBlessed ? [182, 139, 90] : [187, 77, 88],
    isClosed ? 247 : isBlessed ? 291 : 319,
  );

  fillEllipse(canvas, 384, 532, 196, 78, [57, 43, 28, 220]);
  fillEllipse(canvas, 384, 300, 160, 136, [118, 84, 48, 255]);
  fillRoundedRect(canvas, 252, 298, 264, 250, 120, [147, 104, 57, 250]);
  fillEllipse(canvas, 384, 550, 170, 64, [171, 121, 65, 245]);

  fillRect(canvas, 302, 224, 164, 92, [133, 93, 53, 255]);
  fillEllipse(canvas, 384, 226, 122, 46, [174, 126, 74, 250]);

  for (let y = 292; y < 532; y += 44) {
    fillRect(canvas, 274, y, 220, 8, [189, 143, 85, 220]);
  }

  if (isClosed) {
    fillRoundedRect(canvas, 320, 176, 128, 62, 22, [110, 72, 38, 245]);
    fillEllipse(canvas, 384, 178, 78, 28, [142, 99, 55, 245]);
  } else if (isBlessed) {
    drawRadialGlow(canvas, 384, 334, 216, [255, 206, 126], 145);
    fillRect(canvas, 369, 206, 14, 220, [88, 59, 34, 235]);
    fillRect(canvas, 385, 208, 12, 228, [88, 59, 34, 230]);
    fillRect(canvas, 398, 230, 10, 208, [88, 59, 34, 220]);

    for (let i = 0; i < 12; i += 1) {
      const x = 384 + (i - 6) * 17;
      fillCircle(canvas, x, 250 + Math.abs(i - 6) * 7, 5, [255, 220, 155, 180]);
    }
  } else {
    drawRadialGlow(canvas, 384, 334, 216, [238, 92, 92], 165);
    fillRect(canvas, 370, 210, 12, 220, [66, 28, 30, 240]);
    fillRect(canvas, 385, 206, 11, 230, [70, 30, 33, 230]);
    fillRect(canvas, 398, 228, 10, 206, [72, 34, 35, 225]);

    for (let i = 0; i < 10; i += 1) {
      const x = 384 + (i - 5) * 22;
      fillCircle(canvas, x, 262 + Math.abs(i - 5) * 8, 6, [244, 115, 115, 190]);
    }
  }

  addNoise(canvas, 10, isClosed ? 306 : isBlessed ? 332 : 356);
  writePng(outputFile, canvas);
};

const makeIdol = (outputFile, state) => {
  const isClosed = state === 'closed';
  const isBlessed = state === 'blessed';
  const canvas = createCanvas(768, 768, [0, 0, 0, 0]);
  drawFrameBackground(
    canvas,
    isBlessed ? [14, 12, 15, 255] : [14, 10, 12, 255],
    isBlessed ? [8, 8, 10, 255] : [9, 7, 8, 255],
    isBlessed ? [136, 180, 203] : [201, 94, 94],
    isClosed ? 387 : isBlessed ? 421 : 468,
  );

  fillEllipse(canvas, 384, 570, 210, 78, [52, 52, 60, 230]);
  fillRoundedRect(canvas, 250, 182, 268, 364, 68, [84, 87, 97, 255]);
  fillRoundedRect(canvas, 280, 224, 208, 292, 48, [112, 118, 130, 240]);

  fillEllipse(canvas, 384, 244, 86, 104, [136, 142, 156, 245]);
  fillRect(canvas, 330, 336, 108, 14, [76, 82, 92, 230]);
  fillRect(canvas, 352, 346, 64, 10, [76, 82, 92, 230]);

  for (let y = 280; y < 512; y += 40) {
    fillRect(canvas, 306, y, 156, 6, [148, 156, 171, 160]);
  }

  if (isClosed) {
    fillEllipse(canvas, 350, 246, 14, 10, [43, 47, 52, 250]);
    fillEllipse(canvas, 418, 246, 14, 10, [43, 47, 52, 250]);
  } else if (isBlessed) {
    drawRadialGlow(canvas, 350, 246, 84, [122, 221, 255], 165);
    drawRadialGlow(canvas, 418, 246, 84, [122, 221, 255], 165);
    fillEllipse(canvas, 350, 246, 12, 9, [204, 248, 255, 255]);
    fillEllipse(canvas, 418, 246, 12, 9, [204, 248, 255, 255]);
    drawRadialGlow(canvas, 384, 360, 182, [150, 214, 242], 95);

    for (let i = 0; i < 18; i += 1) {
      const angle = (Math.PI * 2 * i) / 18;
      const x = 384 + Math.cos(angle) * 150;
      const y = 360 + Math.sin(angle) * 132;
      fillCircle(canvas, x, y, 5, [183, 233, 255, 165]);
    }
  } else {
    drawRadialGlow(canvas, 350, 246, 90, [255, 110, 110], 180);
    drawRadialGlow(canvas, 418, 246, 90, [255, 110, 110], 180);
    fillEllipse(canvas, 350, 246, 12, 9, [255, 156, 156, 255]);
    fillEllipse(canvas, 418, 246, 12, 9, [255, 156, 156, 255]);
    drawRadialGlow(canvas, 384, 360, 182, [220, 115, 115], 102);

    for (let i = 0; i < 18; i += 1) {
      const angle = (Math.PI * 2 * i) / 18;
      const x = 384 + Math.cos(angle) * 150;
      const y = 360 + Math.sin(angle) * 132;
      fillCircle(canvas, x, y, 5, [255, 151, 151, 170]);
    }
  }

  addNoise(canvas, 9, isClosed ? 449 : isBlessed ? 482 : 523);
  writePng(outputFile, canvas);
};

const writePng = (filePath, canvas) => {
  const raw = Buffer.alloc((canvas.width * 4 + 1) * canvas.height);
  let offset = 0;

  for (let y = 0; y < canvas.height; y += 1) {
    raw[offset] = 0;
    offset += 1;

    const rowStart = y * canvas.width * 4;
    for (let x = 0; x < canvas.width * 4; x += 1) {
      raw[offset + x] = canvas.data[rowStart + x];
    }
    offset += canvas.width * 4;
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(canvas.width, 0);
  ihdr.writeUInt32BE(canvas.height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = zlib.deflateSync(raw, { level: 9 });
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, png);
};

const targets = [
  [path.join(ROOT, 'public/yes.png'), () => makeYesScroll(path.join(ROOT, 'public/yes.png'))],
  [path.join(ROOT, 'public/no.png'), () => makeNoScroll(path.join(ROOT, 'public/no.png'))],
  [path.join(ROOT, 'public/object/sarcophagus/1.png'), () => makeSarcophagus(path.join(ROOT, 'public/object/sarcophagus/1.png'), 'closed')],
  [path.join(ROOT, 'public/object/sarcophagus/2.png'), () => makeSarcophagus(path.join(ROOT, 'public/object/sarcophagus/2.png'), 'blessed')],
  [path.join(ROOT, 'public/object/sarcophagus/3.png'), () => makeSarcophagus(path.join(ROOT, 'public/object/sarcophagus/3.png'), 'cursed')],
  [path.join(ROOT, 'public/object/vessel/1.png'), () => makeVessel(path.join(ROOT, 'public/object/vessel/1.png'), 'closed')],
  [path.join(ROOT, 'public/object/vessel/2.png'), () => makeVessel(path.join(ROOT, 'public/object/vessel/2.png'), 'blessed')],
  [path.join(ROOT, 'public/object/vessel/3.png'), () => makeVessel(path.join(ROOT, 'public/object/vessel/3.png'), 'cursed')],
  [path.join(ROOT, 'public/object/idol/1.png'), () => makeIdol(path.join(ROOT, 'public/object/idol/1.png'), 'closed')],
  [path.join(ROOT, 'public/object/idol/2.png'), () => makeIdol(path.join(ROOT, 'public/object/idol/2.png'), 'blessed')],
  [path.join(ROOT, 'public/object/idol/3.png'), () => makeIdol(path.join(ROOT, 'public/object/idol/3.png'), 'cursed')],
];

for (const [, build] of targets) {
  build();
}

for (const [filePath] of targets) {
  const stat = fs.statSync(filePath);
  console.log(`${path.relative(ROOT, filePath)} ${stat.size} bytes`);
}
