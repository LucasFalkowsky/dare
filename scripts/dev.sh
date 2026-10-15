#!/bin/sh
cleanup() {
  echo ""
  echo "Stopping all processes..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  docker compose stop
  exit 0
}
trap cleanup INT TERM

docker compose up -d --wait postgres

# Clear migration rows left behind by another branch's history before deploying.
sh scripts/heal-migrations.sh || exit 1

if ! npx prisma migrate deploy; then
  echo ""
  echo "Migrations could not be applied — not starting the backend, it would run"
  echo "against an unexpected schema. See the Prisma output above."
  exit 1
fi

npx nodemon --exec "node -r dotenv/config -r reflect-metadata -r ts-node/register src/index.ts" --ext ts &
BACKEND_PID=$!

npm run dev:frontend &
FRONTEND_PID=$!

wait $BACKEND_PID $FRONTEND_PID
