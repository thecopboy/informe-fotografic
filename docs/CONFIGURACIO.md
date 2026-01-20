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

    // Configuració de la base de dades
    database: {
        path: process.env.DB_PATH || './database/app.db',
        timeout: 30000
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
            max: 5 // intents de login per finestra
        }
    }
};
```

## 🌍 Variables d'Entorn

### Fitxer `.env` (Desenvolupament)

```env
# Entorn
NODE_ENV=development
PORT=33333
HOST=localhost

# Base de dades
DB_PATH=./database/app.db

# JWT Secrets (CANVIA EN PRODUCCIÓ!)
JWT_ACCESS_SECRET=your-super-secret-access-key-here-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here-min-32-chars

# Webhook Secret (per al desplegament automàtic)
GITHUB_WEBHOOK_SECRET=your-github-webhook-secret-here

# Logging
LOG_LEVEL=DEBUG

# Monitoring
ALERT_EMAIL=admin@example.com
ALERT_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Opcionals
CORS_ORIGIN=http://localhost:33333
MAX_FILE_SIZE=20971520
```

### Fitxer `.env.production` (Producció)

```env
# Entorn
NODE_ENV=production
PORT=443
HOST=0.0.0.0

# Base de dades
DB_PATH=/var/lib/informe-fotografic/app.db

# JWT Secrets (OBLIGATORI CANVIAR!)
JWT_ACCESS_SECRET=your-production-access-secret-min-64-chars-very-secure
JWT_REFRESH_SECRET=your-production-refresh-secret-min-64-chars-very-secure

# Webhook Secret (per al desplegament automàtic)
GITHUB_WEBHOOK_SECRET=your-secure-production-github-webhook-secret

# Logging
LOG_LEVEL=INFO

# Monitoring
ALERT_EMAIL=admin@yourdomain.com
ALERT_WEBHOOK=https://hooks.slack.com/services/YOUR/PRODUCTION/WEBHOOK

# Producció
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
MAX_FILE_SIZE=52428800
```

## 🏗️ Configuració per Entorns

### Desenvolupament Local

```bash
# 1. Crear fitxer .env
cp .env.example .env

# 2. Configurar variables bàsiques
NODE_ENV=development
PORT=33333
JWT_ACCESS_SECRET=dev-secret-key-at-least-32-characters
JWT_REFRESH_SECRET=dev-refresh-key-at-least-32-characters

# 3. Inicialitzar base de dades
node database/init.js

# 4. Arrencar en mode desenvolupament
npm run dev
```

### Staging/Testing

```bash
# 1. Configurar variables d'entorn
export NODE_ENV=staging
export PORT=8080
export DB_PATH=/tmp/informe-fotografic-staging.db
export JWT_ACCESS_SECRET="staging-secret-key"
export JWT_REFRESH_SECRET="staging-refresh-key"

# 2. Inicialitzar base de dades
node database/init.js

# 3. Executar tests
npm test

# 4. Arrencar aplicació
npm start
```

### Producció

```bash
# 1. Configurar variables d'entorn del sistema
sudo tee /etc/environment <<EOF
NODE_ENV=production
PORT=443
DB_PATH=/var/lib/informe-fotografic/app.db
JWT_ACCESS_SECRET="your-very-secure-production-secret"
JWT_REFRESH_SECRET="your-very-secure-production-refresh"
LOG_LEVEL=INFO
EOF

# 2. Crear directori de dades
sudo mkdir -p /var/lib/informe-fotografic
sudo chown app:app /var/lib/informe-fotografic

# 3. Inicialitzar base de dades
sudo -u app node database/init.js

# 4. Configurar servei systemd
sudo tee /etc/systemd/system/informe-fotografic.service <<EOF
[Unit]
Description=Informe Fotogràfic
After=network.target

[Service]
Type=simple
User=app
WorkingDirectory=/opt/informe-fotografic
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# 5. Activar i arrencar servei
sudo systemctl enable informe-fotografic
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
    path: process.env.DB_PATH || './database/app.db',
    timeout: 30000,
    busyTimeout: 30000,
    pragma: {
        journal_mode: 'WAL',
        synchronous: 'NORMAL',
        cache_size: 1000,
        foreign_keys: true
    }
}
```

### Configuració per Producció

```javascript
database: {
    path: '/var/lib/informe-fotografic/app.db',
    timeout: 60000,
    busyTimeout: 60000,
    pragma: {
        journal_mode: 'WAL',
        synchronous: 'FULL',
        cache_size: 10000,
        foreign_keys: true,
        temp_store: 'memory'
    },
    backup: {
        enabled: true,
        interval: 6 * 60 * 60 * 1000, // 6 hores
        retention: 7, // 7 backups
        path: '/var/backups/informe-fotografic'
    }
}
```

## 🔄 Configuració de Backup

### Backup Automàtic

```bash
#!/bin/bash
# /usr/local/bin/backup-informe.sh

DB_PATH="/var/lib/informe-fotografic/app.db"
BACKUP_DIR="/var/backups/informe-fotografic"
DATE=$(date +%Y%m%d_%H%M%S)

# Crear directori de backup
mkdir -p $BACKUP_DIR

# Backup de la base de dades
sqlite3 $DB_PATH ".backup $BACKUP_DIR/app_$DATE.db"

# Comprimir backup
gzip "$BACKUP_DIR/app_$DATE.db"

# Mantenir només els últims 7 backups
find $BACKUP_DIR -name "app_*.db.gz" -mtime +7 -delete

echo "Backup completat: app_$DATE.db.gz"
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
if [ -f "$DB_PATH" ]; then
    echo "✅ Base de dades trobada: $DB_PATH"
else
    echo "❌ Base de dades no trobada: $DB_PATH"
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
    database: { path: './app.db' },
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
        path: '/var/lib/app/app.db',
        timeout: 60000,
        pragma: {
            journal_mode: 'WAL',
            synchronous: 'FULL'
        }
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