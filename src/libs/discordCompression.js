// src/libs/discordCompression.js
// Shared helpers for compressing/decompressing Discord chat message bodies.
// Used by the model (via mongoose hooks) and by API routes (for lean() docs).

import zlib from "zlib";

/**
 * Compress a plain-text string into a zlib deflate Buffer.
 */
export function compressBody(text) {
  if (!text) return Buffer.alloc(0);
  try {
    return zlib.deflateRawSync(Buffer.from(String(text), "utf8"), { level: 6 });
  } catch {
    return Buffer.from(String(text), "utf8");
  }
}

/**
 * Decompress a Buffer back to a plain-text string.
 * Falls back to raw UTF-8 for legacy uncompressed rows.
 */
export function decompressBodyLean(buf) {
  if (!buf) return "";
  // Handle plain Buffer or binary-like objects (mongoose lean returns Buffer)
  const buffer = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  if (buffer.length === 0) return "";
  try {
    return zlib.inflateRawSync(buffer).toString("utf8");
  } catch {
    // Legacy rows stored as plain utf8
    try {
      return buffer.toString("utf8");
    } catch {
      return "";
    }
  }
}

/**
 * Approximate compression ratio info for logging/debugging.
 */
export function compressionStats(original, compressed) {
  const orig = Buffer.byteLength(original, "utf8");
  const comp = Buffer.isBuffer(compressed) ? compressed.length : 0;
  const ratio = orig > 0 ? ((1 - comp / orig) * 100).toFixed(1) : 0;
  return { originalBytes: orig, compressedBytes: comp, savingPercent: ratio };
}
