# ⚽ Futbol Connect - Match to Match (v2.1)

> ### ⚖️ AVISO DE PROPIEDAD INTELECTUAL Y RESERVA DE DERECHOS
> **© 2026 Correlavoz Chile - Todos los derechos reservados.**
> 
> Este software, incluyendo su código fuente, diseño de interfaz, arquitectura de datos y algoritmos, es propiedad exclusiva de **Sebastián J. Sagredo Sáez**. 
> 
> Queda estrictamente prohibida la reproducción, copia, comunicación pública, distribución, ingeniería inversa o cualquier otra forma de explotación de este código, total o parcialmente, sin la autorización previa, expresa y por escrito del titular. 
> 
> El uso no autorizado de este material constituye una infracción a la **Ley N° 17.336 sobre Propiedad Intelectual (Chile)** y a los tratados internacionales de Derechos de Autor (Convenio de Berna).

---

## 🏗️ Arquitectura del Sistema
El ecosistema **Match to Match** utiliza una arquitectura de nube híbrida optimizada para alto rendimiento:
* **Frontend (UI):** Desplegado en **Vercel** (React 18 + Vite).
* **Backend (API):** Hospedado en **Render** (FastAPI / ASGI).
* **Database:** Cluster distribuido en **MongoDB Atlas**.

## 🛠️ Mejoras de Ingeniería (v2.1)
* **Shield Logic:** Implementación de capas de bloqueo físico (`z-index: 100`) para protección de datos históricos.
* **Validación Temporal Real-Time:** Algoritmo de expiración automática en el cliente (`ahora > fecha_partido`).
* **Clean Code Refactor:** Reducción del 36% en líneas de código, optimizando el rendimiento y la mantenibilidad.

## 🚀 Instalación y Desarrollo Local
Para fines de mantenimiento autorizado o auditoría interna, el entorno se gestiona mediante **Docker Compose**:

1. **Clonar y configurar:**
   ```bash
   git clone [https://github.com/tu-usuario/futbol-connectapp.git](https://github.com/tu-usuario/futbol-connectapp.git)
Levantar servicios:

Bash
docker-compose up -d --build
📁 Estructura del Proyecto
Plaintext
.
├── backend/           # API FastAPI (Hospedado en Render)
├── frontend/          # React 18 (Hospedado en Vercel)
└── docker-compose.yml # Orquestación local
Contacto para Licencias: ssagredo13@gmail.com / correlavhozchile@gmail.com

Propiedad de Correlavoz Chile.


---

### ¿Por qué este formato?
1.  **El Bloque de Cita (`>`):** Visualmente separa el aviso legal del resto del contenido técnico, dándole importancia inmediata.
2.  **Menciones Legales Específicas:** Citar la **Ley 17.336** y el **Convenio de Berna** envía un mensaje claro de que conoces tus derechos y estás dispuesto a ejercerlos.
3.  **Copyright dinámico:** Al incluir el año y tu nombre/marca, estableces una línea base para cualquier disputa de autoría futura.

Con esto en el encabezado, tu código queda bajo una declaración de privacidad explícita desde el segu
