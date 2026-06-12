# Bac Ressources

Site statique en français pour organiser des ressources utiles aux étudiants du baccalauréat.

## Pages

- `index.html` : page d'accueil
- `resources.html` : dossiers + fichiers avec recherche et filtres
- `websites.html` : sites web séparés
- `downloadAll.html` : téléchargement JSON/TXT
- `collaborate.html` : formulaire de partage
- `about.html` : informations et contacts
- `404.html` : page d'erreur

## Données

Les données sont dans le dossier `data/`.

- `folders.json` / `folders.txt`
- `files.json` / `files.txt`
- `websites.json` / `websites.txt`
- `all_resources.json` / `all_resources.txt`

## Déploiement Netlify

Méthode simple :

1. Ouvre Netlify.
2. Va dans **Add new site**.
3. Choisis **Deploy manually**.
4. Glisse-dépose le dossier du site ou le fichier ZIP décompressé.
5. Le site est en ligne.

Méthode GitHub :

1. Mets le dossier dans un repository GitHub.
2. Sur Netlify, choisis **Import from Git**.
3. Build command : vide.
4. Publish directory : `.`
5. Deploy.

## Mise à jour des ressources

Remplace les fichiers JSON dans `data/`, puis mets aussi à jour les fichiers TXT si nécessaire.
