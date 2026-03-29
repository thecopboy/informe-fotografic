FROM node:24-alpine

# Instal·lem Nginx i Supervisor (per mantenir vius els dos processos)
RUN apk add --no-cache nginx supervisor tzdata

# Configurem el fus horari d'Europa (opcional per tenir logs en hora local)
ENV TZ=Europe/Madrid
RUN cp /usr/share/zoneinfo/Europe/Madrid /etc/localtime && echo "Europe/Madrid" > /etc/timezone

WORKDIR /app

# Copiem fitxers de dependències primer (per aprofitar l'entxancament de caché docker)
COPY package*.json ./
RUN npm ci --omit=dev

# Configuració Nginx
COPY docker/nginx.conf /etc/nginx/http.d/default.conf

# Configuració Supervisor
COPY docker/supervisord.conf /etc/supervisord.conf

# Copiem codi de l'aplicació
COPY . .

# Creació de directoris necessaris (garantim que existeixen amb els permisos correctes al runtime)
RUN mkdir -p /app/database \
    && mkdir -p /app/public/uploads \
    && mkdir -p /app/logs \
    && chown -R node:node /app/database \
    && chown -R node:node /app/public/uploads \
    && chown -R node:node /app/logs

# Exposem el port del Nginx (el mestre infoto.cat apuntarà cap aquí)
EXPOSE 80

# Comanda d'inici via supervisord
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
