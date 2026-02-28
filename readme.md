Markdown
# ⚽ Futbol Connect - Match to Match

Aplicación integral para la gestión de partidos de fútbol, retos entre clubes y administración de recintos deportivos. Este proyecto utiliza una arquitectura de microservicios modernizada y totalmente containerizada.

## 🏗️ Arquitectura del Sistema

El proyecto se despliega mediante **Docker Compose**, lo que garantiza que todos los servicios funcionen en cualquier entorno con las versiones exactas de software necesarias:

* **mtm-frontend**: Interfaz de usuario construida con React y Vite.
* **mtm-backend**: API REST asíncrona desarrollada en FastAPI (Python).
* **mtm-db**: Base de datos NoSQL MongoDB para persistencia de datos.

---

## 🚀 Instalación y Ejecución

Para levantar el entorno completo de desarrollo, sigue estos pasos:

1. **Clonar el repositorio:**
   ```bash
   git clone [https://github.com/tu-usuario/futbol-connectapp.git](https://github.com/tu-usuario/futbol-connectapp.git)
   cd futbol-connectapp
Desplegar con Docker:

Bash
docker-compose up -d --build
Acceso a los servicios:

Frontend: http://localhost:5173

Backend API: http://localhost:8000

Documentación Interactiva (Swagger): http://localhost:8000/docs

🛠️ Mejoras Técnicas Recientes (Post-Commit 1913d78)
Tras el último commit, se han implementado las siguientes correcciones críticas para la estabilidad del sistema:

Estabilización de Dependencias: Se fijaron las versiones de motor y pymongo en el requirements.txt para resolver conflictos de compatibilidad que impedían el arranque del contenedor.

Orquestación de Redes Docker: Se corrigió la comunicación entre servicios. El backend ahora localiza la base de datos mediante el nombre de servicio mtm-db en lugar de localhost, permitiendo una conexión estable dentro de la red virtual de Docker.

Optimización de Conexión: Se implementaron Timeouts (serverSelectionTimeoutMS) en el cliente de base de datos para evitar que la aplicación se cuelgue si los servicios arrancan en tiempos diferentes.

Corrección de CORS: Se habilitaron los permisos necesarios para que el Frontend pueda consumir la API sin bloqueos de seguridad del navegador.

📁 Estructura de Carpetas
Plaintext
.
├── docker-compose.yml         # Configuración de los 3 contenedores
├── backend/
│   ├── app/
│   │   ├── main.py            # Endpoints y lógica de negocio
│   │   └── database.py        # Configuración de conexión asíncrona
│   └── requirements.txt       # Librerías de Python fijadas
└── frontend/
    ├── src/                   # Componentes de React
    └── Dockerfile             # Configuración de imagen Vite
Desarrollado con FastAPI, React y MongoDB.