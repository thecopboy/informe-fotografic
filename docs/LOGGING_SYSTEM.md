# Sistema de Logging Centralitzat

## Visió General

El sistema de logging centralitzat proporciona una manera consistent i eficient de gestionar logs a tota l'aplicació, amb detecció automàtica de l'entorn d'execució.

## Components Principals

### 1. EnvironmentUtils

Utilitats per detectar l'entorn d'execució:

```javascript
import { EnvironmentUtils } from './utils/errorHandler.js';

// Comprovar si estem en desenvolupament
if (EnvironmentUtils.isDevelopment()) {
    // Codi només per desenvolupament
}

// Comprovar si estem en producció
if (EnvironmentUtils.isProduction()) {
    // Codi només per producció
}

// Comprovar si estem en test
if (EnvironmentUtils.isTest()) {
    // Codi només per tests
}
```

### 2. Logger

Sistema de logging amb diferents nivells:

```javascript
import { Logger } from './utils/errorHandler.js';

// Logs d'informació
Logger.info('Operació completada amb èxit', { userId: 123, action: 'login' });

// Logs d'advertència
Logger.warn('Token a punt d\'expirar', { expiresIn: '5min' });

// Logs d'error
Logger.error('Error en processar fitxer', error);

// Logs de debug (només en desenvolupament)
Logger.debug('Valor de variable', { variable: 'valor' });
```

## Avantatges del Sistema Centralitzat

### 1. Detecció Automàtica d'Entorn
- **Desenvolupament**: `localhost`, `127.0.0.1`, port `33333`
- **Producció**: Qualsevol altre entorn
- **Test**: Quan no hi ha `window` o `localStorage`

### 2. Gestió Intel·ligent de Logs
- **Debug**: Només es mostren en desenvolupament
- **Info/Warn/Error**: Sempre es mostren
- **Storage**: Els logs es guarden a `localStorage` per debugging

### 3. Consistència
- Format unificat: `[NIVELL] Missatge`
- Dades estructurades per a cada log
- Timestamp automàtic

## Migració de Console.log

### Abans (No recomanat)
```javascript
console.log('Usuari logejat:', user);
console.warn('Token expirat');
console.error('Error:', error);
```

### Després (Recomanat)
```javascript
import { Logger } from './utils/errorHandler.js';

Logger.info('Usuari logejat', { userId: user.id, email: user.email });
Logger.warn('Token expirat', { tokenId: token.id });
Logger.error('Error en autenticació', error);
```

## Exemples d'Ús

### En Components
```javascript
export class MyComponent {
    constructor() {
        Logger.debug('Component inicialitzat', { componentName: 'MyComponent' });
    }

    handleAction() {
        try {
            // Codi de l'acció
            Logger.info('Acció completada', { action: 'userAction' });
        } catch (error) {
            Logger.error('Error en acció', error);
        }
    }
}
```

### En Mòduls
```javascript
export class MyModule {
    init() {
        Logger.info('Mòdul inicialitzat', { moduleName: 'MyModule' });
    }

    processData(data) {
        if (!data) {
            Logger.warn('Dades buides rebudes');
            return;
        }
        
        Logger.debug('Processant dades', { dataSize: data.length });
    }
}
```

### En Utilitats
```javascript
export function processFile(file) {
    Logger.debug('Iniciant processament de fitxer', { 
        fileName: file.name, 
        fileSize: file.size 
    });

    try {
        // Processament
        Logger.info('Fitxer processat correctament', { fileName: file.name });
    } catch (error) {
        Logger.error('Error processant fitxer', error);
        throw error;
    }
}
```

## Configuració

### Nivells de Log
- **DEBUG**: Informació detallada (només desenvolupament)
- **INFO**: Informació general
- **WARN**: Advertències
- **ERROR**: Errors

### Storage
- Els logs es guarden a `localStorage` amb clau `app_logs`
- Màxim 100 logs guardats
- Automàticament es netegen els logs antics

### Entorns
- **Desenvolupament**: Logs complets + debug
- **Producció**: Logs essencials + enviament a servei
- **Test**: Sense logs a localStorage

## Best Practices

### 1. Ús de Context
```javascript
// Bo
Logger.info('Usuari creat', { userId: user.id, email: user.email });

// Evitar
Logger.info('Usuari creat');
```

### 2. Gestió d'Errors
```javascript
try {
    // Codi que pot fallar
} catch (error) {
    Logger.error('Context de l\'error', error);
    // Gestionar l'error
}
```

### 3. Logs de Debug
```javascript
// Només per desenvolupament
Logger.debug('Variable interna', { value: internalValue });
```

### 4. Evitar Logs Sensibles
```javascript
// Evitar
Logger.info('Contrasenya', { password: userPassword });

// Correcte
Logger.info('Usuari autenticat', { userId: user.id });
```

## Migració Gradual

1. **Importar Logger** en els fitxers que usen `console.log`
2. **Substituir** `console.log` per `Logger.info`
3. **Substituir** `console.warn` per `Logger.warn`
4. **Substituir** `console.error` per `Logger.error`
5. **Afegir** `Logger.debug` per logs de desenvolupament
6. **Eliminar** imports no utilitzats

## Monitoratge

### Logs a localStorage
```javascript
// Veure logs guardats
const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
console.table(logs);
```

### Errors a localStorage
```javascript
// Veure errors guardats
const errors = JSON.parse(localStorage.getItem('app_errors') || '[]');
console.table(errors);
```

## Conclusió

El sistema de logging centralitzat proporciona:
- **Consistència** en tots els logs
- **Detecció automàtica** d'entorn
- **Gestió intel·ligent** de nivells de log
- **Debugging millorat** amb storage local
- **Mantenibilitat** del codi

Utilitza sempre el `Logger` en lloc de `console.log` directament per mantenir la consistència i beneficiar-te de totes les funcionalitats del sistema. 