#!/bin/sh
# Clears migration rows that block `prisma migrate deploy` without being a real
# problem, so `npm run dev` works on every branch.
#
# Why this is needed: the dev database is shared across branches whose
# migration histories diverged when the init migration was renamed in
# "fix: clean migration history" (ee42a34). Checking out an older branch makes
# `migrate deploy` re-apply an init against a schema that already has those
# tables. That fails with 42P07 and leaves a failed row behind — and a single
# failed row blocks every later deploy, on every branch, until it is resolved.
#
# Three cases are safe to clear automatically:
#   - the same migration already has a successful row -> mark rolled back, the
#     stale failed row is the only thing in the way
#   - the migration is not part of this checkout at all -> mark rolled back,
#     deploy will not retry it (there is no folder to run)
#   - it is part of this checkout and failed because the objects already exist
#     -> mark applied, there is nothing left to do
#
# Anything else is a genuine failure and is reported instead of hidden.

set -e

MIGRATIONS_DIR="prisma/migrations"

DB_URL="${DATABASE_URL:-}"
if [ -z "$DB_URL" ] && [ -f .env ]; then
  DB_URL=$(grep -E '^DATABASE_URL=' .env | head -1 | cut -d= -f2- | tr -d '"'\''')
fi
if [ -z "$DB_URL" ]; then
  echo "[heal-migrations] DATABASE_URL not set, skipping"
  exit 0
fi

DB_USER=$(printf '%s' "$DB_URL" | sed -E 's|^[a-zA-Z]+://([^:@/]+).*|\1|')
DB_NAME=$(printf '%s' "$DB_URL" | sed -E 's|.*/([^/?]+)(\?.*)?$|\1|')

psql_q() {
  docker compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -At -c "$1" 2>/dev/null
}

# A fresh database has no _prisma_migrations table yet; nothing to heal.
STUCK=$(psql_q "select distinct migration_name from _prisma_migrations
                where finished_at is null and rolled_back_at is null;" || true)

[ -z "$STUCK" ] && exit 0

for name in $STUCK; do
  LOGS=$(psql_q "select coalesce(string_agg(coalesce(logs,''), ' '), '')
                 from _prisma_migrations
                 where migration_name = '$name' and finished_at is null;" || true)

  APPLIED=$(psql_q "select count(*) from _prisma_migrations
                    where migration_name = '$name' and finished_at is not null;" || echo 0)

  # 'resolve --applied' refuses a name that is already recorded as applied
  # (P3008), so a stale failed row next to a successful one gets rolled back.
  if [ "$APPLIED" != "0" ]; then
    echo "[heal-migrations] '$name' already has a successful run; clearing the stale failed row"
    npx prisma migrate resolve --rolled-back "$name" >/dev/null
    continue
  fi

  if [ ! -d "$MIGRATIONS_DIR/$name" ]; then
    echo "[heal-migrations] '$name' is not in this checkout (left by another branch) -> marking rolled back"
    npx prisma migrate resolve --rolled-back "$name" >/dev/null
    continue
  fi

  case "$LOGS" in
    *"already exists"*)
      echo "[heal-migrations] '$name' failed because its objects already exist -> marking applied"
      npx prisma migrate resolve --applied "$name" >/dev/null
      ;;
    *)
      echo ""
      echo "[heal-migrations] '$name' failed for a reason that is NOT safe to clear automatically:"
      echo "$LOGS" | head -20 | sed 's/^/    /'
      echo ""
      echo "  Fix the migration, then clear the row yourself:"
      echo "    npx prisma migrate resolve --rolled-back $name   # it did not apply"
      echo "    npx prisma migrate resolve --applied     $name   # the schema is already correct"
      exit 1
      ;;
  esac
done
