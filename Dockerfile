FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY ledger-web/package*.json ./
RUN npm install
COPY ledger-web/ ./
RUN npm run build

FROM php:8.2-apache AS backend-server
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libpq-dev \
    libicu-dev \
    && apt-get clean
RUN docker-php-ext-configure intl && \
    docker-php-ext-install pdo_pgsql mbstring exif pcntl bcmath gd zip intl
RUN a2enmod rewrite
WORKDIR /var/www/html
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
COPY . .
RUN cp -r ledger-backend*/* . || true
COPY --from=frontend-builder /app/frontend/dist/ledger-web/browser/* ./public/
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf
ENV COMPOSER_MEMORY_LIMIT=-1
RUN composer install --no-dev --optimize-autoloader --no-scripts --ignore-platform-reqs
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
EXPOSE 80
CMD bash -c "php artisan migrate --force && php artisan optimize:clear && apache2-foreground"