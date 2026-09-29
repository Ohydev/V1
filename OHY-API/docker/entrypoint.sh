#!/bin/sh
set -e

echo "==> OHY-API entrypoint starting"

# APP_KEY must be a stable value set once as a Railway variable, never
# generated here — generating it on every deploy would invalidate every
# existing session/cookie/encrypted value on each redeploy.
if [ -z "$APP_KEY" ]; then
    echo "FATAL: APP_KEY is not set. Generate one locally with" >&2
    echo "  php artisan key:generate --show" >&2
    echo "and set it as a Railway variable (do this once, not per deploy)." >&2
    exit 1
fi

# Railway assigns $PORT dynamically — write it into the nginx site config.
export PORT="${PORT:-8080}"
envsubst '${PORT}' < /etc/nginx/site.conf.template > /etc/nginx/sites-enabled/default
echo "==> nginx listening on port $PORT"

cd /var/www/html

# Real symlink (public/storage -> storage/app/public) — this is the
# standard Laravel setup and what a real server (unlike `artisan serve`,
# which 403s on symlinked files) is expected to run. Idempotent: skip if
# it already exists, e.g. from a prior boot of the same container.
if [ ! -L public/storage ]; then
    php artisan storage:link
fi

# Run migrations, retrying on failure — Railway's MySQL plugin is usually
# already up by the time this container starts, but don't assume perfect
# startup ordering.
echo "==> running migrations"
attempt=0
until php artisan migrate --force; do
    attempt=$((attempt + 1))
    if [ "$attempt" -ge 15 ]; then
        echo "FATAL: migrations still failing after $attempt attempts (likely can't reach the database)" >&2
        exit 1
    fi
    echo "    migration failed (attempt $attempt/15), retrying in 3s..."
    sleep 3
done

echo "==> caching config/routes/views"
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Railway volumes mount owned by root, and caching above ran as root —
# hand storage back to php-fpm's user (www-data) or uploads and compiled
# views fail with "permission denied".
chown -R www-data:www-data storage bootstrap/cache

echo "==> starting php-fpm + nginx"
exec supervisord -c /etc/supervisor/conf.d/supervisord.conf
