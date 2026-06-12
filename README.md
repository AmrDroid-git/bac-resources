[README.md](https://github.com/user-attachments/files/28883192/README.md)
# Bac Ressources

https://resources-bac.netlify.app/
https://resources-bac.netlify.app/
https://resources-bac.netlify.app/

A clean static website that collects and organizes useful resources for Tunisian baccalaureate students.  
The project groups Google Drive folders, Drive files, and useful websites in one simple interface with search, filters, download pages, and a contribution form.

## Overview

**Bac Ressources** was created to make Bac revision resources easier to find. Instead of keeping links scattered in messages, groups, or browser history, the project collects them, cleans them, organizes them, labels them, and displays them in a modern French website.

The website includes:

- a home page with resource statistics;
- a resources page for Google Drive folders and files;
- search and filtering by type and owner;
- a separate page for useful websites;
- a download page for all resources in JSON and TXT formats;
- a contribution page with a Google Form;
- an about page with project information;
- a custom 404 page;
- animated and responsive styling.

## Live Website

Add your deployed link here:

```txt
https://your-netlify-link.netlify.app
```

## Repository Structure

```txt
bac-resources/
│
├── website/                  # Final static website ready for deployment
│   ├── index.html
│   ├── resources.html
│   ├── websites.html
│   ├── downloadAll.html
│   ├── collaborate.html
│   ├── about.html
│   ├── 404.html
│   ├── style.css
│   ├── script.js
│   ├── netlify.toml
│   └── data/
│       ├── folders.json
│       ├── files.json
│       ├── websites.json
│       ├── all_resources.json
│       ├── folders.txt
│       ├── files.txt
│       ├── websites.txt
│       └── all_resources.txt
│
├── backupwebsite/            # Backup copy of the website
├── collectingData/           # Scripts for collecting links from Chrome history
├── filteringData/            # Scripts for separating Drive folders, Drive files, and other links
├── labeledJSONData/          # Labeled JSON files
├── addingOwnerToDrives/      # Script for scraping Google Drive owners
├── readyDataSet/             # Final prepared dataset
├── prompts/                  # Prompts used during data preparation
└── links.txt                 # Raw collected links
```

## Current Dataset

The current website data contains:

- **49** Google Drive folders;
- **5** Google Drive files;
- **4** useful websites;
- **58** resources in total.

The final public data used by the website is stored in:

```txt
website/data/
```

## Main Pages

| Page | Description |
|---|---|
| `index.html` | Home page with introduction and statistics |
| `resources.html` | Google Drive folders and files with search and filters |
| `websites.html` | Useful websites displayed separately |
| `downloadAll.html` | Download all resources in JSON or TXT format |
| `collaborate.html` | Page for users to submit new resources |
| `about.html` | Information about the project and creators |
| `404.html` | Custom error page |

## Tech Stack

This project is intentionally simple and easy to deploy.

- **HTML5**
- **CSS3**
- **Vanilla JavaScript**
- **JSON / TXT data files**
- **Python scripts for data processing**
- **Netlify for deployment**

There is no frontend framework and no backend server required for the website.

## Run Locally

Open a terminal inside the `website` folder:

```bash
cd website
python -m http.server 3000
```

Then open:

```txt
http://localhost:3000
```

Do not open the HTML files directly by double-clicking them, because the browser may block local JSON loading. Use the local server command above.

## Deploy on Netlify

### Option 1: Manual Deploy

1. Go to Netlify.
2. Click **Add new site**.
3. Choose **Deploy manually**.
4. Drag and drop the `website/` folder.
5. Netlify will publish the site.

### Option 2: Deploy from GitHub

1. Push this repository to GitHub.
2. Go to Netlify.
3. Choose **Add new site** → **Import an existing project**.
4. Connect the GitHub repository.
5. Use these settings:

```txt
Base directory: website
Build command: empty
Publish directory: .
```

If the repository contains only the website files directly at the root, use:

```txt
Build command: empty
Publish directory: .
```

## Update Resources

To update the resources shown on the website, edit the files inside:

```txt
website/data/
```

The most important files are:

```txt
folders.json
files.json
websites.json
all_resources.json
```

Each resource follows this kind of structure:

```json
{
  "type": "folder",
  "name": "Resource name",
  "description": "Short description of the resource.",
  "link": "https://drive.google.com/...",
  "owner": "Owner name"
}
```

For websites, the `owner` field is not required.

After editing the JSON files, update the TXT files too if needed:

```txt
folders.txt
files.txt
websites.txt
all_resources.txt
```

## Data Preparation Workflow

The repository also contains helper scripts used to collect and organize the resources.

### 1. Collect links from Chrome history

```bash
cd collectingData
python save_chrome_links.py --output visited_links.txt
```

This script watches Chrome history and saves clean new links.

### 2. Separate collected links

```bash
cd filteringData
python separate_links.py ../links.txt
```

This creates:

```txt
drive_folders.txt
drive_files.txt
other_links.txt
```

### 3. Add Google Drive owners

```bash
cd addingOwnerToDrives
python add_drive_owners.py drive_folders_fr.json cookies.txt --headless
```

This script uses Playwright and browser cookies to open Drive links and try to extract the owner name.

## Notes

- Some Google Drive links may require permission from their owners.
- The project only organizes and redirects to resources; it does not host the Drive content itself.
- The data should be checked regularly to remove broken links or unavailable resources.
- Shared resources should be verified before being added to the public website.

## Credits

Made with ❤️ by **Amr Slama**.

Special thanks to **El Mostahlek Yestahlek** and the community for sharing useful Bac resources.

## License

This project is shared for educational purposes.  
You can adapt it, improve it, and use it to help students, while respecting the ownership and access rights of the original resources.
