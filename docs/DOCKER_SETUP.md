# Configuració amb Docker i proxy-net

Aquesta aplicació està dissenyada per funcionar dins d'un contenidor Docker en xarxa integrada amb un Nginx mestre.

## 1. Arquitectura
- **Imatge**: Node.js 24 Alpine + Nginx + Supervisord.
- **Base de dades**: PostgreSQL 18 Alpine en un contenidor dedicat.
- **Xarxa**: Utilitza l'xarxa externa `proxy-net` per comunicar-se amb el Reverse Proxy mestre.
- **Port**: Exposa el port `80` internament a la xarxa Docker.

## 2. Requisits
- Docker i Docker Compose.
- Xarxa externa creada: `docker network create proxy-net`.

## 3. Desplegament (Scripts)
L'script `scripts/deploy.sh` automatitza tot el procés des de la màquina local cap al servidor. 

```bash
bash scripts/deploy.sh usuari@servidor.com
```

### Què fa l'script?
1. Build de la imatge Docker local.
2. Exportació a `.tar.gz`.
3. Transferència via SCP al servidor.
4. Carrega la imatge al servidor i aixeca els contenidors.
5. Assegura la persistència de la base de dades (volum Docker `postgres_data`).

## 4. Configuració del docker-compose.yml
El fitxer gestiona dos serveis: la base de dades PostgreSQL i l'aplicació:

```yaml
services:
  db:
    image: postgres:18-alpine
    container_name: informe-fotografic-db
    environment:
      POSTGRES_DB: informe_fotografic
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${PGPASSWORD:-changeme}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - internal
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d informe_fotografic"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    container_name: informe-fotografic
    expose:
      - "80"
    volumes:
      - ./public/uploads:/app/public/uploads
      - ./logs:/app/logs
    depends_on:
      db:
        condition: service_healthy
    networks:
      - internal
      - proxy-net

volumes:
  postgres_data:
```

## 5. Integració amb l'Nginx Mestre
Des de l'Nginx mestre del servidor (també en Docker), la configuració és directa mitjançant el nom del contenidor:

```nginx
location / {
    proxy_pass http://informe-fotografic:80;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## 6. Permisos i Logs
Els logs de l'aplicació es generen dins del contenidor a `/app/logs`. El Dockerfile assegura que l'usuari `node` té els permisos necessaris per escriure-hi.

## 7. Variables d'Entorn per Docker
Assegura't que el fitxer `.env` conté les credencials de PostgreSQL:

```env
PGPASSWORD=la-teva-contrasenya-segura
DATABASE_URL=postgresql://postgres:la-teva-contrasenya-segura@db:5432/informe_fotografic
```

> **Nota**: Dins de Docker Compose, el host de la base de dades és `db` (el nom del servei), no `localhost`.
