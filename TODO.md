# 📋 TODO - Informe Fotogràfic

*Última actualització: Gener 2026*

---

## ✅ Completat Recentment

### 🔒 Seguretat i Configuració (Gener 2026)
- [x] **Variables d'Entorn** - Secrets JWT migrats a `.env` i `.env.dev`
- [x] **Configuració .env** - Scripts npm amb `--env-file` natiu (Node >=20.6.0)
- [x] **Documentació SECRETS_SETUP.md** - Guia completa de configuració de secrets
- [x] **Actualització NPM packages** - 11 vulnerabilitats arreglades (SQLite3 v5.1.7)
- [x] **Webhook GitHub** - Documentació completa a `docs/WEBHOOK_GITHUB_SETUP.md`
- [x] **Config.js hardening** - JWT secrets obligatoris via getRequiredEnv()

### 🎯 Millores UI/UX (Juliol 2025)
- [x] **Imatges de perfil per defecte** - Escut, fons, signatura amb drag & drop
- [x] **Optimització de rendiment** - Llistat d'informes de 20MB → 1KB
- [x] **Validació de títols** - Títols de fotos opcionals amb sanitització
- [x] **Interfície mòbil** - Menú optimitzat amb terminologia millorada
- [x] **Refactorització Drag & Drop** - DragDropManager centralitzat
- [x] **Botó "Nou Informe"** - Reset complet amb càrrega de dades per defecte
- [x] **Neteja de codi sistemàtica** - Comentaris morts, imports i console.log eliminats

---

## 🚧 Prioritari (Fer Ara)

### 🧪 Testing i Qualitat
- [ ] **Tests unitaris complets**
  - [ ] AuthManager tests (login, registre, tokens)
  - [ ] ReportManager tests (CRUD d'informes)
  - [ ] StateManager tests (subscripcions, actualitzacions)
  - [ ] API integration tests (endpoints crítics)
  - **Objectiu**: 90% cobertura

### 🚨 Gestió d'Errors Frontend
- [ ] Interceptor global per errors HTTP (401, 403, 500)
- [ ] Auto-refresh de JWT abans que expiri
- [ ] Retry automàtic per peticions fallides
- [ ] Notificació d'errors de xarxa a usuari
- [ ] Offline detection i notificació

### 📄 Paginació i Rendiment
- [ ] Paginació al llistat d'informes (backend + frontend)
- [ ] Infinite scroll o botó "Carregar més"
- [ ] Filtre per data/títol i cerca d'informes
- [ ] Cache de pàgines ja carregades

### 🗑️ Confirmacions i Seguretat UX
- [ ] Modal de confirmació abans d'esborrar informes/fotos
- [ ] Opció "Undo" temporal després d'esborrar (5-10s)
- [ ] Toast notifications amb opció de desfer

---

## 💡 Millores Recomanades

### 🎨 UI/UX
- [ ] **Loading states millorats** - Skeleton loaders, progress bars
- [ ] **Animacions** - Transicions suaves per reordenació
- [ ] **Tooltips** - Ajuda contextual per usuaris
- [ ] **Accessibility** - Compliment WCAG 2.1
- [ ] **Tema fosc** - Dark mode amb CSS variables

### 🖼️ Optimització d'Imatges
- [ ] Processar imatges al backend amb `sharp`
- [ ] Generar thumbnails automàticament
- [ ] Servir imatges en diferents mides (responsive)
- [ ] Comprimir i convertir a WebP
- [ ] Lazy loading d'imatges al frontend

### 💾 Cache i Rendiment
- [ ] Cache de perfils d'usuari (Redis o Map)
- [ ] TTL de 5-10 minuts amb invalidació intel·ligent
- [ ] Cache d'informes freqüentment accedits
- [ ] Estadístiques de cache hits/misses

---

## 🔧 DevOps i Infraestructura

### 🚀 CI/CD
- [ ] GitHub Actions per tests automàtics
- [ ] Lint code (ESLint) en cada PR
- [ ] Security audit (npm audit) automatitzat
- [ ] Deploy automàtic a staging
- [ ] Deploy manual a producció amb notificacions

### 🐳 Containerització
- [ ] Dockerfile optimitzat amb multi-stage build
- [ ] docker-compose.yml per desenvolupament
- [ ] Health checks i volumes per persistència
- [ ] Entorns dev/staging/prod separats

### 📊 Monitoring i Observabilitat
- [ ] Integració Sentry per errors en temps real
- [ ] Dashboard de mètriques (requests, errors, latència)
- [ ] Logs estructurats (JSON format)
- [ ] APM (Application Performance Monitoring)
- [ ] Alertes per errors crítics

### 💾 Backup i Resiliència
- [ ] Script diari per backup de SQLite
- [ ] Rotació de backups (últims 7 dies)
- [ ] Backup remot (S3 o similar)
- [ ] Script de restauració amb tests mensuals

---

## 🔮 Futures Funcionalitats

### 🌐 Funcionalitats Avançades
- [ ] **Compartir informes** - Per email o enllaç públic amb expiració
- [ ] **Historial de versions** - Diff, restauració de versions anteriors
- [ ] **Exportar a Word** - Amb `docxtemplater` i templates personalitzables
- [ ] **PWA** - Progressive Web App per ús offline
- [ ] **Touch gestures** - Gestos tàctils avançats per mòbil
- [ ] **Camera integration** - Captura directa amb dispositiu mòbil

### 🔢 API i Integració
- [ ] **API Versioning** - `/api/v1/`, `/api/v2/`
- [ ] **OpenAPI/Swagger** - Documentació automàtica de l'API
- [ ] **Rate limiting** - Límits més granulars per endpoint
- [ ] **Email reports** - Enviament automàtic d'informes

### 🌍 Internacionalització
- [ ] Sistema de traduccions (i18n)
- [ ] Suport per català, castellà, anglès
- [ ] Selector d'idioma amb detecció automàtica
- [ ] Dates i formats locals

### 📘 TypeScript (Opcional)
- [ ] Migració gradual a TypeScript
- [ ] Interfaces per User, Report, Photo
- [ ] Tipatge complet de StateManager
- [ ] Millor intellisense i prevenció d'errors

---

## 💡 Idees per Explorar

### 🎯 Innovacions Potencials
- [ ] **AI-powered** - Classificació automàtica d'imatges
- [ ] **OCR integration** - Extracció de text d'imatges
- [ ] **Template system** - Plantilles personalitzables per informes
- [ ] **Workflow automation** - Automatització de processos repetitius
- [ ] **WebAssembly** - Processament d'imatges més ràpid
- [ ] **WebRTC** - Col·laboració en temps real
- [ ] **Machine Learning** - Suggeriments intel·ligents
- [ ] **Blockchain** - Verificació d'autenticitat d'informes

---

## 📈 Mètriques i Objectius

### 🎯 Objectius Tècnics
- **Cobertura de tests**: 90%
- **Temps de càrrega**: < 2 segons
- **Bundle size**: < 500KB
- **Lighthouse score**: > 90
- **Optimització de fonts**: Reduir de 4.6MB actual

### 📊 Mètriques de Negoci
- **Temps de creació d'informe**: < 5 minuts
- **Error rate**: < 1%
- **User satisfaction**: > 4.5/5
- **Mobile usage**: > 40%

---

## 📋 Planificació Recomanada

### Sprint 1 (Setmana 1-2)
1. Tests crítics (AuthManager, ReportManager, StateManager)
2. Gestió d'errors frontend
3. Confirmacions d'esborrat

### Sprint 2 (Setmana 3-4)
1. Paginació d'informes
2. Loading states millorats
3. Cache de perfils

### Sprint 3 (Mes 2)
1. Optimització d'imatges backend
2. CI/CD Pipeline
3. Docker Compose

### Backlog (Futur)
- Monitoring i observabilitat
- Backups automàtics
- API versioning
- Funcionalitats avançades (compartir, versions, PWA)

---

## 📚 Documentació Relacionada

- [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) - Arquitectura del projecte
- [docs/SECRETS_SETUP.md](docs/SECRETS_SETUP.md) - Configuració de secrets
- [docs/WEBHOOK_GITHUB_SETUP.md](docs/WEBHOOK_GITHUB_SETUP.md) - Setup del webhook
- [README.md](README.md) - Guia d'instal·lació i ús

---

**Estat del projecte**: Producció (MVP complet)  
**Pròxima revisió**: Febrer 2026
