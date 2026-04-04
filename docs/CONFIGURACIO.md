# ⚙️ Guia de Configuració - Informe Fotogràfic

## 📋 Visió General

Aquest document explica com configurar l'aplicació **Informe Fotogràfic** per a diferents entorns i necessitats. Tota la configuració està centralitzada per facilitar la gestió i manteniment.

## 🔧 Configuració Principal

### Fitxer de Configuració: `config/config.js`

```javascript
export const config = {
    // Configuració del servidor
    server: {
        port: process.env.PORT || 33333,
        host: process.env.HOST || 'localhost',
        environment: process.env.NODE_ENV || 'development'
    },

    // Configuració de la base de dades PostgreSQL
    database: {
        url: process.env.DATABASE_URL || null,
        host: process.env.PGHOST || 'localhost',
        port: parseInt(process.env.PGPORT || '5432', 10),
        name: process.env.PGDATABASE || 'informe_fotografic',
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || '',
        poolMax: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 30000
    },

    // Configuració JWT
    jwt: {
        accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'your-access-secret-key',
        refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
        accessTokenExpiry: '15m',
        refreshTokenExpiry: '7d'
    },

    // Configuració de seguretat
    security: {
        bcryptRounds: 10,
        passwordMinLength: 8,
        maxLoginAttempts: 5
    },
    
    // Configuració de fitxers (CENTRALITZADA)
    files: {
        default: { 
            maxSize: 20 * 1024 * 1024, // 20MB
            allowedTypes: ['image/jpeg', 'image/png'] 
        },
        images: { 
            maxSize: 20 * 1024 * 1024, // 20MB
            allowedTypes: ['image/jpeg', 'image/png'],
            quality: { 
                default: 0.8, 
                high: 0.9, 
                low: 0.6, 
                thumbnail: 0.7 
            },
            dimensions: { 
                maxWidth: 1920, 
                maxHeight: 1080, 
                thumbnail: 150, 
                preview: 800 
            },
            compression: { 
                enabled: true, 
                autoResize: true, 
                maintainAspectRatio: true 
            }
        },
        documents: { 
            maxSize: 100 * 1024 * 1024, // 100MB
            allowedTypes: ['application/json', 'text/plain'] 
        },
        profiles: { 
            maxSize: 5 * 1024 * 1024, // 5MB
            allowedTypes: ['image/jpeg', 'image/png'],
            quality: { 
                default: 0.75, 
                high: 0.9, 
                thumbnail: 0.6 
            },
            dimensions: { 
                maxWidth: 800, 
                maxHeight: 800, 
                thumbnail: 100 
            }
        },
        logs: { 
            maxFileSize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5, 
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 dies
        }
    },
    
    // Configuració de validació
    validation: {
        password: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true
        },
        email: {
            maxLength: 254,
            allowedDomains: [] // Buit = tots els dominis
        },
        reports: {
            maxPhotos: 50,
            maxTitleLength: 200,
            maxDescriptionLength: 1000
        }
    },
    
    // Configuració de monitoring
    monitoring: {
        enabled: true,
        thresholds: {
            responseTime: 1000, // ms
            memoryUsage: 80, // %
            errorRate: 5 // %
        },
        alerts: {
            email: process.env.ALERT_EMAIL || null,
            webhook: process.env.ALERT_WEBHOOK || null
        }
    },

    // Configuració de CORS
    cors: {
        development: [
            'http://localhost:33333',
            'http://127.0.0.1:33333',
            'http://187.33.157.180:33333'
        ],
        production: [
            'https://yourdomain.com',
            'https://www.yourdomain.com'
        ]
    },

    // Configuració de rate limiting
    rateLimit: {
        general: {
            windowMs: 1 * 60 * 1000, // 1 minut
            max: 100 // peticions per finestra
        },
        auth: {
            windowMs: 15 * 60 * 1000, // 15 minuts
            max: 5 // intents de login per fine## 🌍 Variables d'Entorn (Docker)

Tota la configuració en el sistema actual es gestiona mitjançant el fitxer `.env` i es carrega automàticament pel contenidor Docker.

### Fitxer `.env`

```env
# Entorn
NODE_ENV=production
PORT=33333
HOST=localhost

# Base de dades PostgreSQL
DATABASE_URL=postgresql://postgres:password@localhost:5432/informe_fotografic
PGHOST=localhost
PGPORT=5432
PGDATABASE=informe_fotografic
PGUSER=postgres
PGPASSWORD=password

# JWT Secrets (OBLIGATORI CANVIAR!)
# Generar amb: openssl rand -base64 48
JWT_ACCESS_SECRET=your-production-access-secret-min-64-chars-very-secure
JWT_REFRESH_SECRET=your-production-refresh-secret-min-64-chars-very-secure

# Logging
LOG_LEVEL=INFO

# Monitoring
ALERT_EMAIL=admin@yourdomain.com
ALERT_WEBHOOK=https://hooks.slack.com/services/YOUR/PRODUCTION/WEBHOOK
```

## 🏗️ Configuració per Entorns

### Desenvolupament Local (Sense Docker)
Si vols executar l'aplicació per fer proves ràpides sense docker:

```bash
# 1. Crear fitxer .env
cp .env.example .env

# 2. Instal·lar dependències
npm install

# 3. Arrencar
npm start
```

### Producció (Docker + proxy-net)
L'aplicació es desplega com un contenidor en la xarxa `proxy-net`. 

1. **Configurar secrets**: Crea el `.env` localment.
2. **Deploy**: Executa `bash scripts/deploy.sh usuari@servidor.com`.
3. **Persistència**: La base de dades es guarda al volum Docker `postgres_data` i les imatges a `./public/uploads`.

## 🔐 Seguretat i Secrets

### Generar Secrets Segurs
Utilitza `openssl` per generar claus aleatòries de 48 caràcters:
```bash
openssl rand -base64 48
```

### Checklist de Seguretat
- [ ] Secrets de producció DIFERENTS dels de desenvolupament.
- [ ] Fitxer `.env` al `.gitignore`.
- [ ] Permisos 600 pel fitxer `.env` al servidor (`chmod 600 .env`).
- [ ] Rotació de secrets cada 3-6 mesos.

### Què fer si s'exposa un secret
1. Genera nous secrets al `.env`.
2. Reinicia el contenidor: `docker compose restart`.
3. Invalida tokens antics:
```bash
psql $DATABASE_URL -c "DELETE FROM revoked_tokens;"
```
fic
sudo systemctl start informe-fotografic
```

## 📁 Configuració de Fitxers

### Personalitzar Mides Màximes

```javascript
// Modificar config/config.js
files: {
    images: {
        maxSize: 50 * 1024 * 1024, // 50MB
        dimensions: {
            maxWidth: 4000,
            maxHeight: 3000
        }
    },
    documents: {
        maxSize: 200 * 1024 * 1024 // 200MB
    }
}
```

### Configurar Qualitat d'Imatges

```javascript
// Per a millor qualitat (fitxers més grans)
files: {
    images: {
        quality: {
            default: 0.9,
            high: 0.95,
            thumbnail: 0.8
    }
}
}

// Per a menor mida (qualitat reduïda)
files: {
    images: {
        quality: {
            default: 0.6,
            high: 0.8,
            thumbnail: 0.5
        }
    }
}
```

### Configurar Tipus de Fitxers Permesos

```javascript
files: {
    images: {
        allowedTypes: [
            'image/jpeg',
            'image/png',
            'image/webp', // Afegir WebP
            'image/gif'   // Afegir GIF
        ]
    }
}
```

## 🔐 Configuració de Seguretat

### Generar Secrets JWT Segurs

```bash
# Generar secrets de 64 caràcters
openssl rand -base64 64

# O amb Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### Configurar Política de Contrasenyes

```javascript
validation: {
    password: {
        minLength: 12,              // Mínim 12 caràcters
        requireUppercase: true,     // Almenys una majúscula
        requireLowercase: true,     // Almenys una minúscula
        requireNumbers: true,       // Almenys un número
        requireSpecialChars: true,  // Almenys un caràcter especial
        maxLength: 128,             // Màxim 128 caràcters
        blacklistedWords: [         // Paraules prohibides
            'password',
            'admin',
            'user'
        ]
    }
}
```

### Configurar Rate Limiting

```javascript
rateLimit: {
    general: {
        windowMs: 15 * 60 * 1000, // 15 minuts
        max: 200,                 // 200 peticions per IP
        message: 'Massa peticions, torna-ho a provar més tard'
    },
    auth: {
        windowMs: 60 * 60 * 1000, // 1 hora
        max: 10,                  // 10 intents de login per IP
        skipSuccessfulRequests: true
    },
    api: {
        windowMs: 1 * 60 * 1000,  // 1 minut
        max: 60,                  // 60 peticions API per minut
        keyGenerator: (req) => req.user?.id || req.ip
    }
}
```

## 📊 Configuració de Monitoring

### Configurar Alertes

```javascript
monitoring: {
    enabled: true,
    thresholds: {
        responseTime: 2000,    // 2 segons
        memoryUsage: 85,       // 85% de memòria
        errorRate: 10,         // 10% d'errors
        diskSpace: 90          // 90% d'espai en disc
    },
    alerts: {
        email: {
            enabled: true,
            smtp: {
                host: 'smtp.gmail.com',
                port: 587,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            },
            recipients: ['admin@example.com']
        },
        webhook: {
            enabled: true,
            url: process.env.WEBHOOK_URL,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }
    }
}
```

### Configurar Logs

```javascript
logging: {
    level: process.env.LOG_LEVEL || 'INFO',
    file: {
        enabled: true,
        path: './logs',
        maxSize: 10 * 1024 * 1024, // 10MB
        maxFiles: 10,
        rotationInterval: '1d'
    },
    console: {
        enabled: process.env.NODE_ENV !== 'production',
        colorize: true,
        timestamp: true
    },
    database: {
        enabled: true,
        table: 'application_logs',
        maxEntries: 10000
    }
}
```

## 🌐 Configuració de CORS

### Configuració Bàsica

```javascript
cors: {
    origin: function (origin, callback) {
        const allowedOrigins = config.cors[config.server.environment];

        // Permetre requests sense origin (apps mòbils, Postman)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('No permès per CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}
```

### Configuració Avançada

```javascript
cors: {
    origin: [
        'https://app.example.com',
        'https://admin.example.com',
        /^https:\/\/.*\.example\.com$/ // Subdominis
    ],
    credentials: true,
    optionsSuccessStatus: 200,
    preflightContinue: false
}
```

## 🗄️ Configuració de Base de Dades

### Configuració Bàsica

```javascript
database: {
    url: process.env.DATABASE_URL || null,
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    name: process.env.PGDATABASE || 'informe_fotografic',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '',
    poolMax: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 30000
}
```

### Configuració per Producció

```javascript
database: {
    url: process.env.DATABASE_URL,
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT, 10),
    name: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    poolMax: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 30000
}
```

## 🔄 Configuració de Backup

### Backup Automàtic de PostgreSQL

```bash
#!/bin/bash
# /usr/local/bin/backup-informe.sh

BACKUP_DIR="/var/backups/informe-fotografic"
DATE=$(date +%Y%m%d_%H%M%S)

# Crear directori de backup
mkdir -p $BACKUP_DIR

# Backup de la base de dades PostgreSQL
pg_dump $DATABASE_URL > "$BACKUP_DIR/app_$DATE.sql"

# Comprimir backup
gzip "$BACKUP_DIR/app_$DATE.sql"

# Mantenir només els últims 7 backups
find $BACKUP_DIR -name "app_*.sql.gz" -mtime +7 -delete

echo "Backup completat: app_$DATE.sql.gz"
```

### Cron Job per Backup

```bash
# Afegir a crontab
crontab -e

# Backup cada 6 hores
0 */6 * * * /usr/local/bin/backup-informe.sh >> /var/log/backup-informe.log 2>&1
```

## 🔧 Configuració de Desenvolupament

### Configuració de Hot Reload

```json
{
  "scripts": {
    "dev": "node --watch index.js",
    "dev:debug": "node --inspect --watch index.js",
    "dev:verbose": "LOG_LEVEL=DEBUG node --watch index.js"
  }
}
```

### Configuració de Testing

```javascript
// jest.config.js
export default {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
    collectCoverageFrom: [
        'public/js/**/*.js',
        '!public/js/fonts/**',
        '!public/js/components/**'
    ],
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
        }
    }
};
```

## 🚨 Resolució de Problemes

### Problemes Comuns

#### 1. Error de permisos de base de dades
```bash
# Solució
sudo chown -R app:app /var/lib/informe-fotografic
sudo chmod 755 /var/lib/informe-fotografic
sudo chmod 644 /var/lib/informe-fotografic/app.db
```

#### 2. Error de mida de fitxer
```javascript
// Augmentar límit en config/config.js
files: {
    images: {
        maxSize: 50 * 1024 * 1024 // 50MB
    }
}
```

#### 3. Error de CORS
```javascript
// Afegir origen a la configuració
cors: {
    development: [
        'http://localhost:33333',
        'http://your-new-domain.com'
    ]
}
```

#### 4. Error de JWT
```bash
# Regenerar secrets
export JWT_ACCESS_SECRET=$(openssl rand -base64 64)
export JWT_REFRESH_SECRET=$(openssl rand -base64 64)
```

### Verificació de Configuració

```bash
# Script de verificació
#!/bin/bash
echo "Verificant configuració..."

# Verificar variables d'entorn
if [ -z "$JWT_ACCESS_SECRET" ]; then
    echo "❌ JWT_ACCESS_SECRET no definit"
else
    echo "✅ JWT_ACCESS_SECRET definit"
fi

# Verificar base de dades
if psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
    echo "✅ Connexió a PostgreSQL correcta"
else
    echo "❌ No es pot connectar a PostgreSQL"
fi

# Verificar port
if netstat -tuln | grep -q ":$PORT "; then
    echo "❌ Port $PORT ja en ús"
else
    echo "✅ Port $PORT disponible"
fi

echo "Verificació completada"
```

## 📚 Exemples de Configuració

### Configuració Mínima (Desenvolupament)

```javascript
export const config = {
    server: { port: 3000 },
    database: {
        url: 'postgresql://postgres:password@localhost:5432/informe_fotografic'
    },
    jwt: {
        accessTokenSecret: 'dev-secret',
        refreshTokenSecret: 'dev-refresh'
        }
};
```

### Configuració Completa (Producció)

```javascript
export const config = {
    server: {
        port: 443,
        host: '0.0.0.0',
        environment: 'production'
    },
    database: {
        url: process.env.DATABASE_URL,
        host: process.env.PGHOST,
        port: parseInt(process.env.PGPORT, 10),
        name: process.env.PGDATABASE,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        poolMax: 20
    },
    jwt: {
        accessTokenSecret: process.env.JWT_ACCESS_SECRET,
        refreshTokenSecret: process.env.JWT_REFRESH_SECRET,
        accessTokenExpiry: '15m',
        refreshTokenExpiry: '7d'
    },
    security: {
        bcryptRounds: 12,
        maxLoginAttempts: 3
    },
monitoring: {
        enabled: true,
        thresholds: {
            responseTime: 1000,
            memoryUsage: 80,
            errorRate: 5
        }
    }
};
```

---

*Documentació de configuració actualitzada: Juliol 2025* 