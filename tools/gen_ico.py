#!/usr/bin/env python3
"""
Regenerate src-tauri/icons/icon.ico from source PNG files.

ICO format strategy:
  - 16x16, 24x24, 32x32, 48x48, 64x64, 128x128: raw BMP DIB (widest compatibility
    with windres/rc.exe during cross-compilation)
  - 256x256: PNG-in-ICO (Vista+ standard; reduces file size for this large frame)

Source images:
  - 16x16:  design/branding/flite-logo-vf-full-16.png   (native size)
  - 32x32:  design/branding/flite-logo-vf-full-32.png   (native size)
  - 64x64:  design/branding/flite-logo-vf-full-64.png   (native size)
  - 128x128: design/branding/flite-logo-vf-full-128.png (native size)
  - 256x256: design/branding/flite-logo-vf-full-256.png (native size)
  - 24x24:  bilinear downscale of 32x32
  - 48x48:  bilinear downscale of 64x64
"""

import os
import struct
import zlib

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BRANDING = os.path.join(REPO, "design", "branding")
OUT_ICO = os.path.join(REPO, "src-tauri", "icons", "icon.ico")


# ---------------------------------------------------------------------------
# PNG reader — pure stdlib, handles 8-bit RGBA and RGB PNGs
# ---------------------------------------------------------------------------

def _paeth(a, b, c):
    p = a + b - c
    pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
    if pa <= pb and pa <= pc:
        return a
    if pb <= pc:
        return b
    return c


def read_png_rgba(path):
    """Return (width, height, bytes) where bytes is raw top-down RGBA."""
    with open(path, "rb") as f:
        data = f.read()

    assert data[:8] == b"\x89PNG\r\n\x1a\n", f"Not a PNG file: {path}"

    width = height = bit_depth = color_type = None
    idat_chunks = []

    pos = 8
    while pos < len(data):
        clen = struct.unpack_from(">I", data, pos)[0]
        ctype = data[pos + 4 : pos + 8]
        cdata = data[pos + 8 : pos + 8 + clen]
        pos += 12 + clen

        if ctype == b"IHDR":
            width, height = struct.unpack_from(">II", cdata)
            bit_depth = cdata[8]
            color_type = cdata[9]
        elif ctype == b"IDAT":
            idat_chunks.append(cdata)
        elif ctype == b"IEND":
            break

    assert bit_depth == 8, f"Only 8-bit PNGs supported (got {bit_depth})"
    assert color_type in (2, 6), f"Only RGB/RGBA PNGs supported (color_type={color_type})"

    bpp = 4 if color_type == 6 else 3
    raw = zlib.decompress(b"".join(idat_chunks))
    stride = width * bpp
    result = bytearray(height * width * 4)

    prev = bytes(stride)
    rpos = 0
    for y in range(height):
        ftype = raw[rpos]
        rpos += 1
        row = bytearray(raw[rpos : rpos + stride])
        rpos += stride

        if ftype == 0:  # None
            pass
        elif ftype == 1:  # Sub
            for x in range(bpp, stride):
                row[x] = (row[x] + row[x - bpp]) & 0xFF
        elif ftype == 2:  # Up
            for x in range(stride):
                row[x] = (row[x] + prev[x]) & 0xFF
        elif ftype == 3:  # Average
            for x in range(stride):
                a = row[x - bpp] if x >= bpp else 0
                row[x] = (row[x] + (a + prev[x]) // 2) & 0xFF
        elif ftype == 4:  # Paeth
            for x in range(stride):
                a = row[x - bpp] if x >= bpp else 0
                b = prev[x]
                c = prev[x - bpp] if x >= bpp else 0
                row[x] = (row[x] + _paeth(a, b, c)) & 0xFF
        else:
            raise ValueError(f"Unknown PNG filter {ftype}")

        prev = bytes(row)

        if bpp == 4:
            result[y * width * 4 : (y + 1) * width * 4] = row
        else:
            for x in range(width):
                result[(y * width + x) * 4 : (y * width + x) * 4 + 3] = row[x * 3 : x * 3 + 3]
                result[(y * width + x) * 4 + 3] = 255

    return width, height, bytes(result)


# ---------------------------------------------------------------------------
# Bilinear downscaler
# ---------------------------------------------------------------------------

def scale_bilinear(rgba, sw, sh, dw, dh):
    """Bilinear interpolation resize; returns RGBA bytes."""
    out = bytearray(dw * dh * 4)
    for dy in range(dh):
        sy_f = dy * (sh - 1) / max(dh - 1, 1)
        sy0 = int(sy_f)
        sy1 = min(sy0 + 1, sh - 1)
        fy = sy_f - sy0
        for dx in range(dw):
            sx_f = dx * (sw - 1) / max(dw - 1, 1)
            sx0 = int(sx_f)
            sx1 = min(sx0 + 1, sw - 1)
            fx = sx_f - sx0
            w00 = (1 - fx) * (1 - fy)
            w10 = fx * (1 - fy)
            w01 = (1 - fx) * fy
            w11 = fx * fy
            i00 = (sy0 * sw + sx0) * 4
            i10 = (sy0 * sw + sx1) * 4
            i01 = (sy1 * sw + sx0) * 4
            i11 = (sy1 * sw + sx1) * 4
            di = (dy * dw + dx) * 4
            for c in range(4):
                v = (rgba[i00 + c] * w00 + rgba[i10 + c] * w10 +
                     rgba[i01 + c] * w01 + rgba[i11 + c] * w11)
                out[di + c] = int(round(v)) & 0xFF
    return bytes(out)


# ---------------------------------------------------------------------------
# BMP DIB encoder (for ICO embedding — no file header)
# ---------------------------------------------------------------------------

def rgba_to_bmp_dib(rgba, w, h):
    """Return BITMAPINFOHEADER + XOR mask (BGRA, bottom-up) + AND mask."""
    # AND mask row must be 32-bit aligned
    and_row_bytes = ((w + 31) // 32) * 4

    hdr = struct.pack(
        "<IiiHHIIiiII",
        40,          # biSize
        w,           # biWidth
        h * 2,       # biHeight (doubled: XOR + AND masks)
        1,           # biPlanes
        32,          # biBitCount
        0,           # biCompression BI_RGB
        0,           # biSizeImage
        0, 0, 0, 0,  # pels/meter, colors used/important
    )

    xor = bytearray(w * h * 4)
    for y in range(h):
        src_y = y
        dst_y = h - 1 - y  # bottom-up
        for x in range(w):
            si = (src_y * w + x) * 4
            di = (dst_y * w + x) * 4
            r, g, b, a = rgba[si], rgba[si+1], rgba[si+2], rgba[si+3]
            xor[di:di+4] = bytes([b, g, r, a])

    and_mask = bytes(and_row_bytes * h)  # all transparent (alpha in XOR mask)
    return hdr + bytes(xor) + and_mask


# ---------------------------------------------------------------------------
# ICO assembler
# ---------------------------------------------------------------------------

def build_ico(entries):
    """
    entries: list of (width, height, img_bytes, use_png)
      img_bytes: PNG bytes if use_png else RGBA raw bytes
    Returns ICO file bytes.
    """
    n = len(entries)
    blobs = []
    for w, h, img, use_png in entries:
        if use_png:
            blobs.append(img)
        else:
            blobs.append(rgba_to_bmp_dib(img, w, h))

    data_start = 6 + n * 16
    offsets = []
    off = data_start
    for b in blobs:
        offsets.append(off)
        off += len(b)

    header = struct.pack("<HHH", 0, 1, n)
    directory = b""
    for (w, h, _, use_png), blob, offset in zip(entries, blobs, offsets):
        wb = 0 if w == 256 else w
        hb = 0 if h == 256 else h
        bc = 0 if use_png else 32  # bit count (0 in dir is fine for PNG)
        directory += struct.pack(
            "<BBBBHHII",
            wb, hb,        # width, height
            0,             # color count (0 = 256+)
            0,             # reserved
            1,             # planes
            bc,            # bit count
            len(blob),     # bytes in resource
            offset,        # offset to image data
        )

    return header + directory + b"".join(blobs)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    src = {
        16:  os.path.join(BRANDING, "flite-logo-vf-full-16.png"),
        32:  os.path.join(BRANDING, "flite-logo-vf-full-32.png"),
        64:  os.path.join(BRANDING, "flite-logo-vf-full-64.png"),
        128: os.path.join(BRANDING, "flite-logo-vf-full-128.png"),
        256: os.path.join(BRANDING, "flite-logo-vf-full-256.png"),
    }

    print("Reading source PNGs...")
    imgs = {}
    for size, path in src.items():
        w, h, rgba = read_png_rgba(path)
        assert w == size and h == size, f"{path}: expected {size}x{size}, got {w}x{h}"
        imgs[size] = rgba
        print(f"  {size}x{size}: {w}x{h} ok ({len(rgba)} bytes RGBA)")

    print("Generating 24x24 (bilinear from 32x32)...")
    imgs[24] = scale_bilinear(imgs[32], 32, 32, 24, 24)

    print("Generating 48x48 (bilinear from 64x64)...")
    imgs[48] = scale_bilinear(imgs[64], 64, 64, 48, 48)

    # Load 256 as raw PNG bytes for PNG-in-ICO entry
    with open(src[256], "rb") as f:
        png256 = f.read()

    entries = [
        (16,  16,  imgs[16],  False),  # raw BMP DIB
        (24,  24,  imgs[24],  False),  # raw BMP DIB
        (32,  32,  imgs[32],  False),  # raw BMP DIB
        (48,  48,  imgs[48],  False),  # raw BMP DIB
        (64,  64,  imgs[64],  False),  # raw BMP DIB
        (128, 128, imgs[128], False),  # raw BMP DIB
        (256, 256, png256,    True),   # PNG-in-ICO (Vista+)
    ]

    ico = build_ico(entries)

    with open(OUT_ICO, "wb") as f:
        f.write(ico)

    print(f"\nWrote {OUT_ICO}")
    print(f"  Total size: {len(ico):,} bytes")
    print(f"  Images: {len(entries)}")

    # Verify by re-parsing
    import hashlib
    count = struct.unpack_from("<H", ico, 4)[0]
    print(f"\nVerification ({count} images):")
    for i in range(count):
        off = 6 + i * 16
        wb, hb, _, _, planes, bc, size, img_off = struct.unpack_from("<BBBBHHII", ico, off)
        w = 256 if wb == 0 else wb
        chunk = ico[img_off : img_off + size]
        fmt = "PNG-in-ICO" if chunk[:8] == b"\x89PNG\r\n\x1a\n" else "BMP-DIB"
        md5 = hashlib.md5(chunk).hexdigest()[:8]
        print(f"  {w:3d}x{w:<3d}  {fmt:<12}  {size:>8,} bytes  md5={md5}")


if __name__ == "__main__":
    main()
