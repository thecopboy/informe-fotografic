# 📸 Informe Fotogràfic - Aplicació Web Professional

Una aplicació web completa per crear informes fotogràfics professionals amb sistema d'autenticació, gestió d'usuaris, i arquitectura modular avançada.

## 📄 Llicència

Aquest projecte està llicenciat sota la [Apache License 2.0](LICENSE) - vegeu el fitxer LICENSE per a més detalls.

**Nota sobre IA**: Aquest codi ha estat desenvolupat amb l'assistència d'intel·ligència artificial. L'autor manté tots els drets sobre el codi final i la implementació específica.

### 📋 Fitxer NOTICE
Aquest projecte inclou un fitxer [NOTICE](NOTICE) que documenta les contribucions i dependències de tercers, tal com requereix la llicència Apache 2.0.

## ✨ Funcionalitats Principals

### 📋 Gestió d'Informes
- **Creació d'informes** amb formulari complet
- **Botó "Nou"** que reseteja tots els camps i actualitza data/hora
- **Edició d'informes** existents (usuaris autenticats)
- **Validació completa** de tots els camps obligatoris
- **Previsualització** en temps real

### 📸 Gestió de Fotos
- **Drag & Drop centralitzat** - Arrossega imatges directament
- **Pujada múltiple** de fotos (JPG, PNG)
- **Redimensionament automàtic** (màx. 1920x1080px)
- **Compressió intel·ligent** (qualitat 0.8)
- **Reordenació visual** de fotos per drag & drop
- **Títols i descripcions** personalitzables
- **Botó X per esborrar títol** (amb Ctrl esborra tots els títols de les fotos)
- **Previsualització** instantània

### 🛡️ Gestió d'Escut i Imatge de Fons (Web Components)
- **Web Components unificats** - `ImageUploadComponent` reutilitzable
- **Drag & Drop encapsulat** - Gestió interna del component
- **Click per seleccionar** fitxer d'escut o fons
- **Previsualització** automàtica amb botó d'eliminació
- **Validació** (JPG/PNG, màx. 5MB)
- **Integració** amb perfils d'usuari
- **Imatge de fons per defecte** - Configurable al perfil d'usuari
- **Aplicació automàtica** en nous informes
- **Estats protegits** - Prevenció de bucles recursius

### 🔐 Sistema d'Autenticació
- **Registre i login** d'usuaris
- **Perfils personalitzables** amb dades per defecte
- **Tokens JWT** amb renovació automàtica
- **Gestió de sessions** segura
- **Dades per defecte** (signants, escut, imatge de fons, imatge de signatura) per usuaris autenticats
- **Integració de signatura** en PDFs generats

### 📄 Generació de PDFs
- **Disseny professional** amb tipografia personalitzada
- **Integració d'escut** automàtica
- **Gestió intel·ligent** de fotos (orientació, mida)
- **Metadades completes** (autor, data, títol)
- **Qualitat alta** per impressió

### ⚡ Rendiment Optimitzat
- **Llistat d'informes ràpid** - Només carrega metadades bàsiques
- **Transferència reduïda** - De 20MB a ~1KB per llistat
- **Temps de càrrega millorat** - De 650ms a ~50ms
- **API eficient** - Endpoints optimitzats per cada cas d'ús

### 💾 Importació/Exportació
- **Exportació JSON** per compartir informes
- **Importació JSON** amb validació
- **Compatibilitat** amb formats antics
- **Validació robusta** de dades

### 🎨 Interfície d'Usuari
- **Disseny responsiu** (desktop i mòbil)
- **Navegació intuïtiva** amb menú mòbil optimitzat
- **Menú mòbil millorat** - Espaiat equilibrat amb línia divisòria semàntica
- **Botons contextuals** - "Informes" només visible per usuaris autenticats
- **Terminologia actualitzada** - "Descarregar informe" en lloc de "Crear informe"
- **Modals moderns** per login, perfils, informes
- **Notificacions** en temps real
- **Indicadors visuals** per drag & drop

### 🎯 Millores Recents (Juliol 2025)
- **Web Components unificats** - `ImageUploadComponent` per escut i fons
- **Sistema de logging centralitzat** - `Logger` i `EnvironmentUtils`
- **Protecció d'estats** - Prevenció de bucles recursius amb `stateManager`
- **Drag & Drop optimitzat** - `DragDropMixin` reutilitzable
- **Navegació mòbil corregida** - Tots els botons funcionen correctament
- **Event listeners arreglats** - Arquitectura consolidada al UIManager
- **CSS optimitzat** - Millor gestió d'estats interactius
- **Semàntica HTML** - Ús d'elements `<hr>` per separadors
- **Feedback visual millorat** - Estats :active correctament gestionats

### 🧹 Neteja de Codi (Juliol 2025)
- **Eliminació de duplicació** - Funcions duplicades centralitzades (`ensurePhotoIds` → `FileService`)
- **Funcions no utilitzades** - Eliminades funcions obsoletes (`isRealFile`)
- **Logs de debug** - Eliminats de tots els mòduls per a producció
- **Codi mort** - Netejat sistemàticament sense trencar funcionalitat
- **Centralització d'utilitats** - Funcions comunes mogudes a serveis especialitzats
- **Preparació per producció** - Codi optimitzat i net

## 🏗️ Arquitectura

### 🎯 Patrons d'Arquitectura
- **Dependency Injection (DI)** - Injecció de dependències
- **Single Responsibility Principle (SRP)** - Responsabilitat única
- **Observer Pattern** - Sistema reactiu d'estat
- **Factory Pattern** - Creació d'objectes especialitzats
- **Command Pattern** - Encapsulació d'operacions
- **Web Components** - Components reutilitzables i encapsulats
- **Mixin Pattern** - Reutilització de funcionalitats comunes

### 📁 Organització Modular
```
Frontend (ES6+ Modules):
├── 🎛️ StateManager      # Estat centralitzat amb protecció anti-bucles
├── 🔐 AuthManager       # Autenticació
├── 📄 ReportManager     # CRUD d'informes
├── 🎨 UIManager         # Interfície d'usuari
├── 🖱️ DragDropManager  # Drag & Drop centralitzat
├── 📸 PhotoComponentManager # Components de fotos
├── 🖼️ ImageComponentManager # Gestió de web components d'imatges
├── 📋 FormManager       # Gestió de formularis
├── 📦 JsonLoader        # Importació/Exportació
├── 🔔 NotificationManager # Notificacions
├── 🧩 ImageUploadComponent # Web component reutilitzable
├── 🔧 DragDropMixin     # Mixin per funcionalitats de drag & drop
└── 📝 Logger            # Sistema de logging centralitzat

Backend (Node.js + Express):
├── 🔐 Auth Module       # Autenticació JWT
├── 📄 Reports Module    # CRUD d'informes
├── 🗄️ Database Layer   # SQLite amb 6 taules
├── 🛡️ Middleware       # Seguretat i validació
└── 📊 Monitoring       # Logs i mètriques
```

### 🔄 Millores Recents en Drag & Drop
- **Centralització** - Un sol mòdul gestiona tot el drag & drop
- **Eliminació de duplicació** - Codi net i mantenible
- **Responsabilitats clares** - Cada mòdul té una funció específica
- **Integració perfecta** - Funciona amb el sistema d'estat reactiu
- **Web Components** - Drag & drop encapsulat per components individuals
- **Mixin reutilitzable** - `DragDropMixin` per compartir funcionalitats

### 🧩 Web Components
- **ImageUploadComponent** - Component reutilitzable per pujada d'imatges
- **Encapsulació** - Estils i comportament aïllats amb Shadow DOM
- **Atributs configurables** - Títol, placeholder, tipus de fitxer
- **Events personalitzats** - `file-selected`, `file-removed`
- **Drag & Drop integrat** - Funcionalitat completa dins del component

### 📝 Sistema de Logging
- **Logger centralitzat** - Classe `Logger` amb mètodes estàtics
- **EnvironmentUtils** - Detecció d'entorn (development/production/test)
- **Logs condicionals** - Només en mode development
- **Consistència** - Ús unificat a tota l'aplicació

### 🛡️ Protecció d'Estats
- **Prevenció de bucles** - `stateManager` amb mètodes de protecció
- **Mètodes segurs** - `startStateUpdate()`, `endStateUpdate()`, `withStateUpdate()`
- **Consistència** - Gestió centralitzada del flag `isUpdatingFromState`
- **Robustesa** - Prevenció d'errors de "Maximum call stack size exceeded"

## 🚀 Instal·lació i Ús

### 📋 Requisits
- **Node.js** 21.7.0 o superior
- **npm** 10.2.4 o superior
- **Sistema operatiu**: Linux, macOS, Windows

### ⚡ Instal·lació Ràpida
```bash
# Clonar el repositori
git clone [URL_DEL_REPOSITORI]
cd informe-fotografic

# Instal·lar dependències
npm install

# Iniciar el servidor
npm start
```

### 🌐 Accés a l'Aplicació
- **URL**: http://localhost:33333
- **Monitorització**: http://localhost:33333/monitoring.html

## 🔧 Configuració

### ⚙️ Variables d'Entorn (OBLIGATORI per producció)

**⚠️ IMPORTANT**: Per motius de seguretat, has de configurar les variables d'entorn abans d'executar en producció.

#### Configuració Ràpida (Desenvolupament Local)
```bash
# 1. Copia la plantilla
cp .env.example .env

# 2. Genera secrets segurs
openssl rand -base64 48  # Copia aquest valor per JWT_ACCESS_SECRET
openssl rand -base64 48  # Copia aquest valor per JWT_REFRESH_SECRET

# 3. Edita .env i enganxa els secrets generats

# 4. Executa l'aplicació (Node.js >=20.6.0 carrega .env nativament)
npm start
```

**Nota**: El projecte utilitza el suport natiu de Node.js per carregar `.env` (`--env-file=.env`). No cal instal·lar paquets addicionals com `dotenv`.

#### Variables Disponibles
```bash
# Servidor
PORT=33333
NODE_ENV=development
DB_PATH=./database/app.db

# JWT Secrets (OBLIGATORI - genera'ls amb openssl)
JWT_ACCESS_SECRET=your-super-secret-min-48-chars
JWT_REFRESH_SECRET=your-super-secret-min-48-chars
```

#### 📚 Guia Completa de Configuració
Per a instruccions detallades sobre com generar i configurar secrets de manera segura per cada entorn (desenvolupament, staging, producció), consulta:

**➡️ [Guia Completa de Configuració de Secrets](docs/SECRETS_SETUP.md)**

Aquesta guia inclou:
- ✅ Com generar secrets segurs
- ✅ Configuració per diferents entorns  
- ✅ Configuració en diferents plataformes (Heroku, Vercel, Railway, PM2, etc.)
- ✅ Rotació de secrets i millors pràctiques
- ✅ Què fer si s'exposa un secret

### 🎛️ Configuració Avançada
Consulta [config/config.js](config/config.js) per opcions avançades:
- Configuració de base de dades
- Límits de fitxers
- Configuració JWT
- Opcions de monitorització

### 🔄 Auto-Deploy amb GitHub Webhook
Si vols que l'aplicació es desplegui automàticament quan es fa push a GitHub, consulta:

**➡️ [Guia de Configuració del Webhook](docs/WEBHOOK_GITHUB_SETUP.md)**

- 🔑 La variable `GITHUB_WEBHOOK_SECRET` es configura només a `git-update/.env` (no al `.env` principal)
- 📦 El servei del webhook s'executa des de la carpeta `git-update/`

## 🧪 Testing

### 🔍 Tests Implementats
```bash
# Executar tots els tests
npm test

# Tests amb cobertura
npm run test:coverage

# Tests en mode watch
npm run test:watch
```

### 📊 Cobertura Actual
- **ValidationService**: 70% cobertura
- **Altres mòduls**: En desenvolupament

## 📊 Monitorització

### 🔍 Mètriques Disponibles
- **Rendiment**: Temps de resposta, CPU, memòria
- **Errors**: Logs detallats amb context
- **Usuaris**: Sessions actives, autenticacions
- **Fitxers**: Pujades, processament, errors

### 📈 Dashboard de Monitorització
Accedeix a `/monitoring.html` per veure:
- Gràfics de rendiment en temps real
- Logs d'errors i activitat
- Estadístiques d'ús
- Mètriques del sistema

## 🛠️ Desenvolupament

### 🔄 Flux de Treball
1. **Desenvolupament local** amb `npm start`
2. **Tests automatitzats** amb `npm test`
3. **Linting** amb `npm run lint`
4. **Build de producció** amb `npm run build`

### 🎯 Millores Planificades
- [ ] **Tests complets** per tots els mòduls
- [ ] **Optimització** de rendiment
- [ ] **Funcionalitats avançades** de drag & drop
- [ ] **Millores de UI/UX**
- [ ] **Documentació** ampliada
- [ ] **Web Components** addicionals per altres elements
- [ ] **Sistema de plugins** per funcionalitats extensibles

## 💡 Consells avançats
- Si mantens premuda la tecla `Ctrl` mentre prems la X per esborrar el títol d’una foto, s’esborraran els títols de totes les fotos de la llista.