from pathlib import Path

root = Path(__file__).resolve().parents[1]
index = root / "index.html"
fragment = root / "content" / "curated-landing.html"
out = root / "_site"
out.mkdir(exist_ok=True)

html = index.read_text(encoding="utf-8")
section = fragment.read_text(encoding="utf-8")
marker = '<section class="sec" id="contact">'
if marker not in html:
    raise SystemExit("Landing-page contact marker not found; refusing to build.")
if "id=\"curated-profile\"" in html:
    raise SystemExit("Curated profile already injected; refusing duplicate build.")
html = html.replace(marker, section + "\n" + marker, 1)
(out / "index.html").write_text(html, encoding="utf-8")

# Copy the rest of the static site unchanged.
for src in root.iterdir():
    if src.name in {"_site", ".git", ".github", "scripts", "content"}:
        continue
    dst = out / src.name
    if src.is_dir():
        import shutil
        shutil.copytree(src, dst, dirs_exist_ok=True)
    elif src.is_file():
        dst.write_bytes(src.read_bytes())
