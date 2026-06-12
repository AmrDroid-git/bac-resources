import argparse
import re
from pathlib import Path
from urllib.parse import urlparse, parse_qs

def extract_links(text):
    return re.findall(r"https?://[^\s\"'<>]+", text)

def clean_url(url):
    return url.strip().rstrip(".,;)")

def normalize_drive_folder(url):
    match = re.search(r"drive\.google\.com/drive/(?:mobile/|u/\d+/)?folders/([^/?#]+)", url)
    if match:
        return f"https://drive.google.com/drive/folders/{match.group(1)}"
    return None

def normalize_drive_file(url):
    match = re.search(r"drive\.google\.com/(?:drive/u/\d+/)?file/d/([^/?#]+)", url)
    if match:
        return f"https://drive.google.com/file/d/{match.group(1)}"

    parsed = urlparse(url)
    qs = parse_qs(parsed.query)

    if parsed.netloc == "drive.google.com" and parsed.path in ["/open", "/uc"]:
        file_id = qs.get("id", [None])[0]
        if file_id:
            return f"https://drive.google.com/file/d/{file_id}"

    match = re.search(r"docs\.google\.com/(document|spreadsheets|presentation|forms)/d/([^/?#]+)", url)
    if match:
        return f"https://docs.google.com/{match.group(1)}/d/{match.group(2)}"

    return None

def save_links(filename, links):
    with open(filename, "w", encoding="utf-8") as f:
        for link in sorted(links):
            f.write(link + "\n")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("input_file")
    args = parser.parse_args()

    input_path = Path(args.input_file)

    drive_folders = set()
    drive_files = set()
    other_links = set()

    content = input_path.read_text(encoding="utf-8", errors="ignore")
    links = extract_links(content)

    for link in links:
        link = clean_url(link)

        folder = normalize_drive_folder(link)
        if folder:
            drive_folders.add(folder)
            continue

        file = normalize_drive_file(link)
        if file:
            drive_files.add(file)
            continue

        parsed = urlparse(link)
        clean = f"{parsed.scheme}://{parsed.netloc}{parsed.path}".rstrip("/")
        other_links.add(clean)

    save_links("drive_folders.txt", drive_folders)
    save_links("drive_files.txt", drive_files)
    save_links("other_links.txt", other_links)

    print(f"Drive folders: {len(drive_folders)}")
    print(f"Drive files: {len(drive_files)}")
    print(f"Other links: {len(other_links)}")
    print("Done.")

if __name__ == "__main__":
    main()