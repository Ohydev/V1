# OHY-API production image for Railway (or any single-container host).
#
# Runs php-fpm + nginx in one container, supervised by supervisord.
# `php artisan serve` is never used here — it's single-threaded and
# explicitly a local-dev-only tool (see learnings/deployment/deployment-roadmap.md).
FROM php:8.2-fpm

# System packages: nginx + supervisor to run both processes, gettext-base
# for envsubst (writes nginx's listen port from Railway's runtime $PORT
# env var at container start), git/unzip for composer, headers for the
# PHP extensions below.
RUN apt-get update && apt-get install -y --no-install-recommends \
        nginx \
        supervisor \
        gettext-base \
        git \
        unzip \
        libzip-dev \
        libonig-dev \
    && docker-php-ext-install pdo_mysql mbstring zip bcmath exif pcntl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Install PHP deps first so this layer is cached unless composer.* changes.
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-interaction --prefer-dist

# Now bring in the app code and finish the composer install (runs
# package:discover etc., which needs the actual app present).
COPY . .
RUN composer dump-autoload --optimize --no-dev \
    && mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/testing storage/framework/views storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

COPY docker/nginx.conf.template /etc/nginx/site.conf.template
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Railway injects $PORT at runtime and routes traffic to it — the actual
# EXPOSE value doesn't need to match, it's just documentation here.
EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
