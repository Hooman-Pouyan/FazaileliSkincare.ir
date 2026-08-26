# -*- coding: utf-8 -*-
"""Generate the card and detail derivatives every catalogue surface is served from.

    python3 scripts/media/derive.py [--limit N] [--force]      (or: pnpm media:derive)

Reads content/catalogue/storyderm-manifest.json, writes WebP derivatives and a
copy of each original into public/media/ under the C-8 object-key convention,
and emits content/catalogue/storyderm-media.lock.json.

The original is copied rather than left where it is so that public/media/ IS the
upload payload: one directory whose layout already matches the bucket, so the
CDN step is a single sync with no key rewriting and no chance of the local and
remote conventions drifting. It costs a duplicate of the sources on local disk,
which is gitignored, and it is what makes originalObjectKey a truthful pointer
rather than a name for a file nobody has put anywhere. The original is still
never served to a browser (C-8) — the sources run to 14 MiB.

The lock file is what the seed reads. It carries the checksum, MIME type, byte
size and pixel dimensions that product_media requires as NOT NULL, so seeding a
database needs neither an image library nor the source files — a fresh clone can
run `pnpm db:seed` without ever running this script. public/media/ is
gitignored; the lock is committed. That split keeps a hundred megabytes of WebP
out of git history while keeping the database reproducible.

Idempotent: a derivative whose source checksum is unchanged is skipped, so an
interrupted run resumes where it stopped. --force re-encodes everything.

WHY PYTHON. The Node image library the ecosystem would reach for is `sharp`,
which is not installed and cannot be installed in this environment. Pillow and
ImageMagick both are. This is offline build-time tooling that never ships in the
application bundle, and it sits beside scripts/catalogue/curate-storyderm.py,
which is Python for the same reason — so the rule being followed is "offline
asset and data tooling is Python", applied consistently, rather than a one-off
detour. Re-review if `sharp` becomes installable AND a second Node-side asset
task appears; converging on one language is worth a rewrite of two scripts, and
is not worth it for one. Recorded as C-18 in docs/26-content-and-catalogue-decisions.md.
"""

import argparse, hashlib, json, os, shutil, sys

try:
    from PIL import Image
except ImportError:  # pragma: no cover - environment guard
    sys.exit("Pillow is required: python3 -m pip install --user Pillow")

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MANIFEST = os.path.join(ROOT, "content", "catalogue", "storyderm-manifest.json")
LOCK = os.path.join(ROOT, "content", "catalogue", "storyderm-media.lock.json")
OUT = os.path.join(ROOT, "public", "media")

# Kept in step with src/lib/media/url.ts by storyderm-manifest.test.ts, which
# recomputes every key in the lock through the TypeScript builders and fails on
# any disagreement. Two implementations of one convention need a gate, not trust.
WIDTHS = {"card": 640, "detail": 1600}
MIME = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp"}


def slot(role, ordinal):
    return "primary" if role == "primary" else "%s-%d" % (role, ordinal)


def keys(brand, line, product, slot_name, extension):
    prefix = "catalog/%s/%s/%s" % (brand, line, product)
    return {
        "original": "%s/%s-original%s" % (prefix, slot_name, extension.lower()),
        "card": "%s/%s-%d.webp" % (prefix, slot_name, WIDTHS["card"]),
        "detail": "%s/%s-%d.webp" % (prefix, slot_name, WIDTHS["detail"]),
    }


def sha256(path):
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def encode(image, target_width, destination):
    width, height = image.size
    # Never upscale. The key names the nominal derivative, not a promise about
    # pixels — a 400px source stays 400px rather than being interpolated up.
    scale = min(1.0, float(target_width) / float(width))
    size = (max(1, int(round(width * scale))), max(1, int(round(height * scale))))
    resized = image if size == image.size else image.resize(size, Image.LANCZOS)
    os.makedirs(os.path.dirname(destination), exist_ok=True)
    # method=4, not 6. Measured on a 1916 x 3547 packshot: method 6 takes 10.3s
    # and method 4 takes 0.8s, for a file-size difference of a percent or two.
    # Ninety sources makes that the difference between ninety seconds and a
    # quarter of an hour, twice, every time a source changes.
    resized.save(destination, "WEBP", quality=82, method=4)
    return size


def write_lock(source_root, entries):
    """Written after every derived source, not once at the end.

    Each source takes about a second and the runner that invokes this script has
    a time ceiling, so a run that only persists its work on completion persists
    nothing and the next run starts from zero. Rewriting a small JSON file
    ninety times is cheaper than deriving one image twice.
    """
    ordered = sorted(entries, key=lambda entry: entry["sourcePath"])
    with open(LOCK, "w", encoding="utf-8") as handle:
        json.dump({
            "$comment": "Generated by scripts/media/derive.py. Committed so the seed needs no image library and no source files. public/media/ is gitignored and reproducible from this file plus the sources.",
            "sourceRoot": source_root,
            "entries": ordered,
        }, handle, ensure_ascii=False, indent=2)
        handle.write("\n")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0, help="stop after N sources")
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    with open(MANIFEST, encoding="utf-8") as handle:
        manifest = json.load(handle)

    previous = {}
    if os.path.exists(LOCK):
        with open(LOCK, encoding="utf-8") as handle:
            for entry in json.load(handle)["entries"]:
                previous[entry["sourcePath"]] = entry

    source_root = os.path.join(ROOT, manifest["sourceRoot"])
    brand = manifest["brand"]["slug"]
    entries, done, skipped = [], 0, 0

    for product in manifest["products"]:
        for media in product["media"]:
            relative = media["path"]
            source = os.path.join(source_root, relative)
            if not os.path.exists(source):
                sys.exit("missing source: %s" % relative)

            extension = os.path.splitext(relative)[1].lower()
            object_keys = keys(brand, product["line"], product["slug"],
                               slot(media["role"], media["ordinal"]), extension)

            checksum = sha256(source)
            cached = previous.get(relative)
            targets = [os.path.join(OUT, object_keys[k]) for k in ("original", "card", "detail")]
            fresh = (cached and cached["checksumSha256"] == checksum
                     and cached["objectKeys"] == object_keys
                     and all(os.path.exists(t) for t in targets))

            if fresh and not args.force:
                entries.append(cached)
                skipped += 1
                continue

            if args.limit and done >= args.limit:
                if cached:
                    entries.append(cached)
                continue

            with Image.open(source) as image:
                image.load()
                width, height = image.size
                # Detail first, then card from the detail rather than the
                # source: one expensive resize instead of two.
                detail = encode(image, WIDTHS["detail"], os.path.join(OUT, object_keys["detail"]))
                with Image.open(os.path.join(OUT, object_keys["detail"])) as intermediate:
                    intermediate.load()
                    card = encode(intermediate, WIDTHS["card"], os.path.join(OUT, object_keys["card"]))

            original_destination = os.path.join(OUT, object_keys["original"])
            os.makedirs(os.path.dirname(original_destination), exist_ok=True)
            shutil.copyfile(source, original_destination)

            entries.append({
                "sourcePath": relative,
                "sourceFilename": os.path.basename(relative),
                "objectKeys": object_keys,
                "checksumSha256": checksum,
                "mimeType": MIME.get(extension, "application/octet-stream"),
                "byteSize": os.path.getsize(source),
                "width": width,
                "height": height,
                "derivatives": {
                    "card": {"width": card[0], "height": card[1]},
                    "detail": {"width": detail[0], "height": detail[1]},
                },
            })
            done += 1
            write_lock(manifest["sourceRoot"], entries)
            print("derived %s" % relative, flush=True)

    write_lock(manifest["sourceRoot"], entries)

    total = sum(len(p["media"]) for p in manifest["products"])
    print("derived=%d skipped=%d locked=%d of %d" % (done, skipped, len(entries), total))
    if len(entries) < total:
        print("INCOMPLETE — %d sources still to derive; re-run to continue." % (total - len(entries)))


if __name__ == "__main__":
    main()
