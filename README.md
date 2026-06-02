# 🏆 Prode Mundial 2026

PWA de pronósticos para el FIFA World Cup 2026. Construida con **React + Vite + TailwindCSS + Firebase**.

---

## Índice

1. [Stack](#stack)
2. [Configurar Firebase desde cero](#1-configurar-firebase-desde-cero)
3. [Variables de entorno](#2-variables-de-entorno)
4. [Reglas de Firestore](#3-reglas-de-firestore)
5. [Generar íconos PWA](#4-generar-íconos-pwa)
6. [Correr localmente](#5-correr-localmente)
7. [Deploy en Vercel](#6-deploy-en-vercel)
8. [Hacerse admin](#7-hacerse-admin)
9. [Flujo del juego](#flujo-del-juego)
10. [Estructura del proyecto](#estructura-del-proyecto)

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite 6 |
| Estilos | TailwindCSS 3 |
| Base de datos | Firebase Firestore |
| Autenticación | Firebase Auth (email/contraseña) |
| Hosting | Vercel |
| PWA | vite-plugin-pwa + Workbox |

---

## 1. Configurar Firebase desde cero

### Paso 1 — Crear el proyecto

1. Andá a [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click en **"Agregar proyecto"**
3. Nombre: `prode-mundial-2026` (o el que prefieras)
4. Deshabilitá Google Analytics (opcional)
5. Click **"Crear proyecto"**

### Paso 2 — Habilitar Authentication

1. En el menú lateral: **Build → Authentication**
2. Click **"Comenzar"**
3. Tab **"Sign-in method"**
4. Habilitá **Correo electrónico/contraseña** → Guardar

### Paso 3 — Crear la base de datos Firestore

1. En el menú lateral: **Build → Firestore Database**
2. Click **"Crear base de datos"**
3. Elegí **"Comenzar en modo de producción"** (las reglas las configuramos después)
4. Elegí la región más cercana (ej: `us-east1` o `southamerica-east1`)
5. Click **"Listo"**

### Paso 4 — Registrar la web app y obtener la configuración

1. En **Configuración del proyecto** (ícono ⚙️ arriba a la izquierda)
2. Sección **"Tus apps"** → Click en el ícono **`</>`** (web)
3. Nombre de la app: `prode-mundial-2026-web`
4. **NO** marques Firebase Hosting (usamos Vercel)
5. Click **"Registrar app"**
6. Copiá el objeto `firebaseConfig` — lo necesitás en el próximo paso

---

## 2. Variables de entorno

Creá un archivo `.env.local` en la raíz del proyecto (nunca lo commitees):

```bash
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abc123
```

Tomá los valores del `firebaseConfig` del paso anterior.

---

## 3. Reglas de Firestore

1. En Firebase Console: **Firestore Database → Reglas**
2. Reemplazá todo el contenido con el archivo `firestore.rules` de este proyecto
3. Click **"Publicar"**

Las reglas garantizan:
- ✅ Usuarios solo pueden ver/editar sus propios pronósticos
- ✅ No se pueden cargar pronósticos después del cierre (kickoff − 10 min)
- ✅ Solo admins pueden cargar resultados y modificar partidos
- ✅ Nadie puede auto-asignarse el rol `isAdmin`

---

## 4. Generar íconos PWA

Los íconos `.png` **no** están incluidos en el repo (deben generarse):

1. Abrí `public/icons/generate-icons.html` en tu navegador
2. Hacé click en **"Descargar icon-192.png"** y **"Descargar icon-512.png"**
3. Mové ambos archivos a la carpeta `public/icons/`

> Sin estos íconos la app funciona, pero no se puede "instalar" correctamente como PWA.

---

## 5. Correr localmente

```bash
# Clonar / abrir la carpeta del proyecto
cd prode-mundial-2026

# Instalar dependencias
npm install

# Crear .env.local con tus credenciales Firebase (ver paso 2)

# Iniciar servidor de desarrollo
npm run dev
```

Abrí [http://localhost:5173](http://localhost:5173)

---

## 6. Deploy en Vercel

### Primera vez

1. Pushá el proyecto a un repo de GitHub
2. Andá a [https://vercel.com/new](https://vercel.com/new)
3. Importá el repositorio
4. Framework: **Vite** (se detecta automático)
5. **Variables de entorno**: agregá las mismas 6 variables de `.env.local`
6. Click **"Deploy"**

### Actualizaciones

Cada `git push` a `main` triggerea un deploy automático en Vercel.

### Variables de entorno en Vercel

En tu proyecto de Vercel:
**Settings → Environment Variables** → agregá:

| Nombre | Valor |
|---|---|
| `VITE_FIREBASE_API_KEY` | tu valor |
| `VITE_FIREBASE_AUTH_DOMAIN` | tu valor |
| `VITE_FIREBASE_PROJECT_ID` | tu valor |
| `VITE_FIREBASE_STORAGE_BUCKET` | tu valor |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | tu valor |
| `VITE_FIREBASE_APP_ID` | tu valor |

---

## 7. Hacerse admin

Después de crear tu cuenta en la app, necesitás setear `isAdmin: true` en Firestore:

### Opción A — Firebase Console (recomendado)

1. Firebase Console → **Firestore Database**
2. Colección `users` → buscá tu documento (el ID es tu UID)
3. Click en el campo `isAdmin` → cambiá de `false` a `true`
4. Guardá

### Opción B — Firebase CLI

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

firebase firestore:update users/TU_UID --data '{"isAdmin": true}'
```

### Cómo encontrar tu UID

1. Firebase Console → **Authentication → Users**
2. Buscá tu email → el UID aparece en la columna "ID de usuario"

---

## Flujo del juego

```
Registro → Login → Ver partidos → Cargar pronóstico (antes del cierre)
                                        ↓
                              Admin carga resultado
                                        ↓
                           Admin clickea "🧮 Pts" para calcular
                                        ↓
                          Puntos actualizados en tiempo real
                                        ↓
                               Ver tabla de posiciones
```

### Sistema de puntos

| Resultado | Puntos |
|---|---|
| Marcador exacto | 3 pts |
| Resultado correcto (ganó/empató/perdió) | 1 pt |
| Resultado incorrecto | 0 pts |

### Cierre de pronósticos

Los pronósticos se cierran automáticamente **10 minutos antes del kickoff**. El frontend muestra un countdown y bloquea el formulario. Las reglas de Firestore también lo bloquean en el backend.

---

## Estructura del proyecto

```
prode-mundial-2026/
├── public/
│   └── icons/
│       ├── favicon.svg
│       ├── icon-192.png        ← generar con generate-icons.html
│       ├── icon-512.png        ← generar con generate-icons.html
│       └── generate-icons.html
├── src/
│   ├── components/
│   │   ├── CountdownTimer.jsx  — timer por partido
│   │   ├── InstallPrompt.jsx   — banner "Agregar a inicio"
│   │   ├── LoadingSpinner.jsx
│   │   ├── MatchCard.jsx       — tarjeta de partido con pronóstico
│   │   ├── Navbar.jsx
│   │   └── ProtectedRoute.jsx  — rutas protegidas (user + admin)
│   ├── context/
│   │   └── AuthContext.jsx     — estado global de auth
│   ├── firebase/
│   │   ├── config.js           — inicialización Firebase
│   │   ├── auth.js             — register / login / logout
│   │   ├── firestore.js        — todas las queries
│   │   └── seedData.js         — 48 partidos + knockouts
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── HomePage.jsx        — partidos por fase/grupo
│   │   ├── MyPredictionsPage.jsx
│   │   ├── LeaderboardPage.jsx — tabla en tiempo real
│   │   └── AdminPage.jsx       — cargar resultados, seed data
│   ├── utils/
│   │   └── scoring.js          — lógica de puntos y fechas
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── firestore.rules
├── vite.config.js              — config PWA incluida
├── tailwind.config.js
├── .env.example
└── README.md
```

---

## Colecciones Firestore

| Colección | Descripción |
|---|---|
| `users/{uid}` | Perfil, puntos, isAdmin |
| `usernames/{username}` | Índice de unicidad de usernames |
| `matches/{id}` | Partidos, resultados, stage |
| `predictions/{id}` | Pronósticos por usuario/partido |

---

## PWA — Instalación en móvil

### Android (Chrome)
- Aparece automáticamente el banner "Instalar app"
- O: menú ⋮ → "Agregar a pantalla de inicio"

### iPhone / iPad (Safari)
- Tocá el botón **Compartir** (cuadrado con flecha ↑)
- Seleccioná **"Agregar a pantalla de inicio"**
- La app queda instalada con ícono propio, sin barra del navegador

---

## Licencia

MIT — Libre para uso personal y educativo.
