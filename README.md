# 📚 LectorApp - Florecillas de San Francisco

Aplicación móvil desarrollada en **React Native (Expo)** diseñada para la lectura fluida y accesible del libro "Las Florecillas de San Francisco".

La app prioriza la experiencia de usuario con una interfaz limpia, opciones de accesibilidad y funcionalidades offline.

## 📱 Funcionalidades Principales

* **📖 Lectura Nativa:** Interfaz optimizada con navegación fluida entre capítulos.
* **🌙 Modos de Visualización:**
    * **Modo Día:** Fondo claro con tipografía en color Bordó (#691a35) para una lectura elegante.
    * **Modo Noche:** Fondo oscuro con tipografía en Verde Suave (#81c784) para descanso visual.
* **🔊 Audiolibro (TTS):** Lectura por voz integrada (Text-to-Speech) que funciona sin internet.
    * *Indicador visual:* Resaltado sutil del capítulo que se está escuchando actualmente.
* **⭐ Marcadores:** Sistema de favoritos para guardar capítulos clave.
* **🔎 Ajustes de Texto:** Control de tamaño de fuente (A+ / A-) y texto justificado.
* **💰 Integración de Publicidad:** Espacios preparados para Google AdMob (Banners).

## 🛠️ Tecnologías Usadas

* **Core:** React Native / Expo SDK 52.
* **Navegación:** Expo Router.
* **Almacenamiento:** AsyncStorage (Persistencia de configuración y lectura).
* **Audio:** Expo Speech (Síntesis de voz nativa).
* **UI:** StyleSheet nativo con diseño responsivo.

## 🚀 Cómo ejecutar el proyecto

1.  **Clonar el repositorio:**
    ```bash
    git clone <url-del-repositorio>
    cd lectorapp
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Correr en desarrollo:**
    ```bash
    npx expo start
    ```
    *Escanea el código QR con la app **Expo Go** en tu celular Android/iOS.*

4.  **Generar APK (Android):**
    ```bash
    eas build -p android --profile preview
    ```

## 📄 Licencia

Este proyecto es una **traducción libre de derechos de autor** del texto clásico.
Desarrollado por Lugo Martin como solución tecnológica de lectura digital.