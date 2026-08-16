#!/usr/bin/env bash
# Release locale: bump semver dai Conventional Commits, CHANGELOG rigenerato,
# commit e tag. NESSUN push: il push (branch e tag) è sempre gate umano.
# Flusso: pnpm release:preview -> review umana -> pnpm release -> push manuale.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

VERSION="$(pnpm exec git-cliff --bumped-version)" # es. v0.2.0
pnpm exec git-cliff --bump -o CHANGELOG.md
npm pkg set version="${VERSION#v}"

git add CHANGELOG.md package.json
git commit -m "chore(release): ${VERSION#v}"
git tag "$VERSION"

echo "Creato tag locale $VERSION — push SOLO manuale: git push origin main --tags"
