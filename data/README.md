# Sources des données

Le fichier `src/data/catalogue.json` est généré par `scripts/build-catalogue.py`.
Chaque entrée provient d'une table Lua publiée par une ressource réelle : **aucune
animation n'est inventée ou complétée à la main**.

## Ressources utilisées

| Ressource | Fichier source | Rôle |
| --- | --- | --- |
| [alberttheprince/rpemotes-reborn](https://github.com/alberttheprince/rpemotes-reborn) | `client/AnimationList.lua` | emotes, props, animaux, danses, démarches, expressions, duos |
| [Scullyy/scully_emotemenu](https://github.com/Scullyy/scully_emotemenu) | `shared/data/emotes/*.lua` | emotes, props, consommables, animaux, duos, expressions, démarches |

Les versions sont épinglées dans `scripts/build-catalogue.py` :

- rpemotes-reborn : `d3553c1985b03ee0bf290592a8378fa20cfeeaed`
- scully_emotemenu : `494cd18b8a381ff12fc603a0aae8a3968667177a`

## Régénérer le catalogue

```bash
npm run data              # réutilise le cache data/raw/
npm run data -- --refresh # force le téléchargement des sources
```

Le script télécharge les fichiers dans `data/raw/` (non versionné), puis écrit
`src/data/catalogue.json`.

## Contenu généré

1 864 emotes uniques, dédupliqués par commande :

| Type | Entrées |
| --- | ---: |
| animation | 788 |
| prop | 660 |
| walk | 127 |
| animal | 118 |
| synchronized | 94 |
| scenario | 39 |
| expression | 38 |

| Catégorie | Entrées |
| --- | ---: |
| Général | 318 |
| Objets | 222 |
| Boire & manger | 147 |
| Démarches | 127 |
| Danses | 126 |
| Animaux | 118 |
| Assis & repos | 109 |
| Téléphone & tech | 105 |
| Duo & synchronisé | 94 |
| Gestes | 93 |
| Sport & fitness | 90 |
| Métiers & atelier | 62 |
| Émotions | 54 |
| Police & secours | 43 |
| Musique | 42 |
| Expressions | 38 |
| Salutations | 35 |
| Fumer | 28 |
| Scénarios | 13 |

## Champs

| Champ | Description |
| --- | --- |
| `id` | identifiant stable dérivé de la commande |
| `label` | libellé fourni par la ressource |
| `command` | commande chat sans slash |
| `category` | catégorie éditoriale calculée par mots-clés |
| `kind` | `animation`, `prop`, `walk`, `animal`, `synchronized`, `scenario`, `expression` |
| `dict` / `anim` | dictionnaire et clip d'animation |
| `prop` | nom du prop attaché |
| `scenario` | scénario natif GTA V |
| `expression` | mood / expression faciale |
| `walk` | clipset de démarche |
| `other` | commande du partenaire pour un duo |
| `sources` | `rpemotes`, `scully` ou les deux |

Les croquis affichés dans l'interface sont des **illustrations éditoriales**
générées à partir du libellé, de la catégorie et du type de l'emote. Ce ne sont
pas des captures du jeu : seul le contenu du catalogue (commandes, dictionnaires,
props, scénarios) est factuel.
