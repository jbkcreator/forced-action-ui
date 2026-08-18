#!/bin/bash
# Frontend deploy script with rollback on failure.
# Keeps build state safe — if anything fails, rolls back to last known good commit.
set -euo pipefail

PROJECT_DIR="/root/Forced-action-ui"
DEPLOY_LOG="$PROJECT_DIR/.deploy-history.log"

cd "$PROJECT_DIR"

fail() {
    echo "" >&2
    echo "DEPLOY ABORTED — step failed: $1" >&2
    echo "Rolling back to previous commit..." >&2
    git reset --hard "$BEFORE" || true
    echo "$BEFORE FAILED — $1" >> "$DEPLOY_LOG"
    exit 1
}

echo "== 0/5 save current state =="
BEFORE=$(git rev-parse HEAD)
echo "Current commit: $BEFORE"

echo "== 1/5 checkout main =="
git checkout main || fail "git checkout main"

echo "== 2/5 pull latest =="
git pull origin main || fail "git pull origin main"
AFTER=$(git rev-parse HEAD)

if [ "$BEFORE" = "$AFTER" ]; then
    echo "No new commits — build skipped"
    exit 0
fi

echo "New commit: $AFTER"

echo "== 3/5 install deps =="
npm install || fail "npm install"

echo "== 4/5 build =="
npm run build || fail "npm run build"

echo "== 5/5 verify build output =="
[ -d "dist" ] || fail "build output not found (dist/ missing)"

DEPLOY_TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo ""
echo "================ DEPLOY RECEIPT ================"
echo "Previous:     $BEFORE"
echo "Current:      $AFTER"
echo "Built:        $DEPLOY_TS"
echo "Build dir:    dist (nginx auto-serves)"
echo "Status:       SUCCESS ✓"
echo "=================================================="

echo "$AFTER SUCCESS — $DEPLOY_TS" >> "$DEPLOY_LOG"