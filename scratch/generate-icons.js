const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function png(width, height, r, g, b) {
  // PNG Signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeInt32BE(width, 0);
  ihdrData.writeInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type: RGB
  ihdrData[10] = 0; // compression method
  ihdrData[11] = 0; // filter method
  ihdrData[12] = 0; // interlace method
  
  const ihdr = chunk('IHDR', ihdrData);
  
  // IDAT Chunk
  const rowSize = width * 3 + 1;
  const imgData = Buffer.alloc(height * rowSize);
  for (let y = 0; y < height; y++) {
    imgData[y * rowSize] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const idx = y * rowSize + 1 + x * 3;
      
      let isLetterU = false;
      
      // Normalize coordinates to [-1, 1] range for shapes drawing
      const nx = (x / width) * 2 - 1;
      const ny = (y / height) * 2 - 1;
      
      // Drawing a beautiful "U" monogram
      // Left vertical stem: nx in [-0.35, -0.15], ny in [-0.4, 0.15]
      // Right vertical stem: nx in [0.15, 0.35], ny in [-0.4, 0.15]
      // Bottom connection: nx in [-0.35, 0.35], ny in [0.15, 0.4]
      const inLeftStem = nx >= -0.35 && nx <= -0.15 && ny >= -0.4 && ny <= 0.15;
      const inRightStem = nx >= 0.15 && nx <= 0.35 && ny >= -0.4 && ny <= 0.15;
      const inBottomCurve = nx >= -0.35 && nx <= 0.35 && ny >= 0.15 && ny <= 0.4;
      
      if (inLeftStem || inRightStem || inBottomCurve) {
        // Exclude internal curve space
        const inInnerCurve = nx > -0.15 && nx < 0.15 && ny >= 0.15 && ny <= 0.22;
        if (!inInnerCurve) {
          isLetterU = true;
        }
      }
      
      if (isLetterU) {
        // Stylized White Color for the Logo
        imgData[idx] = 255;
        imgData[idx + 1] = 255;
        imgData[idx + 2] = 255;
      } else {
        // Elegant brand Indigo color (#4f46e5)
        imgData[idx] = r;
        imgData[idx + 1] = g;
        imgData[idx + 2] = b;
      }
    }
  }
  
  const compressed = zlib.deflateSync(imgData);
  const idat = chunk('IDAT', compressed);
  
  // IEND Chunk
  const iend = chunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdr, idat, iend]);
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeInt32BE(data.length, 0);
  
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = crc32(Buffer.concat([typeBuf, data]));
  
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);
  
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// Standard CRC32 table generator and function
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const dir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

// Brand color details: Indigo (#4f46e5)
const r = 79, g = 70, b = 229;

fs.writeFileSync(path.join(dir, 'icon-192x192.png'), png(192, 192, r, g, b));
fs.writeFileSync(path.join(dir, 'icon-512x512.png'), png(512, 512, r, g, b));
console.log('PWA Icons generated successfully in public/icons!');
