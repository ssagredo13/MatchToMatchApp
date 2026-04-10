# ⚽ Match to Match (v2.1)

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

## 🤖 Co-Desarrollo con Inteligencia Artificial
Este proyecto ha sido optimizado y co-desarrollado utilizando **Gemini 3 Flash**. La IA actuó como un colaborador estratégico en:
* Refactorización crítica de componentes React.
* Diseño de lógica de seguridad en el frontend.
* Optimización de flujos de datos asíncronos en FastAPI.

## 🚀 Instalación y Desarrollo Local
Para fines de mantenimiento autorizado o auditoría interna, el entorno se gestiona mediante **Docker Compose**:

1. **Clonar el repositorio:**
   ```bash
   git clone [https://github.com/ssagredo13/MatchToMatchApp.git](https://github.com/ssagredo13/MatchToMatchApp.git)
   
Levantar servicios:

Bash
docker-compose up -d --build
📁 Estructura del Proyecto
Plaintext
.
├── backend/           # API FastAPI (Hospedado en Render)
├── frontend/          # React 18 (Hospedado en Vercel)
└── docker-compose.yml # Orquestación de red local

📧 Contacto para Licencias: ssagredo13@gmail.com | correlavozchile@gmail.com

Propiedad de Correlavoz Chile.
 
