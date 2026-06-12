import argparse
import shutil
import sqlite3
import time
import re
from pathlib import Path
from urllib.parse import urlparse, urlunparse

def get_history_path(profile):
    return Path.home() / "AppData" / "Local" / "Google" / "Chrome" / "User Data" / profile / "History"

def read_state(path):
    return int(path.read_text()) if path.exists() else None

def write_state(path, value):
    path.write_text(str(value))

def get_max_time(db_path):
    con = sqlite3.connect(db_path)
    cur = con.cursor()
    cur.execute("SELECT COALESCE(MAX(visit_time), 0) FROM visits")
    value = cur.fetchone()[0]
    con.close()
    return value

def clean_url(url):
    parsed = urlparse(url)

    clean = urlunparse((
        parsed.scheme,
        parsed.netloc,
        parsed.path,
        "",
        "",
        ""
    ))

    match = re.search(r"drive\.google\.com/drive/(?:mobile/|u/\d+/)?folders/([^/?#]+)", clean)
    if match:
        return f"https://drive.google.com/drive/folders/{match.group(1)}"

    match = re.search(r"drive\.google\.com/file/d/([^/?#]+)", clean)
    if match:
        return f"https://drive.google.com/file/d/{match.group(1)}"

    return clean.rstrip("/")

def load_existing_links(output_file):
    if not output_file.exists():
        return set()

    with output_file.open("r", encoding="utf-8") as f:
        return set(line.strip() for line in f if line.strip())

def collect_new_links(history_path, last_time):
    temp_db = Path("chrome_history_copy.db")
    shutil.copy2(history_path, temp_db)

    con = sqlite3.connect(temp_db)
    cur = con.cursor()

    cur.execute("""
        SELECT visits.visit_time, urls.url
        FROM visits
        JOIN urls ON visits.url = urls.id
        WHERE visits.visit_time > ?
        ORDER BY visits.visit_time ASC
    """, (last_time,))

    rows = cur.fetchall()
    con.close()
    temp_db.unlink(missing_ok=True)
    return rows

def append_links(output_file, rows):
    existing = load_existing_links(output_file)
    saved = 0

    with output_file.open("a", encoding="utf-8") as f:
        for _, url in rows:
            url = clean_url(url)

            if url not in existing:
                f.write(url + "\n")
                existing.add(url)
                saved += 1

    return saved

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--profile", default="Default")
    parser.add_argument("--interval", type=int, default=2)
    parser.add_argument("--output", default="visited_links.txt")
    parser.add_argument("--dump-old", action="store_true")
    args = parser.parse_args()

    history_path = get_history_path(args.profile)
    output_file = Path(args.output)
    state_file = Path(".last_chrome_visit_time")

    if not history_path.exists():
        print(f"Chrome history not found: {history_path}")
        return

    last_time = read_state(state_file)

    if last_time is None:
        copied = Path("chrome_history_copy.db")
        shutil.copy2(history_path, copied)
        last_time = 0 if args.dump_old else get_max_time(copied)
        copied.unlink(missing_ok=True)
        write_state(state_file, last_time)

    print(f"Saving clean new links to {output_file}")
    print("Press Ctrl+C to stop.")

    while True:
        rows = collect_new_links(history_path, last_time)

        if rows:
            saved = append_links(output_file, rows)
            last_time = max(row[0] for row in rows)
            write_state(state_file, last_time)

            if saved:
                print(f"Saved {saved} new clean link(s).")

        time.sleep(args.interval)

if __name__ == "__main__":
    main()