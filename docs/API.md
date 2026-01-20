# 📖 Documentació de l'API - Informe Fotogràfic

## 🔗 URL Base
```
http://localhost:33333/api
```

## 🔐 Autenticació

L'API utilitza **JWT (JSON Web Tokens)** per a l'autenticació. Després del login, rebràs un `accessToken` que hauràs d'incloure en les capçaleres de les peticions autenticades.

### Format de Capçalera
```
Authorization: Bearer <access_token>
```

### Tokens
- **Access Token**: Vàlid per 15 minuts
- **Refresh Token**: Vàlid per 7 dies

---

## 🔑 Endpoints d'Autenticació

### POST /auth/register
Registra un nou usuari al sistema.

**Petició:**
```http
POST /api/auth/register
Content-Type: application/json

{
    "email": "usuari@exemple.com",
    "password": "contrasenya123",
    "name": "Nom Usuari"
}
```

**Validacions:**
- Email vàlid obligatori
- Contrasenya mínima 8 caràcters
- Nom mínim 2 caràcters

**Resposta Exitosa (201):**
```json
{
    "message": "Usuari registrat correctament",
    "user": {
        "id": 1,
        "email": "usuari@exemple.com",
        "name": "Nom Usuari",
        "role": "user"
    }
}
```

**Errors Possibles:**
- `400` - Dades de validació incorrectes
- `409` - Email ja existeix

---

### POST /auth/login
Inicia sessió d'un usuari existent.

**Petició:**
```http
POST /api/auth/login
Content-Type: application/json

{
    "email": "usuari@exemple.com",
    "password": "contrasenya123"
}
```

**Resposta Exitosa (200):**
```json
{
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": 1,
        "email": "usuari@exemple.com",
        "name": "Nom Usuari",
        "role": "user",
        "created_at": "2025-07-14T00:00:00.000Z"
    }
}
```

**Errors Possibles:**
- `400` - Falten camps obligatoris
- `401` - Credencials incorrectes
- `403` - Usuari desactivat

---

### POST /auth/logout
Tanca la sessió de l'usuari autenticat.

**Petició:**
```http
POST /api/auth/logout
Authorization: Bearer <access_token>
```

**Resposta Exitosa (200):**
```json
{
    "message": "Logout correcte",
    "success": true
}
```

---

### GET /auth/me
Obté les dades de l'usuari autenticat.

**Petició:**
```http
GET /api/auth/me
Authorization: Bearer <access_token>
```

**Resposta Exitosa (200):**
```json
{
    "id": 1,
    "email": "usuari@exemple.com",
    "name": "Nom Usuari",
    "role": "user"
}
```

---

## 👤 Endpoints de Perfil d'Usuari

### GET /user/profile
Obté el perfil complet de l'usuari autenticat.

**Petició:**
```http
GET /api/user/profile
Authorization: Bearer <access_token>
```

**Resposta Exitosa (200):**
```json
{
        "id": 1,
        "email": "usuari@exemple.com",
        "name": "Nom Usuari",
        "role": "user",
        "created_at": "2025-07-14T00:00:00.000Z",
    "signants": "Agent 1, Agent 2",
    "shield": "data:image/png;base64,iVBOR...",
    "backgroundImage": "data:image/jpeg;base64,iVBOR..."
}
```

---

### PUT /user/profile
Actualitza el perfil de l'usuari autenticat.

**Petició:**
```http
PUT /api/user/profile
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "name": "Nou Nom",
    "currentPassword": "contrasenya_actual",
    "newPassword": "nova_contrasenya",
    "signants": "Agent 1, Agent 2, Agent 3",
    "shield": "data:image/png;base64,iVBOR..."
}
```

**Camps Opcionals:**
- `name` - Nou nom d'usuari
- `currentPassword` + `newPassword` - Canvi de contrasenya
- `signants` - Signants per defecte
- `shield` - Escut en format Base64
- `backgroundImage` - Imatge de fons en format Base64

**Resposta Exitosa (200):**
```json
{
    "message": "Perfil actualitzat correctament",
    "user": {
        "id": 1,
        "email": "usuari@exemple.com",
        "name": "Nou Nom",
        "role": "user",
        "created_at": "2025-07-14T00:00:00.000Z"
    }
}
```

**Errors Possibles:**
- `400` - Contrasenya actual incorrecta
- `400` - Nova contrasenya dèbil

---

## 📄 Endpoints d'Informes

### GET /reports
Llista tots els informes de l'usuari autenticat.

**Petició:**
```http
GET /api/reports
Authorization: Bearer <access_token>
```

**Resposta Exitosa (200):**
```json
{
    "reports": [
        {
            "id": 1,
            "title": "Informe Fotogràfic - 15/01/2024",
            "report_data": {
                "general": {
                    "tipus": "Accident",
                    "numero": "2024/001",
                    "assumpte": "Accident de trànsit",
                    "adreca": "Carrer Major, 123",
                    "data": "2024-01-15"
                }
            },
            "created_at": "2024-01-15T14:30:00.000Z",
            "updated_at": "2024-01-15T14:30:00.000Z"
        }
    ]
}
```

**Nota**: Aquest endpoint està optimitzat per al llistat i només retorna les dades bàsiques necessàries. Per obtenir l'informe complet amb fotos, utilitza `GET /reports/:id`.

---

### POST /reports
Crea un nou informe.

**Petició:**
```http
POST /api/reports
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "title": "Informe Fotogràfic - 15/01/2024",
    "report_data": {
        "general": {
            "tipus": "Accident",
            "numero": "2024/001",
            "data": "2024-01-15",
            "hora": "14:30",
            "adreca": "Carrer Major, 123",
            "assumpte": "Accident de trànsit",
            "signants": "Agent 1, Agent 2",
            "escut": "data:image/png;base64,iVBOR..."
        },
        "photos": [
            {
                "id": 1,
                "titol": "Vista general",
                "descripcio": "Vista general de l'accident",
                "imageUrl": "data:image/jpeg;base64,/9j/4AAQ...",
                "isActive": true
            }
        ]
    }
}
```

**Resposta Exitosa (201):**
```json
{
    "message": "Informe creat correctament",
    "report": {
        "id": 1,
        "title": "Informe Fotogràfic - 15/01/2024",
        "created_at": "2024-01-15T14:30:00.000Z"
    }
}
```

**Errors Possibles:**
- `400` - Falten camps obligatoris
- `401` - No autenticat

---

### GET /reports/:id
Obté un informe específic.

**Petició:**
```http
GET /api/reports/1
Authorization: Bearer <access_token>
```

**Resposta Exitosa (200):**
```json
{
    "report": {
        "id": 1,
        "title": "Informe Fotogràfic - 15/01/2024",
        "report_data": {
            "general": {...},
            "photos": [...]
        },
        "created_at": "2024-01-15T14:30:00.000Z",
        "updated_at": "2024-01-15T14:30:00.000Z"
    }
}
```

**Errors Possibles:**
- `404` - Informe no trobat

---

### PUT /reports/:id
Actualitza un informe existent.

**Petició:**
```http
PUT /api/reports/1
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "title": "Informe Actualitzat",
    "report_data": {
        "general": {...},
        "photos": [...]
    }
}
```

**Resposta Exitosa (200):**
```json
{
    "message": "Informe actualitzat correctament",
    "report": {
        "id": 1,
        "title": "Informe Actualitzat",
        "updated_at": "2024-01-15T15:00:00.000Z"
    }
}
```

---

### DELETE /reports/:id
Elimina un informe.

**Petició:**
```http
DELETE /api/reports/1
Authorization: Bearer <access_token>
```

**Resposta Exitosa (200):**
```json
{
    "message": "Informe esborrat correctament"
}
```

---

## 📊 Endpoints de Monitoring (Només Administradors)

### GET /monitoring/dashboard
Obté el dashboard complet de monitoring.

**Petició:**
```http
GET /api/monitoring/dashboard
Authorization: Bearer <admin_access_token>
```

**Resposta Exitosa (200):**
```json
{
    "success": true,
    "data": {
        "requests": {
            "total": 1250,
            "success": 1180,
            "errors": 70,
            "avgResponseTime": 145.6
        },
        "performance": {
            "memoryUsage": [65.2, 67.1, 69.3],
            "cpuUsage": [12.5, 15.2, 18.7],
            "responseTimes": [120, 135, 156]
        },
        "business": {
            "reportsGenerated": 45,
            "photosUploaded": 234,
            "usersActive": 12,
            "logins": 89
        },
        "alerts": []
    },
    "timestamp": "2024-01-15T14:30:00.000Z"
}
```

---

### GET /monitoring/health
Health check del sistema (públic).

**Petició:**
```http
GET /api/monitoring/health
```

**Resposta Exitosa (200):**
```json
{
    "success": true,
    "data": {
        "status": "healthy",
        "timestamp": "2024-01-15T14:30:00.000Z",
        "uptime": 86400,
        "memory": {
            "rss": 45678592,
            "heapTotal": 28311552,
            "heapUsed": 22089728
        },
        "version": "v21.7.0",
        "environment": "development"
    }
}
```

---

## 🔄 Endpoints Especials

### POST /save-json
Descarrega les dades d'un informe com a fitxer JSON.

**Petició:**
```http
POST /save-json
Content-Type: application/json

{
    "general": {...},
    "photos": [...]
}
```

**Resposta:**
- Fitxer JSON descarregable
- Content-Type: `application/json`
- Content-Disposition: `attachment; filename="informe_dades_[timestamp].json"`

---

### POST /log-error
Registra errors del client al servidor.

**Petició:**
```http
POST /api/log-error
Content-Type: application/json

{
    "context": "photo-upload",
    "message": "Error en processar imatge",
    "stack": "Error: ...",
    "timestamp": "2024-01-15T14:30:00.000Z",
    "userAgent": "Mozilla/5.0...",
    "url": "http://localhost:33333"
}
```

**Resposta Exitosa (200):**
```json
{
    "success": true,
    "message": "Error registrat"
}
```

---

## ⚠️ Gestió d'Errors

### Codis d'Error Comuns
- `400` - Bad Request (dades invàlides)
- `401` - Unauthorized (no autenticat)
- `403` - Forbidden (sense permisos)
- `404` - Not Found (recurs no trobat)
- `409` - Conflict (conflicte de dades)
- `413` - Payload Too Large (fitxer massa gran)
- `500` - Internal Server Error (error del servidor)

### Format d'Error Estàndard
```json
{
    "success": false,
    "error": "Descripció de l'error",
    "details": ["Detall 1", "Detall 2"],
    "stack": "Error stack (només en desenvolupament)"
}
```

---

## 🔧 Configuració i Límits

### Rate Limiting
- **General**: 100 peticions per minut per IP
- **Autenticació**: 5 intents per 15 minuts per IP

### Límits de Fitxers
- **Imatges**: 20MB màxim
- **JSON**: 1GB màxim (configurable)

### Tipus de Fitxers Permesos
- **Imatges**: `image/jpeg`, `image/png`
- **Documents**: `application/json`, `text/plain`

---

## 📝 Exemples d'Ús

### Flux Complet d'Autenticació
```javascript
// 1. Registre
const registerResponse = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email: 'usuari@exemple.com',
        password: 'contrasenya123',
        name: 'Nom Usuari'
    })
});

// 2. Login
const loginResponse = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email: 'usuari@exemple.com',
        password: 'contrasenya123'
    })
});

const { accessToken, user } = await loginResponse.json();

// 3. Ús del token
const profileResponse = await fetch('/api/user/profile', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
});
```

### Creació d'Informe
```javascript
const reportData = {
    title: 'Informe Fotogràfic - Accident',
    report_data: {
        general: {
            tipus: 'Accident',
            numero: '2024/001',
            data: '2024-01-15',
            hora: '14:30',
            adreca: 'Carrer Major, 123',
            assumpte: 'Accident de trànsit',
            signants: 'Agent 1, Agent 2'
        },
        photos: [
            {
                id: 1,
                titol: 'Vista general',
                descripcio: 'Vista general de l\'accident',
                imageUrl: 'data:image/jpeg;base64,...',
                isActive: true
            }
        ]
    }
};

const response = await fetch('/api/reports', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(reportData)
});
```

---

## 🔍 Debugging

### Headers de Debug
L'API inclou headers útils per debugging:
- `X-Trace-ID` - ID únic per cada petició
- `X-Response-Time` - Temps de resposta en ms

### Logs del Servidor
Els logs es guarden a:
- `logs/app.log` - Logs generals
- `logs/error.log` - Errors específics
- `logs/security.log` - Events de seguretat

---

## 🌐 CORS

### Orígens Permesos
- **Desenvolupament**: `http://localhost:33333`, `http://127.0.0.1:33333`
- **Producció**: Configurable via variables d'entorn

### Capçaleres Permeses
- `Content-Type`
- `Authorization`
- `X-Requested-With`

---

*Documentació actualitzada: Juliol 2025* 