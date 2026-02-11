# --- STAGE 1: Build the Angular Frontend ---
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy frontend dependency files
COPY ledger-web/package*.json ./
RUN npm install

# Copy frontend source and build
COPY ledger-web/ ./
RUN npm run build -- --configuration production

# --- STAGE 2: Setup the PHP/Laravel Backend ---
FROM php:8.2-apache AS backend-server

# Install system dependencies for PHP and PostgreSQL
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

# Configure and install PHP extensions
RUN docker-php-ext-configure intl && \
    docker-php-ext-install pdo_pgsql mbstring exif pcntl bcmath gd zip intl

# Enable Apache mod_rewrite for Laravel
RUN a2enmod rewrite

WORKDIR /var/www/html

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy the entire project
COPY . .

# Move backend files to the root of /var/www/html
# (Adjust this if your folder name is different)
RUN cp -r ledger-backend*/* . || true

# 🚀 THE MAGIC STEP: 
# Copy the built Angular files from Stage 1 into the Laravel public folder
# Note: Check if your Angular output folder is 'dist/ledger-web/browser' or just 'dist'
COPY --from=frontend-builder /app/frontend/dist/ledger-web/browser/* ./public/

# Set Apache Document Root to Laravel's public folder
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf

# Install Laravel dependencies
ENV COMPOSER_MEMORY_LIMIT=-1
RUN composer install --no-dev --optimize-autoloader --no-scripts --ignore-platform-reqs

# Fix permissions
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 80

# Run migrations and start Apache
CMD bash -c "php artisan migrate --force && php artisan optimize:clear && apache2-foreground"