# ⚽ Marcador LED Ultra Premium — C.D. Peña Azagresa

Sistema profesional de videomarcador LED diseñado específicamente para el C.D. Peña Azagresa, con soporte para control remoto, sincronización en tiempo real y animaciones cinemáticas.

## 🚀 Características Principales

- **Diseño Ultra Premium**: Estética moderna con glassmorphism, gradientes neón y tipografía optimizada para pantallas LED.
- **Control Remoto (PeerJS)**: Controla el marcador desde un móvil o tablet sin necesidad de servidor central.
- **Sincronización en Tiempo Real**: Los cambios se reflejan instantáneamente en la pantalla del estadio.
- **Doble Modo de Campo**: Soporte para 1 partido de Fútbol 11 o 2 partidos simultáneos de Fútbol 8.
- **Gestión de Plantillas**: Carga de jugadores desde un catálogo predefinido con búsqueda instantánea.
- **Gráficos Profesionales**: Animaciones de GOL personalizadas, sustituciones, alineaciones y tarjetas.
- **Autenticación**: Acceso protegido por contraseña o integración con Supabase.

## 🛠️ Instalación y Despliegue

### 1. Despliegue Rápido (GitHub Pages)
El sistema ya está desplegado y es accesible en:
**👉 [https://cdpazagresa-stack.github.io/Precioled/](https://cdpazagresa-stack.github.io/Precioled/)**

### 2. Configuración de Autenticación
Por defecto, el sistema usa una contraseña maestra: `azagresa2024`.
Para usar **Supabase** (recomendado para producción):
1. Crea un proyecto en [Supabase](https://supabase.com).
2. Crea una tabla `match_state` o usa la integración de autenticación.
3. Actualiza las constantes en `js/auth.js` o crea un archivo `js/config.js`.

### 3. Uso del Control Remoto
1. Abre el panel de control (`index.html`) en tu dispositivo móvil.
2. Abre la pantalla del marcador (`display.html`) en el ordenador conectado al LED.
3. En el marcador aparecerá un ID (ej: `SALA-1234`).
4. Introduce ese ID en el panel de control para vincularlos.

## 📁 Estructura del Proyecto

- `index.html`: Panel de control para el operador.
- `display.html`: Vista optimizada para la pantalla LED del estadio.
- `css/`: Estilos ultra premium y animaciones.
- `js/`: Lógica de sincronización, temporizadores y renderizado.
- `assets/escudos/`: Directorio para los escudos de los equipos.

## ⚖️ Licencia
Privado para el C.D. Peña Azagresa.

---
*Desarrollado con ❤️ por Antigravity*
