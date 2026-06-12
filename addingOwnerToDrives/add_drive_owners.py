import argparse
import json
import re
import time
from collections import Counter
from pathlib import Path
from playwright.sync_api import sync_playwright

BAD = {
    "owner", "propriétaire", "date modified", "modified", "file size",
    "name", "type", "people", "source", "view sort options",
    "more actions", "details", "activity", "drive", "google drive",
    "shared with me", "my drive", "home", "new"
}

def load_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))

def save_json(path, data):
    Path(path).write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

def parse_cookies(path):
    cookies = []

    for line in Path(path).read_text(encoding="utf-8", errors="ignore").splitlines():
        line = line.strip()

        if not line or line.startswith("# Netscape") or line.startswith("# HTTP"):
            continue

        http_only = False

        if line.startswith("#HttpOnly_"):
            http_only = True
            line = line.replace("#HttpOnly_", "", 1)

        if line.startswith("#"):
            continue

        parts = line.split("\t")

        if len(parts) != 7:
            continue

        domain, _, cookie_path, secure, expires, name, value = parts

        try:
            expires = int(expires)
        except:
            expires = -1

        cookies.append({
            "name": name,
            "value": value,
            "domain": domain,
            "path": cookie_path,
            "expires": expires,
            "httpOnly": http_only,
            "secure": secure.upper() == "TRUE",
            "sameSite": "Lax"
        })

    return cookies

def clean(value):
    if not value:
        return None

    value = value.replace("\xa0", " ")
    value = re.sub(r"\s+", " ", value).strip()
    value = value.strip(":.-")

    if not value:
        return None

    low = value.lower()

    if low in BAD:
        return None

    if len(value) <= 1:
        return None

    if re.fullmatch(r"[A-ZÀ-Ý]", value):
        return None

    if "view sort" in low:
        return None

    if "more actions" in low:
        return None

    if re.match(r"^\d{1,2}\s+[A-Za-z]+", value):
        return None

    if re.match(r"^\d{1,2}/\d{1,2}/\d{2,4}", value):
        return None

    if re.match(r"^\d+(\.\d+)?\s?(KB|MB|GB|TB|Ko|Mo|Go|To)$", value, re.I):
        return None

    return value
def force_list_view(page):
    selectors = [
        '[aria-label*="List layout" i]',
        '[aria-label*="List view" i]',
        '[aria-label*="Affichage liste" i]',
        '[aria-label*="Vue liste" i]'
    ]

    for selector in selectors:
        try:
            loc = page.locator(selector).first
            if loc.count() > 0:
                loc.click(timeout=3000)
                time.sleep(2)
                return
        except:
            pass

def extract_owner_from_owner_column(page):
    js = """
    () => {
        function visibleTextNodes() {
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
            const nodes = [];

            while (walker.nextNode()) {
                const node = walker.currentNode;
                const text = node.nodeValue.trim();

                if (!text) continue;

                const range = document.createRange();
                range.selectNodeContents(node);

                const rects = Array.from(range.getClientRects());

                for (const r of rects) {
                    if (r.width > 0 && r.height > 0) {
                        nodes.push({
                            text,
                            x: r.x,
                            y: r.y,
                            w: r.width,
                            h: r.height
                        });
                    }
                }
            }

            return nodes;
        }

        const nodes = visibleTextNodes();

        const headers = nodes.filter(n => {
            const t = n.text.toLowerCase();
            return t === "owner" || t === "propriétaire";
        });

        if (headers.length === 0) {
            return [];
        }

        const ownerHeader = headers.sort((a, b) => a.y - b.y)[0];

        const nextHeaders = nodes.filter(n => {
            const t = n.text.toLowerCase();
            return (
                n.y >= ownerHeader.y - 20 &&
                n.y <= ownerHeader.y + 40 &&
                n.x > ownerHeader.x &&
                (
                    t === "date modified" ||
                    t === "modified" ||
                    t === "file size" ||
                    t === "taille du fichier" ||
                    t === "modifié"
                )
            );
        });

        let rightLimit = ownerHeader.x + 260;

        if (nextHeaders.length > 0) {
            rightLimit = Math.min(...nextHeaders.map(h => h.x)) - 5;
        }

        const values = nodes
            .filter(n =>
                n.y > ownerHeader.y + 30 &&
                n.x >= ownerHeader.x - 40 &&
                n.x <= rightLimit &&
                n.text.toLowerCase() !== "owner" &&
                n.text.toLowerCase() !== "propriétaire"
            )
            .sort((a, b) => a.y - b.y)
            .map(n => n.text);

        return values;
    }
    """

    try:
        values = page.evaluate(js)
    except:
        return None

    cleaned = []

    for value in values:
        value = clean(value)
        if value:
            cleaned.append(value)

    if not cleaned:
        return None

    counter = Counter(cleaned)
    return counter.most_common(1)[0][0]

def save_debug(page, index):
    debug_dir = Path("debug_owner")
    debug_dir.mkdir(exist_ok=True)

    try:
        text = page.locator("body").inner_text(timeout=5000)
        (debug_dir / f"debug_{index}.txt").write_text(text, encoding="utf-8", errors="ignore")
    except:
        pass

    try:
        page.screenshot(path=str(debug_dir / f"debug_{index}.png"), full_page=True)
    except:
        pass

def get_owner(page, link, index):
    try:
        page.goto(link, wait_until="domcontentloaded", timeout=60000)
        time.sleep(7)

        force_list_view(page)
        time.sleep(2)

        owner = extract_owner_from_owner_column(page)

        if owner:
            return owner

        save_debug(page, index)
        return "Non disponible"

    except Exception as e:
        save_debug(page, index)
        return "Erreur: " + str(e)[:120]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("input_json")
    parser.add_argument("cookies_txt")
    parser.add_argument("-o", "--output")
    parser.add_argument("--headless", action="store_true")
    parser.add_argument("--start", type=int, default=1)
    parser.add_argument("--delay", type=float, default=2)
    args = parser.parse_args()

    input_path = Path(args.input_json)
    output_path = Path(args.output) if args.output else input_path.with_name(input_path.stem + "_with_owners.json")

    data = load_json(input_path)
    cookies = parse_cookies(args.cookies_txt)

    print(f"Loaded {len(cookies)} cookies")
    print(f"Loaded {len(data)} JSON items")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=args.headless)
        context = browser.new_context(locale="en-US")
        context.add_cookies(cookies)

        page = context.new_page()
        page.set_default_timeout(10000)

        try:
            for i, item in enumerate(data, start=1):
                if i < args.start:
                    continue

                link = item.get("link", "")
                print(f"[{i}/{len(data)}] {link}")

                owner = get_owner(page, link, i)
                item["owner"] = owner

                print(f"  owner: {owner}")

                save_json(output_path, data)
                time.sleep(args.delay)

        except KeyboardInterrupt:
            print("\nStopped by user. Progress saved.")

        browser.close()

    save_json(output_path, data)
    print(f"Done: {output_path}")

if __name__ == "__main__":
    main()