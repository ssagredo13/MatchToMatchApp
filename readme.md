# ⚽ Match to Match (v2.2)

> ### ⚖️ AVISO DE PROPIEDAD INTELECTUAL Y RESERVA DE DERECHOS
> **© 2026 Correlavoz Chile - Todos los derechos reservados.**
> 
> Este software, incluyendo su código fuente, diseño de interfaz, arquitectura de datos y algoritmos, es propiedad exclusiva de **Sebastián J. Sagredo Sáez**. 
> 
> Queda estrictamente prohibida la reproducción, copia, comunicación pública, distribución, ingeniería inversa o cualquier otra forma de explotación de este código, total o parcialmente, sin la autorización previa, expresa y por escrito del titular. 
> 
> El uso no autorizado de este material constituye una infracción a la **Ley N° 17.336 sobre Propiedad Intelectual (Chile)** y a los tratados internacionales de Derechos de Autor (Convenio de Berna).

---

## 🌍 Despliegue en Producción
La aplicación se encuentra operativa y optimizada en:
* **🚀 URL Live:** [https://match-to-match-app.vercel.app/](https://match-to-match-app.vercel.app/)

## 🏗️ Arquitectura del Sistema
El ecosistema **Match to Match** utiliza una arquitectura de nube híbrida de alto rendimiento:
* **Frontend (UI):** Desplegado en **Vercel** (React 18 + Vite).
* **Backend (API):** Hospedado en **Render** (FastAPI / ASGI).
* **Database:** Cluster distribuido en **MongoDB Atlas**.

## 🛠️ Mejoras de Ingeniería (v2.1)
* **Shield Logic:** Implementación de capas de bloqueo físico (`z-index: 100`) para protección de datos históricos e interceptación de eventos no autorizados.
* **Validación Temporal Real-Time:** Algoritmo de expiración automática en el cliente (`ahora > fecha_partido`) que bloquea la gestión de encuentros pasados.
* **Clean Code Refactor:** Reducción del **36% en líneas de código** en componentes core, optimizando el renderizado y la mantenibilidad.
* **Integración Cloud:** Orquestación de servicios asíncronos para minimizar latencia entre el cliente y la base de datos distribuida.

## 📍 Radar de partidos
El dashboard prioriza un radar responsive con los partidos futuros y de hoy, búsqueda por equipo/recinto y filtros por estado. La ubicación del dispositivo es opcional: solo se solicita cuando el usuario pulsa **Cerca de mí**, se mantiene en memoria en el navegador y se usa para ordenar/calcular distancias aproximadas; si se deniega, el mapa conserva Talca como centro. Los partidos se muestran con sus coordenadas guardadas y los cambios de ubicación no se envían a la API.

El mapa usa las capas públicas oscuras de Esri (base y referencias), sin API key; la disponibilidad y el uso están sujetos a los términos vigentes de Esri. Se conserva la atribución requerida por la fuente. Es una alternativa para el MVP, no una garantía de disponibilidad ni de uso gratuito ilimitado; revisa los [términos de Esri](https://www.esri.com/en-us/legal/terms) antes de escalar el tráfico. Si el uso aumenta, migra a un proveedor con plan y límites adecuados. No precargues mosaicos ni automatices descargas.

La sala de espera del radar incluye una ilustración vectorial original de un rondo. El silbato es un efecto sintetizado por Web Audio, sin muestras de videojuegos ni archivos de terceros; se mantiene apagado hasta que el usuario lo activa y puede desactivarse en cualquier momento. El historial usa filas compactas expandibles con teclado, toque o hover.

## 🤖 Co-Desarrollo con Inteligencia Artificial
Este proyecto ha sido optimizado y co-desarrollado utilizando **Gemini 3 Flash**. La IA actuó como un colaborador estratégico en:
* Refactorización crítica de componentes React.
* Diseño de lógica de seguridad en el frontend.
* Optimización de flujos de datos asíncronos en FastAPI.

## 🚀 Instalación y Desarrollo Local
Para fines de mantenimiento autorizado o auditoría interna, el entorno se gestiona mediante **Docker Compose**:

1. Copiar `.env.example` a `.env` y completar `GOOGLE_CLIENT_ID` y `AUTH_SECRET_KEY`. Generar una clave de sesión aleatoria de al menos 32 caracteres; no reutilizar claves de Google ni MongoDB.
2. Configurar el mismo OAuth Client ID en `GOOGLE_CLIENT_ID` y `VITE_GOOGLE_CLIENT_ID`.
3. Ejecutar `docker compose up --build`.

El backend autentica el ID token de Google, crea/actualiza el usuario en MongoDB y devuelve una sesión firmada de corta duración. Las llamadas a equipos, partidos e instalaciones requieren esa sesión. `ALLOWED_ORIGINS` acepta una lista separada por comas de orígenes exactos; en producción debe contener el dominio HTTPS del frontend, sin comodines.

En Render configura `MONGO_URL`, `DB_NAME`, `GOOGLE_CLIENT_ID`, `AUTH_SECRET_KEY`, `ADMIN_EMAILS` (opcional), `ALLOWED_ORIGINS` y `PRODUCTION_FRONTEND_ORIGIN`. CORS incluye siempre el origen exacto de `PRODUCTION_FRONTEND_ORIGIN` además de `ALLOWED_ORIGINS`. En Vercel configura `VITE_API_URL` con la URL HTTPS de Render y `VITE_GOOGLE_CLIENT_ID`. Las variables `VITE_*` se publican en el cliente; la clave de Maps debe restringirse por dominio y API y nunca considerarse secreta.

`VITE_API_URL` debe ser el origen del servicio Render, por ejemplo `https://nombre-del-servicio.onrender.com`; no uses `localhost` ni añadas `/api`. El cliente elimina automáticamente un `/api` final para evitar rutas duplicadas. Si Render informa `bad auth: authentication failed`, actualiza `MONGO_URL` en Render con el usuario y contraseña vigentes de MongoDB Atlas; codifica como URL los caracteres especiales de las credenciales. Confirma también que el usuario Atlas tenga permisos de lectura/escritura y que el acceso de red permita conexiones desde Render. Después de guardar variables de entorno en Vercel, vuelve a desplegar para que Vite las incorpore al build.

Los archivos `.env` locales están excluidos de Git y de las imágenes Docker. Si una clave estuvo versionada o compartida, rotarla no elimina su exposición de la historia: revocarla y revisar el historial antes del despliegue.
📁 Estructura del Proyecto
Plaintext
.
├── backend/           # API FastAPI (Hospedado en Render)
├── frontend/          # React 18 (Hospedado en Vercel)
└── docker-compose.yml # Orquestación de red local

📧 Contacto para Licencias: ssagredo13@gmail.com | correlavozchile@gmail.com

Propiedad de Correlavoz Chile.
 
