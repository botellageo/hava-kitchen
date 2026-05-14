#!/bin/bash
# =============================================================
# pms-midi5 — Pre-git check (Claude Code hook)
# =============================================================
# Intercepte les commandes Bash de Claude. Si c'est un git commit
# ou git push, applique les garde-fous solo dev :
#   - commit : typecheck strict + scan secrets
#   - push   : pas de force-push sur main
# =============================================================

ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
if [ -z "$ROOT" ]; then exit 0; fi
cd "$ROOT" || exit 0

CMD="${TOOL_INPUT:-}"
# Si TOOL_INPUT n'est pas une commande shell, on l'extrait du JSON
if echo "$CMD" | grep -q '"command"'; then
  CMD=$(echo "$CMD" | grep -oP '"command"\s*:\s*"\K[^"]+' | head -1)
fi

# ─────────────────────────────────────────────────────────────
# git commit
# ─────────────────────────────────────────────────────────────
if echo "$CMD" | grep -qE '(^|\s)git\s+commit'; then

  # 1. TypeScript strict — bloque si erreurs
  echo "▶ Typecheck (npx tsc -b --noEmit)..." >&2
  if ! npx tsc -b --noEmit 2>&1 | tee /tmp/pms-midi5-tsc.log; then
    echo "" >&2
    echo "❌ TypeScript errors — fix before commit" >&2
    echo "   Voir /tmp/pms-midi5-tsc.log" >&2
    echo "" >&2
    exit 2
  fi
  echo "  ✅ Typecheck OK" >&2

  # 2. Scan secrets sur fichiers stagés
  STAGED=$(git diff --cached --name-only --diff-filter=ACMR 2>/dev/null)
  if [ -z "$STAGED" ]; then
    echo "  ⚠️ Aucun fichier stagé — passe-droit OK" >&2
    exit 0
  fi

  # Patterns de secrets potentiels (regex strictes, faible faux positifs)
  # Note : AIzaSy[33 chars] est la clé Firebase Web PUBLIQUE — autorisée
  #        sauf si elle apparaît dans un fichier autre que .env*, src/lib/env.ts, ou la doc
  SECRET_HITS=""
  for f in $STAGED; do
    [ -f "$f" ] || continue
    # serviceAccountKey json
    if echo "$f" | grep -qE 'serviceAccountKey.*\.json|service-account.*\.json'; then
      SECRET_HITS="$SECRET_HITS\n  [BLOCK] $f — service account JSON détecté"
      continue
    fi
    # .env, .env.local (mais pas .env.example)
    if echo "$f" | grep -qE '(^|/)\.env(\.local|\.production|\.development)?$'; then
      SECRET_HITS="$SECRET_HITS\n  [BLOCK] $f — fichier .env (sauf .env.example)"
      continue
    fi
    # Contenu : private_key, sk_live_, sk-..., ghp_, glpat-, AKIA, BEGIN PRIVATE
    if grep -qE 'private_key|sk_live_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{30,}|glpat-[A-Za-z0-9_-]{20,}|AKIA[A-Z0-9]{16}|-----BEGIN.*PRIVATE.*KEY' "$f" 2>/dev/null; then
      HIT=$(grep -nE 'private_key|sk_live_|sk-[A-Za-z0-9]{20,}|ghp_|glpat-|AKIA[A-Z0-9]{16}|BEGIN.*PRIVATE' "$f" | head -3)
      SECRET_HITS="$SECRET_HITS\n  [BLOCK] $f — secret pattern détecté:\n$HIT"
    fi
    # AIzaSy hors fichiers env autorisés
    if echo "$f" | grep -qvE '(^|/)\.env|src/lib/env\.ts|\.md$|README'; then
      if grep -qE 'AIzaSy[A-Za-z0-9_-]{33}' "$f" 2>/dev/null; then
        HIT=$(grep -nE 'AIzaSy[A-Za-z0-9_-]{33}' "$f" | head -1)
        SECRET_HITS="$SECRET_HITS\n  [WARN] $f — clé apiKey Firebase en dehors de env.ts:\n$HIT"
      fi
    fi
  done

  if [ -n "$SECRET_HITS" ]; then
    # Si HIT contient [BLOCK] → exit 2 (bloquant)
    if echo -e "$SECRET_HITS" | grep -q '\[BLOCK\]'; then
      echo "" >&2
      echo "❌ Secrets potentiels détectés dans les fichiers stagés:" >&2
      echo -e "$SECRET_HITS" >&2
      echo "" >&2
      echo "💡 Si c'est un faux positif documenté : git commit --no-verify (à éviter)" >&2
      echo "" >&2
      exit 2
    else
      echo "" >&2
      echo "⚠️ Warnings secrets (non bloquant):" >&2
      echo -e "$SECRET_HITS" >&2
      echo "" >&2
    fi
  fi

  echo "  ✅ Scan secrets OK" >&2
  exit 0
fi

# ─────────────────────────────────────────────────────────────
# git push
# ─────────────────────────────────────────────────────────────
if echo "$CMD" | grep -qE '(^|\s)git\s+push'; then
  # Détection force-push sur main
  if echo "$CMD" | grep -qE '(--force|--force-with-lease|-f\b)' && echo "$CMD" | grep -qE '(\s|:)(main|origin/main)(\s|$)'; then
    echo "" >&2
    echo "❌ Force-push sur main BLOQUÉ." >&2
    echo "   Crée une branche feature : git checkout -b feat/ma-feature" >&2
    echo "" >&2
    exit 2
  fi
  exit 0
fi

# Toute autre commande Bash → laisser passer
exit 0
