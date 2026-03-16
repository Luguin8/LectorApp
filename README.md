# 📖 Florecillas de San Francisco — Ebook App

Aplicación móvil de lectura (ebook reader) construida con **React Native + Expo**, que ofrece una experiencia de lectura inmersiva de textos espirituales de dominio público. El proyecto está actualmente publicado y gestionado en **Google Play Store**.

---

## 🛠️ Tecnologías y Stack

| Tecnología | Versión | Rol |
|---|---|---|
| React Native | 0.81.5 | Framework base de la aplicación |
| Expo SDK | ~54.0.30 | Toolchain, build y acceso a APIs nativas |
| Expo Router | ~6.0.21 | Navegación declarativa basada en el sistema de archivos |
| Context API | (React 19) | Gestión de estado global del lector |
| AsyncStorage | 2.2.0 | Persistencia local de preferencias y progreso |
| expo-speech | ~14.0.8 | Text-to-Speech nativo (accesibilidad) |
| react-native-google-mobile-ads | ^16.0.1 | Monetización con AdMob (Banner y Rectángulo) |
| EAS Build / EAS Submit | >= 7.0.0 | CI/CD para compilación y publicación |
| Expo Google Fonts (Merriweather) | ^0.4.2 | Tipografía editorial optimizada para lectura |

> La aplicación también soporta la plataforma **Web** mediante `react-native-web`, con un componente `AdBanner` específico para ese entorno.

---

## ✨ Funcionalidades Principales

### 📚 Biblioteca dinámica
La lista de libros disponibles se carga desde un archivo `data/biblioteca.json`. Esto desacopla el catálogo del código de la UI: agregar un nuevo libro no requiere modificar pantallas, sino registrarlo en el JSON y en el mapa `utils/bookLoader.js`.

### 🔊 Text-to-Speech nativo (Accesibilidad)
El lector integra **`expo-speech`** para narrar el capítulo visible en pantalla. Se implementó un algoritmo de chunking de texto que divide el contenido en fragmentos de hasta 3.000 caracteres, respetando los límites de palabras, para superar la restricción de longitud de la API nativa de Speech. La narración se lanza en cadena por chunks y el estado (`isSpeaking`) se mantiene sincronizado con los callbacks `onDone`, `onStopped` y `onError` de cada fragmento.

### 💾 Persistencia de preferencias y progreso
A través del `ReaderContext`, se persisten en `AsyncStorage` las siguientes preferencias del usuario:
- **Tema**: Modo Día / Modo Noche.
- **Tamaño de fuente**: Ajuste dinámico entre 12px y 34px.
- **Alineación de texto**: Izquierda o Justificado.
- **Último capítulo leído**: Al reabrir el libro, se hace scroll automático al último capítulo visitado.
- **Marcadores (Favoritos)**: Sistema de bookmarks por capítulo y por libro.

### 🌙 Tema Día / Noche
El tema se aplica de forma reactiva en toda la aplicación. El lector utiliza una paleta de colores derivada del estado del tema, calculada en tiempo de render, sin necesidad de librerías externas de theming.

### 📐 Diseño adaptable (Responsive)
La UI se adapta dinámicamente al tamaño de pantalla usando `useWindowDimensions`:
- En pantallas **>600px** (landscape o tablet): la biblioteca se muestra en 2 columnas y el modal del índice se centra con ancho fijo.
- El padding horizontal del contenido del lector se calcula proporcionalmente al ancho de la pantalla para mejorar la legibilidad en tablets.

### 🏷️ Índice de capítulos y Favoritos
Un modal deslizable desde abajo permite al usuario navegar directamente a cualquier capítulo. Incluye un filtro de **solo favoritos**, que muestra únicamente los capítulos marcados con estrella.

### 💰 Monetización con AdMob
Se integran anuncios Banner (cabecera del lector) y Rectángulo Medio (intercalados cada 5 capítulos). El componente `AdBanner` gestiona los errores de carga de forma silenciosa: si un anuncio falla, se renderiza `null` sin romper el layout.

---

## 🏗️ Arquitectura y Patrones de Diseño

### File-Based Routing (Expo Router)
La navegación es completamente declarativa y basada en el sistema de archivos bajo el directorio `app/`. Expo Router mapea cada archivo a una ruta, eliminando la necesidad de un Stack de navegación configurado manualmente.

```
app/
├── _layout.js       # Root layout: envuelve la app con ReaderProvider y Stack Navigator
├── index.js         # Pantalla: Biblioteca (lista de libros desde JSON)
├── privacy.js       # Pantalla: Política de Privacidad
└── reader/
    └── [id].js      # Pantalla dinámica: Lector de libro (parámetro: ID del libro)
```

### Context API como capa de estado global
El estado del lector (tema, fuente, marcadores, progreso) vive en `ReaderContext`. Este patrón evita el prop drilling y mantiene la lógica de negocio desacoplada de los componentes de UI. Toda la persistencia en `AsyncStorage` se orquesta desde este contexto, con carga paralela de claves mediante `Promise.all` al inicializar.

```
context/
└── ReaderContext.js  # createContext + Provider + hook personalizado (useReader)
```

### Hook personalizado (`useReader`)
Se expone un hook `useReader()` que encapsula el acceso al contexto, haciendo que el consumo en componentes sea limpio y sin referencias directas a `useContext`.

### Registro de libros como mapa de módulos
El archivo `utils/bookLoader.js` actúa como un **registro estático de recursos**, mapeando el `id` de cada libro con su archivo JSON local (cargado vía `require`). Esto permite que Expo empaquete los assets correctamente en el bundle y garantiza que agregar un nuevo libro sea un cambio de una sola línea.

```
utils/
└── bookLoader.js     # { libro1: require('../assets/books/libro1.json'), ... }
```

### Plataform-specific components
El componente `AdBanner` utiliza el mecanismo de resolución de plataforma de React Native/Expo:
- `AdBanner.js`: Renderiza un `BannerAd` real de Google Mobile Ads (para Android/iOS).
- `AdBanner.web.js`: Renderiza un placeholder o un banner alternativo para la versión Web, evitando errores de importación de módulos nativos.

### Refs estables para callbacks de FlatList
Para evitar re-renders innecesarios del `FlatList` del lector (que maneja potencialmente cientos de ítems), el callback `onViewableItemsChanged` se encapsula en un `useRef`, siguiendo la limitación documentada de la API de React Native donde este prop no puede cambiar entre renders.

---

## 🚀 Instalación y Ejecución Local

### Prerrequisitos
- Node.js >= 18
- Expo CLI: `npm install -g expo-cli`
- EAS CLI (para builds): `npm install -g eas-cli`

### Pasos

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd LectorApp

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo
npx expo start

# 4. Escanear el QR con Expo Go (Android/iOS) o presionar 'a' para abrir en emulador Android
```

### Builds con EAS

El proyecto utiliza **Expo Application Services (EAS)** para gestionar el ciclo de vida de los builds. Los perfiles están definidos en `eas.json`:

```bash
# Build de desarrollo (APK interno para testing)
eas build --profile preview --platform android

# Build de producción (AAB para Google Play Store)
eas build --profile production --platform android

# Enviar a Google Play Store
eas submit --platform android
```

---

## 📦 Estado del Proyecto

La aplicación se encuentra **publicada en Google Play Store** bajo el paquete `com.juliana.florecillas` (versión `1.1.0`, versionCode `11`).

El ciclo de publicación está completamente gestionado mediante **EAS Build** y **EAS Submit**, que compilan el `.aab` (Android App Bundle) optimizado y lo envían directamente a la Play Console. El proyecto está configurado con `edgeToEdgeEnabled: true` para cumplir con los requisitos de la nueva arquitectura de diseño de Android y con permisos mínimos necesarios, bloqueando explícitamente accesos a almacenamiento externo innecesarios.

---

## 📁 Estructura del Proyecto

```
LectorApp/
├── app/                    # Rutas y pantallas (Expo Router)
│   ├── _layout.js
│   ├── index.js            # Pantalla Biblioteca
│   ├── privacy.js          # Política de Privacidad
│   └── reader/[id].js      # Lector dinámico
├── assets/                 # Íconos, splash y archivos de libros (JSON)
│   └── books/
│       └── libro1.json
├── components/
│   ├── AdBanner.js         # Componente de anuncio (nativo)
│   └── AdBanner.web.js     # Componente de anuncio (web)
├── context/
│   └── ReaderContext.js    # Estado global del lector
├── data/
│   └── biblioteca.json     # Catálogo de libros disponibles
├── utils/
│   └── bookLoader.js       # Mapa de IDs a archivos de libros
├── app.json                # Configuración de Expo
├── eas.json                # Perfiles de build y submit (EAS)
└── package.json
```