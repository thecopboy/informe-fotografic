# Arquitectura del Sistema

## 📋 Visió General
L'aplicació **Informe Fotogràfic** és una eina modular per a la gestió d'informes amb imatges, construïda amb un enfocament en la separació de responsabilitats i la reactivitat.

### Tecnologies Core:
- **Frontend**: Vanila JS (ES6+), Web Components, State Management reactiu.
- **Backend**: Node.js, Express.js.
- **Dades**: PostgreSQL (Base de dades relacional robusta i escalable).
- **Seguretat**: Autenticació JWT (Access & Refresh tokens).

---

## 🏛️ Arquitectura Frontend
L'aplicació segueix un patró d'Estat Centralitzat (Single Source of Truth).

### Components Principals:
1. **StateManager**: Singleton que gestiona l'estat global. Implementa un patró Observer i protecció anti-bucles recursius.
2. **Managers de Negoci**:
   - `AuthManager`: Sessions i perfils.
   - `ReportManager`: CRUD d'informes.
   - `PhotoComponentManager`: Gestió lògica de les llistes de fotos.
3. **UIManager**: Control de la visibilitat d'elements i modals.
4. **Web Components**:
   - `FotoComponent`: Encapsula la visualització i edició de cada foto.
   - `ImageUploadComponent`: Component unificat pel drop d'imatges.

### Flux de Dades:
1. L'usuari actua sobre la UI o un Web Component.
2. Es notifica al Manager corresponent.
3. El Manager actualitza el `StateManager`.
4. El `StateManager` notifica a tots els subscriptors (altres Managers o la UI) per reflectir el canvi.

---

## 🚀 Arquitectura Backend
Estructura RESTful organitzada per mòduls funcionals.

### Estructura de Carpetes:
- `/auth`: Controladors, rutes i middleware per a l'accés d'usuaris.
- `/reports`: Lògica per a la persistència d'informes.
- `/database`: Capa d'accés a dades (PostgreSQL).
- `/middleware`: Handlers globals (logging, errors, monitoring).
- `/utils`: Utilitats compartides (Logger, ErrorHandler).

### Seguretat:
- **JWT**: Validació de tokens en cada petició protegida.
- **Bcrypt**: Xifrat de contrasenyes.
- **Helmet & Rate Limit**: Protecció contra atacs comuns.

---

## 🗄️ Model de Dades
L'aplicació utilitza PostgreSQL. Les dades complexes dels informes es guarden com a objectes JSON en un camp de text per permetre flexibilitat en l'estructura dels informes sense canviar l'esquema de la BD.

### Taules Principals:
- `users`: Credencials i dades bàsiques.
- `user_profiles`: Configuració personalitzada (escuts, signatures).
- `reports`: Títol i el camp `report_data` (JSON).

---

## 📊 Monitorització i Logs
- **Logs**: Sistema dual. Logs de fitxer al servidor (`/app/logs`) i logs de consola/localStorage al client en mode desenvolupament.
- **Dashboard**: Vista administrativa per veure l'estat del sistema i el rendiment de les peticions en temps real.

---

*Llicència: Apache License 2.0. Desenvolupat amb assistència d'IA.*