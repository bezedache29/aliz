---
name: git-flow
description: >
  Automatise le workflow git complet pour le projet aliz : analyse les changements en cours,
  propose un nom de branche et un message de commit conventionnel, demande validation à
  l'utilisateur, puis enchaîne création de branche, commit, push et PR vers dev.
  Déclencher dès que l'utilisateur dit "commit", "push", "fais une PR", "envoie le code",
  "crée une branche", "balance ça sur git", "on commit", "git flow" ou équivalent —
  sans attendre qu'il mentionne explicitement le skill.
---

# Git Flow

Workflow git interactif pour le projet aliz. Toujours proposer avant d'exécuter.

## Conventions

**Branches** — `<type>/<description-in-english-kebab-case>`

| Type           | Quand                                     |
| -------------- | ----------------------------------------- |
| `feature/`     | Nouvelle fonctionnalité                   |
| `fix/`         | Correction de bug                         |
| `chore/`       | Config, dépendances, tooling              |
| `refactoring/` | Refactorisation sans nouveau comportement |

La description après le `/` est **toujours en anglais**.

Exemples : `feature/login`, `fix/splash-screen-crash`, `chore/setup-husky`, `docs/readme`

**Commits** — Conventional Commits : `<type>: <description en français>`

| Type        | Quand                        |
| ----------- | ---------------------------- |
| `feat:`     | Nouvelle fonctionnalité      |
| `fix:`      | Correction de bug            |
| `chore:`    | Config, dépendances, tooling |
| `refactor:` | Refactorisation              |
| `docs:`     | Documentation                |
| `test:`     | Tests                        |

Exemples : `feat: mise en place de la connexion`, `chore: installation des dépendances`

## Étapes

### 1. Analyser les changements

Exécute `git status` et `git diff --stat` pour comprendre ce qui a changé.
Déduis le type (feature, fix, chore…) et le sujet principal du travail effectué.

Si la prochaine tâche identifiée est une **nouvelle feature ou un bugfix**, signaler proactivement :

> "Pour la prochaine feature, pense à lancer `/test-driven-development` avant d'écrire le moindre code — écrire les tests en premier évite de devoir les rattraper au moment du commit."

### 2. Security review

Lance le skill `security-review` sur les fichiers modifiés avant toute autre étape.

- Si des vulnérabilités **Critical** ou **High** sont détectées → signaler à l'utilisateur et stopper le workflow. Ne pas committer tant qu'elles ne sont pas corrigées.
- Si des points **Medium** ou **Needs verification** sont détectés → les présenter à l'utilisateur et lui demander s'il veut continuer malgré tout.
- Si aucune vulnérabilité → continuer directement à l'étape 3.

### 3. Tests (aliz-test)

Lance le skill `aliz-test` sur les fichiers modifiés (composants, hooks, atoms, mappers, models).

- Le skill génère ou met à jour les tests Jest + RNTL pour les fichiers concernés.
- Une fois les tests générés, le pre-push hook les exécute automatiquement via `jest --passWithNoTests --forceExit`.
- Si des tests échouent au push → corriger avant de continuer.
- Si aucun fichier testable n'a été modifié (config, styles, assets…) → passer directement à l'étape 4.

### 4. Proposer la branche et le commit

Propose les deux en une seule fois :

> "Je propose :
>
> - Branche : `feature/setup-mmkv-jotai`
> - Commit : `chore: installation et configuration des dépendances`
>
> Tu valides ou tu veux changer quelque chose ?"

Si l'utilisateur valide → passer à l'étape 5.
Si l'utilisateur donne son propre nom/message → utiliser exactement ce qu'il a fourni.

### 5. Exécuter

Une fois validé, enchaîner sans confirmation supplémentaire :

```bash
git checkout -b <branche>
git add .
git commit -m "<message>"
git push -u origin <branche>
gh pr create --base dev --title "<message>" --body "$(cat <<'EOF'
## Changements

- <bullet point par changement significatif>

EOF
)"
```

La description doit lister en bullets les changements principaux (fichiers modifiés, features ajoutées, corrections). Jamais de `--body ""`.

Afficher le lien de la PR à la fin.
