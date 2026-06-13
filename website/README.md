# Bac Ressources

Site statique en français pour organiser des ressources utiles aux étudiants du baccalauréat.

## Pages

- `index.html` : page d'accueil
- `resources.html` : dossiers + fichiers avec recherche et filtres
- `websites.html` : sites web séparés
- `downloadAll.html` : téléchargement JSON/TXT généré automatiquement par JavaScript
- `collaborate.html` : formulaire de partage
- `about.html` : informations et contacts
- `404.html` : page d'erreur

## Données

Les seules données sources à modifier sont dans le dossier `data/` :

- `folders.json`
- `files.json`
- `websites.json`
- `last_modif_date/last_modif_date.json`

Les fichiers TXT ne sont plus stockés dans le projet. Ils sont créés automatiquement dans le navigateur quand l'utilisateur clique sur un bouton de téléchargement.

Le fichier `all_resources.json` n'est plus stocké non plus. Il est généré automatiquement à partir de `folders.json`, `files.json` et `websites.json` quand l'utilisateur clique sur "Télécharger JSON" dans le pack complet.

## Test local

Depuis le dossier du site :

```bash
python -m http.server 3000
```

Puis ouvre :

```txt
http://localhost:3000
```

Ne pas ouvrir `index.html` directement avec un double-clic, car le navigateur bloque souvent le chargement des fichiers JSON avec `file://`.

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

Ajoute les nouvelles ressources seulement dans :

- `data/folders.json` pour les dossiers Drive
- `data/files.json` pour les fichiers Drive
- `data/websites.json` pour les sites web

Puis change la date dans :

- `data/last_modif_date/last_modif_date.json`
