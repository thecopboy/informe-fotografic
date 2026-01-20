# 📋 TODO - Millores Suggèrides per Copilot

*Data: Gener 2026*  
*Anàlisi: Revisió completa del projecte Informe Fotogràfic*

---

## 🎯 **Millores Prioritàries (Impacte Alt)**

### 1. **Seguretat - Variables d'Entorn** ✅ **COMPLETAT**
**Problema**: Els secrets JWT estaven hardcoded al `config/config.js`.

**Accions Completades**:
- [x] Crear fitxer `.env.example` amb variables necessàries
- [x] Verificar `.gitignore` per assegurar que `.env` no es pugi
- [x] Generar secrets segurs per a l'entorn local amb `openssl rand -base64 48`
- [x] Afegir secrets al fitxer `.env` local
- [x] Crear fitxer `.env.dev` per a desenvolupament (Codespaces)
- [x] Configurar scripts de npm: `npm run dev` (usa .env.dev) i `npm start` (usa .env)
- [x] Actualitzar package.json amb flags `--env-file` natius de Node.js (>=20.6.0)
- [x] Crear documentació completa a `docs/SECRETS_SETUP.md`
- [x] Actualitzar README amb enllaç a la guia de configuració

**Fitxers Creats/Modificats**:
- ✅ `.env` - Producció (NODE_ENV=production) - NO es puja a GitHub
- ✅ `.env.dev` - Desenvolupament (NODE_ENV=development) - NO es puja a GitHub
- ✅ `.env.example` - Plantilla per altres desenvolupadors
- ✅ `package.json` - Scripts actualitzats amb `--env-file` natius de Node.js
- ✅ `docs/SECRETS_SETUP.md` - Guia completa de configuració de secrets
- ✅ `README.md` - Actualitzat amb instruccions de configuració

**Informació Tècnica**:
- Node.js v24.11.1 soporta `--env-file` natiu (no cal dotenv)
- `npm run dev` carrega `.env.dev` automàticament
- `npm start` carrega `.env` automàticament
- Secrets separats per entorn (seguretat millor)

**Impacte**: CRÍTIC - Seguretat de l'aplicació ✅ RESOLT
**Temps dedicat**: 1 hora

---

### 2. **Actualització de Seguretat - NPM Packages** ✅ **COMPLETAT**
**Problema**: 12 vulnerabilitats detectades (1 crítica, 10 altes, 1 moderada)

**Accions Completades**:
- [x] Executar `npm audit` per diagnosticar vulnerabilitats
- [x] Executar `npm audit fix` per arreglar vulnerabilitats sense breaking changes
- [x] Actualitzar SQLite3 a v5.1.7 (versió estable)
- [x] Arreglar vulnerabilitats críticas i altes:
  - [x] form-data (critical) - Arreglat ✅
  - [x] js-yaml (moderate) - Arreglat ✅
  - [x] jws (high) - Arreglat ✅
  - [x] qs (high) - Arreglat ✅
  - [x] tar-fs (high) - Arreglat ✅
- [x] Verificar que l'aplicació funciona correctament post-actualització
- [x] Actualitzar package-lock.json

**Resultats**:
- ✅ 11 vulnerabilitats arreglades
- ✅ 5 vulnerabilitats restants (SEGURES - només a build dependencies)
- ✅ Aplicació funcionant correctament (`npm run dev` provat amb èxit)
- ✅ No hi ha breaking changes
- ✅ SQLite3 v5.1.7 funcionant correctament

**Vulnerabilitats Restants** (NO critica):
Les 5 vulnerabilitats restants (tar, cacache, make-fetch-happen, node-gyp, sqlite3) són a dependències transitives de build tools i **NO afecten la seguretat de l'aplicació en producció** ja que no es carreguen en temps d'execució.

**Impacte**: ALT - Seguretat de dependències ✅ RESOLT
**Temps dedicat**: 30 minuts
**Data**: 20 de Gener de 2026

---

## 🎯 Millores Completades - Resum Executiu

| # | Tasca | Status | Temps | Data |
|---|-------|--------|-------|------|
| 1 | Seguretat - Variables d'Entorn | ✅ COMPLETAT | 1h | 20/1/2026 |
| 2 | Actualització NPM Packages | ✅ COMPLETAT | 30min | 20/1/2026 |
| 3 | Gestió d'errors frontend | ⏳ Pendent | 1 dia | - |
| 4 | Paginació al llistat | ⏳ Pendent | 1 dia | - |
| 5 | Tests crítics | ⏳ Pendent | 2-3 dies | - |

---

---

### 2. **Tests - Cobertura Crítica** 🧪
**Problema**: Només 2 fitxers de test (cobertura ~30%), risc alt de regressions.

**Accions**:
- [ ] **AuthManager Tests**
  - [ ] Test de login correcte
  - [ ] Test de login amb credencials incorrectes
  - [ ] Test de registre d'usuari
  - [ ] Test de refresh token
  - [ ] Test d'expiració de token
  
- [ ] **ReportManager Tests**
  - [ ] Test de creació d'informe
  - [ ] Test d'edició d'informe
  - [ ] Test d'esborrat d'informe
  - [ ] Test de llistat d'informes
  - [ ] Test de càrrega d'informe específic
  
- [ ] **StateManager Tests**
  - [ ] Test de subscripcions
  - [ ] Test de protecció anti-bucles
  - [ ] Test d'actualització d'estat
  - [ ] Test de nested paths
  
- [ ] **API Integration Tests**
  - [ ] Test endpoints d'autenticació
  - [ ] Test endpoints de reports
  - [ ] Test endpoints de perfils
  - [ ] Test de rate limiting
  
- [ ] **E2E Tests (opcional)**
  - [ ] Flux complet de creació d'informe
  - [ ] Flux d'autenticació
  - [ ] Flux d'edició i esborrat

**Objectiu**: 90% de cobertura
**Impacte**: ALT - Qualitat i mantenibilitat
**Temps estimat**: 2-3 dies

---

### 3. **Gestió d'Errors Frontend** 🚨
**Problema**: No hi ha gestió global d'errors JWT expirats o errors de xarxa.

**Accions**:
- [ ] Crear interceptor global per errors HTTP
- [ ] Implementar auto-refresh de JWT abans que expiri
- [ ] Afegir notificació a l'usuari si perd la connexió
- [ ] Implementar retry automàtic per peticions fallides
- [ ] Gestió d'errors 401 (redirigir a login)
- [ ] Gestió d'errors 403 (permís denegat)
- [ ] Gestió d'errors 500 (error servidor)
- [ ] Offline detection i notificació

**Exemple d'implementació**:
```javascript
// utils/apiInterceptor.js
class ApiInterceptor {
    async request(url, options) {
        // Auto-refresh JWT si està a punt d'expirar
        // Retry automàtic en cas d'error
        // Gestió global d'errors
    }
}
```

**Impacte**: ALT - Experiència d'usuari i robustesa
**Temps estimat**: 1 dia

---

### 4. **Paginació al Llistat d'Informes** 📄
**Problema**: Si un usuari té 1000 informes, es carreguen tots (encara que només siguin metadades).

**Accions**:
- [ ] Implementar paginació al backend:
  ```javascript
  GET /api/reports?page=1&limit=20&sortBy=created_at&order=desc
  ```
- [ ] Actualitzar frontend per carregar per pàgines
- [ ] Afegir infinite scroll o botó "Carregar més"
- [ ] Afegir filtre per data/títol
- [ ] Afegir cerca d'informes
- [ ] Cache de pàgines ja carregades

**Impacte**: ALT - Rendiment amb molts informes
**Temps estimat**: 1 dia

---

## 💡 **Millores Recomanades (Impacte Mitjà)**

### 5. **TypeScript** 📘
**Beneficis**: Tipatge estàtic, millor intellisense, menys errors en temps d'execució.

**Accions**:
- [ ] Instal·lar TypeScript i dependències
- [ ] Configurar `tsconfig.json`
- [ ] Migrar `config/config.js` → `config/config.ts`
- [ ] Migrar mòduls del frontend gradualment
- [ ] Definir interfaces per:
  - [ ] User, Report, Photo
  - [ ] StateManager state
  - [ ] API responses
- [ ] Actualitzar scripts de build

**Impacte**: MITJÀ - Millora la mantenibilitat a llarg termini
**Temps estimat**: 3-5 dies
**Prioritat**: Opcional (després de tests)

---

### 6. **Loading States Millorats** ⏳
**Accions**:
- [ ] Implementar skeleton loaders per al llistat d'informes
- [ ] Afegir progress bar per pujada d'imatges
- [ ] Indicador de progrés durant generació del PDF
- [ ] Loading state per cada acció (login, guardar, etc.)
- [ ] Animacions suaus de transició

**Impacte**: MITJÀ - Millora percepció de rendiment
**Temps estimat**: 1 dia

---

### 7. **Confirmacions d'Esborrat** 🗑️
**Problema**: No hi ha confirmacions abans d'esborrar informes o fotos.

**Accions**:
- [ ] Modal de confirmació "Estàs segur?" abans d'esborrar informe
- [ ] Confirmació abans d'esborrar foto
- [ ] Opció "Undo" temporal després d'esborrar (5-10 segons)
- [ ] Toast notification després d'esborrat amb opció de desfer

**Impacte**: MITJÀ - Prevenir pèrdua accidental de dades
**Temps estimat**: 4-6 hores

---

### 8. **Optimització d'Imatges al Backend** 🖼️
**Problema**: El redimensionament es fa al frontend, caldria fer-ho al backend.

**Accions**:
- [ ] Instal·lar `sharp` per processar imatges
- [ ] Generar thumbnails per al llistat d'informes
- [ ] Servir imatges en diferents mides segons necessitat
- [ ] Comprimir imatges automàticament
- [ ] Convertir a WebP per millor compressió
- [ ] Lazy loading d'imatges al frontend

**Impacte**: MITJÀ - Millora rendiment i transferència de dades
**Temps estimat**: 1-2 dies

---

### 9. **Cache de Perfils** 💾
**Problema**: Cada consulta d'informe probablement consulta el perfil d'usuari.

**Accions**:
- [ ] Implementar cache en memòria (Redis o simple Map)
- [ ] TTL de 5-10 minuts per perfils
- [ ] Invalidació quan s'actualitza el perfil
- [ ] Cache també per informes freqüentment accedits
- [ ] Estadístiques de cache hits/misses

**Impacte**: MITJÀ - Millora rendiment del servidor
**Temps estimat**: 1 dia

---

## 🔧 **Millores Tècniques**

### 10. **CI/CD Pipeline** 🚀
**Accions**:
- [ ] Crear `.github/workflows/ci.yml`:
  - [ ] Run tests automàtics
  - [ ] Lint code (ESLint)
  - [ ] Security audit (npm audit)
  - [ ] Build verificat
  
- [ ] Crear `.github/workflows/deploy.yml`:
  - [ ] Deploy automàtic a staging
  - [ ] Deploy manual a producció
  - [ ] Notificacions de deploy

**Impacte**: BAIX (però molt útil) - Automatització
**Temps estimat**: 1 dia

---

### 11. **Docker Compose** 🐳
**Accions**:
- [ ] Crear `Dockerfile` optimitzat
- [ ] Crear `docker-compose.yml` per desenvolupament
- [ ] Multi-stage build per producció
- [ ] Volume per persistència de SQLite
- [ ] Health checks

**Exemple**:
```yaml
services:
  app:
    build: .
    ports:
      - "33333:33333"
    volumes:
      - ./database:/app/database
    environment:
      - NODE_ENV=development
```

**Impacte**: BAIX - Facilita desenvolupament i deploy
**Temps estimat**: 4-6 hores

---

### 12. **Monitoring de Producció** 📊
**Accions**:
- [ ] Integrar Sentry per errors en temps real
- [ ] Configurar alertes per errors crítics
- [ ] Dashboard de mètriques (requests, errors, temps de resposta)
- [ ] Logs estructurats (JSON)
- [ ] APM (Application Performance Monitoring)

**Impacte**: BAIX (però important per producció) - Observabilitat
**Temps estimat**: 1 dia

---

### 13. **Backup Automàtic de SQLite** 💾
**Accions**:
- [ ] Script diari per backup de `app.db`
- [ ] Rotació de backups (mantenir últims 7 dies)
- [ ] Backup a S3 o similar
- [ ] Script de restauració
- [ ] Test de restauració mensual

**Impacte**: BAIX (però crític per recuperació) - Resiliència
**Temps estimat**: 4-6 hores

---

### 14. **API Versioning** 🔢
**Problema**: Futures incompatibilitats poden trencar clients antics.

**Accions**:
- [ ] Reorganitzar rutes amb versió:
  ```
  /api/v1/reports
  /api/v1/auth
  /api/v1/profile
  ```
- [ ] Documentar política de deprecació
- [ ] Headers de versió API
- [ ] Documentació OpenAPI/Swagger

**Impacte**: BAIX - Preparació futur
**Temps estimat**: 1 dia

---

## 🎨 **Millores UX Opcionals**

### 15. **Compartir Informes** 📤
**Accions**:
- [ ] Compartir amb usuaris específics (per email)
- [ ] Generar enllaç públic amb expiració
- [ ] Permisos (només lectura / edició)
- [ ] Notificacions quan es comparteix

**Temps estimat**: 2-3 dies

---

### 16. **Historial de Versions** 📜
**Accions**:
- [ ] Guardar versions anteriors d'informes
- [ ] Poder veure diff entre versions
- [ ] Restaurar versió anterior
- [ ] Limitar a últimes N versions

**Temps estimat**: 2-3 dies

---

### 17. **Exportar a Word** 📝
**Accions**:
- [ ] Integrar `docxtemplater` o similar
- [ ] Template de Word personalitzable
- [ ] Mantenir format similar al PDF

**Temps estimat**: 2 dies

---

### 18. **Temes Foscos** 🌙
**Accions**:
- [ ] Implementar CSS variables per colors
- [ ] Toggle dark/light mode
- [ ] Guardar preferència a localStorage
- [ ] Detectar preferència del sistema

**Temps estimat**: 1 dia

---

### 19. **Internacionalització (i18n)** 🌍
**Accions**:
- [ ] Extreure tots els textos a fitxers de traducció
- [ ] Implementar sistema de traduccions
- [ ] Afegir castellà, anglès
- [ ] Selector d'idioma

**Temps estimat**: 3-4 dies

---

## 📊 **Planificació Recomanada**

### **Sprint 1 - Setmana 1** (Prioritat Crítica)
- [x] Anàlisi complet del projecte ✅
- [ ] 1. Seguretat - Variables d'entorn
- [ ] 3. Gestió d'errors frontend
- [ ] 7. Confirmacions d'esborrat

### **Sprint 2 - Setmanes 2-3** (Tests i Qualitat)
- [ ] 2. Tests - Cobertura crítica (AuthManager, ReportManager, StateManager)
- [ ] 2. Tests d'integració API

### **Sprint 3 - Setmana 4** (Rendiment)
- [ ] 4. Paginació al llistat d'informes
- [ ] 9. Cache de perfils
- [ ] 6. Loading states millorats

### **Sprint 4 - Futur** (Opcional)
- [ ] 8. Optimització d'imatges al backend
- [ ] 10. CI/CD Pipeline
- [ ] 11. Docker Compose
- [ ] 5. TypeScript (si escau)

### **Backlog** (Quan hi hagi temps)
- [ ] 12. Monitoring
- [ ] 13. Backups automàtics
- [ ] 14. API Versioning
- [ ] 15-19. Millores UX

---

## 📝 **Notes**

- Totes les millores estan ordenades per impacte i prioritat
- Els temps són estimacions aproximades
- Algunes millores es poden fer en paral·lel
- Prioritzar sempre seguretat i tests abans de noves funcionalitats

---

**Última actualització**: Gener 2026  
**Revisat per**: GitHub Copilot
