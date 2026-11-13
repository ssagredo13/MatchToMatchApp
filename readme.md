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

## 🔐 Autenticación en desarrollo local
Que Google Auth funcione en producción no configura automáticamente el entorno local: Vercel y Vite local leen variables de entorno distintas. Para probar en local:

1. En `frontend/.env`, configura `VITE_GOOGLE_CLIENT_ID` con el Client ID de tipo Web de Google OAuth usado por la aplicación. El Client ID no es una clave secreta; la seguridad depende de restringir sus orígenes autorizados y de verificar la credencial en el backend.
2. En Google Cloud Console, agrega `http://localhost:5173` a **Authorized JavaScript origins** del mismo cliente OAuth. Abre la app con `http://localhost:5173` (no `127.0.0.1`, porque el origen debe coincidir exactamente).
3. En `backend/.env`, configura el mismo `GOOGLE_CLIENT_ID` y un `AUTH_SECRET_KEY` de al menos 32 caracteres. No copies el secreto al frontend ni lo compartas en el repositorio.
4. Inicia el backend en `localhost:8000`; el frontend local ya apunta a esa dirección mediante `VITE_API_URL`. El backend también debe poder conectarse a MongoDB.
5. Reinicia Vite después de cambiar `frontend/.env`, porque Vite carga esas variables al arrancar.

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
El dashboard prioriza un radar responsive con los partidos futuros y de hoy, búsqueda por equipo/recinto y filtros por estado. La ubicación del dispositivo es opcional: solo se solicita cuando el usuario pulsa **Cerca de mí**, se mantiene en memoria en el navegador y se usa para ordenar/calcular distancias aproximadas; si se deniega, el mapa conserva Talca como centro. Cuando se comparte la ubicación, se priorizan los partidos cercanos y se advierte si un partido supera el radio recomendado de 25 km, pero esto no bloquea la solicitud para unirse. El filtro de distancia es opcional y puede volver a **Cualquier distancia**. Los partidos se muestran con sus coordenadas guardadas y la ubicación del jugador no se envía a la API.

## ✅ Persistencia, confirmaciones y logs
MongoDB es la fuente de verdad de usuarios, equipos, partidos y avisos. El login hace upsert por email con índice único; la creación de partidos acepta `Idempotency-Key` para que reintentos de red no creen duplicados. Las fechas/horas de partidos se validan en backend contra el instante actual, interpretando el horario local con el offset del navegador y guardando también `scheduledAt` en UTC.

Las inscripciones se actualizan de forma atómica en un solo documento: el filtro exige un partido abierto, un cupo disponible y que el usuario no esté inscrito; el conteo, la lista de inscritos y el cierre al completar cupos se actualizan juntos. La aceptación de un desafío rival también usa una actualización condicional para que solo un equipo gane; los demás reciben HTTP 409. Los botones se bloquean durante la operación, pero la regla definitiva siempre se aplica en el backend.

El backend emite logs JSON a `stdout`, que Render centraliza por servicio. Cada solicitud tiene un `X-Request-ID` para encontrar el error correspondiente; las respuestas 5xx muestran ese identificador de referencia en el frontend. Se registran estados y errores de operaciones, pero no tokens, credenciales, correos ni cuerpos de solicitudes. En Render, buscar por `request_id` o por eventos como `match.join.conflict`, `match.challenge.conflict` y `database.request.failed`. Estos logs operacionales no son un historial de auditoría permanente: si se requiere retención propia de negocio, debe diseñarse una colección de auditoría con política de acceso y retención explícita.

El mapa usa las capas públicas oscuras de Esri (base y referencias), sin API key; la disponibilidad y el uso están sujetos a los términos vigentes de Esri. Se conserva la atribución requerida por la fuente. Es una alternativa para el MVP, no una garantía de disponibilidad ni de uso gratuito ilimitado; revisa los [términos de Esri](https://www.esri.com/en-us/legal/terms) antes de escalar el tráfico. Si el uso aumenta, migra a un proveedor con plan y límites adecuados. No precargues mosaicos ni automatices descargas.

La sala de espera del radar incluye una ilustración vectorial original de un rondo. El silbato es un efecto sintetizado por Web Audio, sin muestras de videojuegos ni archivos de terceros; se mantiene apagado hasta que el usuario lo activa y puede desactivarse en cualquier momento. El historial usa filas compactas expandibles con teclado, toque o hover.

## 🗺️ Roadmap producto: necesidades urgentes de cancha
La primera versión de avisos rápidos está disponible en el Dashboard y permite publicar `Busco rival`, `Necesito jugadores`, `Busco arquero` y `Cancha disponible`. Los avisos se guardan en la colección MongoDB `avisos`, requieren sesión, vencen a la hora indicada (máximo 30 días) y su autor puede retirarlos. Incluyen ubicación, fecha/hora, detalle opcional, cupos o precio según el tipo. Partidos y avisos geolocalizados aparecen juntos en el radar, con filtros para partidos, necesidades y canchas libres, búsqueda y distancia opcional. Los avisos son una entidad separada de los partidos; por ahora no exponen correos ni implementan respuestas/contacto.

Próximas fases:

1. **Respuesta a avisos:** mecanismo para responder/contactar sin exponer datos personales; sumar filtros horarios avanzados y priorización por urgencia.
2. **Moderación y prevención de abuso:** verificación de recintos, reporte/bloqueo, límites de publicación y herramientas administrativas.
3. **Notificaciones dentro de la app:** centro de actividad y preferencias por tipo de necesidad; deduplicación, vencimiento y estado leído.
4. **Push web/PWA:** Web Push con service worker y claves VAPID, solo tras permiso explícito. Debe existir una alternativa in-app si el navegador no soporta push.
5. **Correo:** avisos transaccionales y resumen configurable con proveedor SMTP/API, bajas y registro de consentimiento.
6. **WhatsApp:** integración solo mediante WhatsApp Business Platform/proveedor autorizado, opt-in verificable, plantillas aprobadas y control de costos/límites. No automatizar cuentas personales, grupos ni WhatsApp Web.

Antes de habilitar canales externos se definirán responsable del recinto, verificación de publicaciones, consentimiento por canal, retención de datos, ventanas silenciosas, frecuencia máxima y tarifas del proveedor. Prioridad de MVP: necesidades rápidas + radar + notificación in-app; luego PWA push/email; WhatsApp queda condicionado a consentimiento, aprobación y presupuesto comercial.

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
 
