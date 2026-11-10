import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";

// The Telegram skill (integrations/skill/kanbo) as one zip, built without a library: files are stored
// uncompressed, which is fine for two small text files.

const FILES = [
  { name: "SKILL.md", mode: 0o644 },
  { name: "kanbo.mjs", mode: 0o755 },
];

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

const crc32 = (data: Buffer) => {
  let crc = 0xffffffff;
  for (const byte of data) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
};

function u16(value: number) {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16LE(value);
  return buffer;
}

function u32(value: number) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value >>> 0);
  return buffer;
}

export async function buildSkillZip() {
  const folder = join(process.cwd(), "integrations", "skill", "kanbo");
  const local: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;

  for (const file of FILES) {
    const data = await readFile(join(folder, file.name));
    const name = Buffer.from(`kanbo/${file.name}`);
    const crc = crc32(data);

    const header = Buffer.concat([
      u32(0x04034b50),
      u16(20),
      u16(0x0800),
      u16(0),
      u16(0),
      u16(0x21),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(name.length),
      u16(0),
      name,
    ]);
    central.push(
      Buffer.concat([
        u32(0x02014b50),
        u16((3 << 8) | 20),
        u16(20),
        u16(0x0800),
        u16(0),
        u16(0),
        u16(0x21),
        u32(crc),
        u32(data.length),
        u32(data.length),
        u16(name.length),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(((0o100000 | file.mode) << 16) >>> 0),
        u32(offset),
        name,
      ]),
    );
    local.push(header, data);
    offset += header.length + data.length;
  }

  const directory = Buffer.concat(central);
  const end = Buffer.concat([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(FILES.length),
    u16(FILES.length),
    u32(directory.length),
    u32(offset),
    u16(0),
  ]);
  return Buffer.concat([...local, directory, end]);
}
