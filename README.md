# plateau-télé

Une watchlist de films et séries partagée. Cherchez un titre, ajoutez-le à la
liste avec une note, réordonnez par glisser-déposer, marquez-le comme vu.

Stack : [Bun](https://bun.sh) + [Hono](https://hono.dev) côté serveur,
PostgreSQL via [Drizzle](https://orm.drizzle.team), TypeScript vanilla et Web
Components côté client. Pas de bundler : le serveur transpile le TypeScript à
la volée.

Les données viennent de [TMDB](https://www.themoviedb.org). Il faut une clé
API (gratuite) : <https://www.themoviedb.org/settings/api>.

## Lancer en local

```sh
bun install
cp .env.example .env      # renseignez TMDB_API_KEY
docker compose up -d db   # une base PostgreSQL locale
bun run dev               # http://localhost:3000
bun test
```

## Lancer tout avec Docker

```sh
TMDB_API_KEY=xxx docker compose up --build
```

## Variables d'environnement

| Variable       | Requis | Défaut    | Rôle                              |
|----------------|--------|-----------|-----------------------------------|
| `TMDB_API_KEY` | oui    |           | Clé API TMDB                      |
| `DATABASE_URL` | oui    |           | URL PostgreSQL (fournie par le compose) |
| `PORT`         | non    | `3000`    | Port d'écoute                     |
| `HOST`         | non    | `0.0.0.0` | Interface d'écoute                |
| `LOCALE`       | non    | `fr`      | Langue de l'interface (`fr`/`en`) |

Sans `TMDB_API_KEY`, l'app démarre mais la recherche et les fiches répondent
503 avec un message explicite.

## Attention

Il n'y a **aucune authentification**. Toute personne qui connaît l'URL peut lire
et modifier la liste. À éviter dans la vraie vie.

## Licence

Domaine public ([Unlicense](https://unlicense.org)).

<!-- preview test -->
