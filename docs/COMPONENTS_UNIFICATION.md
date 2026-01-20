# Unificació de Components d'Imatge

## Resum

S'ha implementat una unificació dels components d'imatge (escut i imatge de fons) utilitzant **Web Components** natius de JavaScript. Això ha permès:

- **Reutilització de codi**: Un sol component per gestionar ambdues imatges
- **Encapsulació**: Estils i lògica aïllats amb Shadow DOM
- **Mantenibilitat**: Codi més net i fàcil de mantenir
- **Consistència**: Comportament unificat entre components

## Arquitectura

### Components Creats

#### 1. `ImageUploadComponent` (`public/js/components/ImageUploadComponent.js`)

**Web Component unificat** que reemplaça els components d'escut i imatge de fons.

**Característiques:**
- **Atributs personalitzables**:
  - `title`: Títol del component
  - `placeholder`: Text de placeholder
  - `accept-types`: Tipus de fitxers acceptats
  - `multiple`: Si accepta múltiples fitxers
  - `max-size`: Mida màxima de fitxer

- **Events personalitzats**:
  - `file-selected`: Quan es selecciona un fitxer
  - `file-removed`: Quan s'elimina un fitxer
  - `error`: Quan hi ha un error de validació

- **API pública**:
  - `getFile()`: Obtenir el fitxer actual
  - `setFile(file)`: Establir un fitxer
  - `clear()`: Netejar el component
  - `getPreviewUrl()`: Obtenir URL de previsualització

#### 2. `ImageComponentManager` (`public/js/modules/imageComponentManager.js`)

**Mòdul gestor** que coordina els components d'imatge amb l'estat de l'aplicació.

**Funcionalitats:**
- Reemplaçament automàtic dels components antics
- Gestió d'events dels components
- Integració amb el sistema d'estat
- Validació de fitxers
- Notificacions d'errors

## Canvis Realitzats

### 1. Integració a l'Aplicació Principal

**`app.js`:**
```javascript
// Nou mòdul afegit
this.imageComponentManager = new ImageComponentManager(this.stateManager, this.notificationManager);

// Inicialització
this.imageComponentManager.init();
```

### 2. Actualització de Mòduls Existents

#### `FormManager`
- Afegida referència al `ImageComponentManager`
- Actualitzat `handleReset()` per netejar components d'imatge

#### `ReportManager`
- Afegida referència al `ImageComponentManager`
- Actualitzat `handleNewReport()` per netejar components
- Actualitzat `loadReportData()` per carregar imatges als components

#### `JsonLoader`
- Afegida referència al `ImageComponentManager`
- Actualitzat `populateForm()` per carregar imatges als components

#### `DragDropManager`
- **Eliminats** mètodes deprecats:
  - `setupShieldDropZone()`
  - `setupBackgroundDropZone()`
  - `handleShieldDrop()`
  - `handleBackgroundDrop()`
  - `updateShieldUI()`
  - `updateBackgroundUI()`
- **Actualitzada** prevenció global de drag & drop per incloure `image-upload`

#### `UIManager`
- **Eliminada** subscripció a `shield`
- **Eliminat** mètode `updateShieldUI()`
- **Eliminades** referències als elements antics d'imatge

### 3. Estructura HTML

Els components antics:
```html
<div class="form-field" id="shield-form-field">
    <label for="shield-file-input">Escut:</label>
    <div id="shield-drop-zone">
        <p>Fes clic o arrossega l'escut</p>
        <img src="" alt="" class="shield-preview">
        <input type="file" id="shield-file-input" class="file-input" accept="image/jpeg,image/png">
    </div>
</div>
```

Són reemplaçats automàticament per:
```html
<div class="form-field" id="shield-form-field">
    <image-upload 
        title="Escut"
        placeholder="Fes clic o arrossega l'escut"
        accept-types="image/jpeg,image/png"
        max-size="5242880">
    </image-upload>
</div>
```

## Beneficis Obtinguts

### 1. **Reutilització**
- Un sol component per escut i imatge de fons
- Fàcil afegir nous tipus d'imatges
- Codi compartit per validació i gestió d'events

### 2. **Encapsulació**
- Estils aïllats amb Shadow DOM
- No hi ha conflictes CSS amb l'aplicació principal
- API clara i ben definida

### 3. **Mantenibilitat**
- Menys codi duplicat
- Lògica centralitzada
- Fàcil de testar i depurar

### 4. **Consistència**
- Comportament unificat entre components
- Estils visuals consistents
- Gestió d'errors estandarditzada

### 5. **Extensibilitat**
- Fàcil afegir noves funcionalitats
- Atributs personalitzables
- Events personalitzats

## Compatibilitat

### Navegadors Suportats
- Chrome 67+
- Firefox 63+
- Safari 10.1+
- Edge 79+

### Fallbacks
- Els components utilitzen APIs estàndard de Web Components
- No requereixen polyfills addicionals
- Compatible amb l'arquitectura existent

## Testing

### Tests Manuals Realitzats
1. **Càrrega d'imatges**: Escut i imatge de fons
2. **Drag & Drop**: Funcionament correcte
3. **Validació**: Errors per tipus de fitxer i mida
4. **Reset**: Neteja correcta dels components
5. **Càrrega de JSON**: Restauració d'imatges
6. **Càrrega d'informes**: Imatges des de base de dades

### Tests Automàtics
- Els components són compatibles amb l'arquitectura de testing existent
- Es poden afegir tests específics per als web components

## Futurs Desenvolupaments

### Possibles Millores
1. **Animacions**: Afegir transicions suaus
2. **Previsualització avançada**: Zoom, rotació, etc.
3. **Compressió**: Reducció automàtica de mida
4. **Crop**: Retallar imatges
5. **Filtres**: Aplicar efectes visuals

### Extensions
1. **Múltiples fitxers**: Suport per a galeries
2. **Upload progress**: Barra de progrés
3. **Cloud storage**: Integració amb serveis externs
4. **OCR**: Extracció de text d'imatges

## Conclusió

La unificació dels components d'imatge ha estat un èxit que ha millorat significativament la qualitat del codi:

- ✅ **Codi més net** i mantenible
- ✅ **Reutilització** efectiva
- ✅ **Encapsulació** adequada
- ✅ **Compatibilitat** mantenida
- ✅ **Extensibilitat** millorada

Els web components han demostrat ser una solució robusta i moderna per a la gestió d'imatges a l'aplicació. 