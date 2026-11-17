# Consumo MicroServicio · Gestor de Productos y Ventas

Aplicación web desarrollada con **Vue.js 3** y **Vite** para el consumo y administración del microservicio REST (desarrollado con **Spring Boot** y **PostgreSQL**). Permite gestionar el catálogo de productos y el registro de ventas bajo una arquitectura maestro-detalle mediante operaciones CRUD y reactividad en tiempo real.

---

## Autor

- **Nombre:** Rodríguez Juárez José Daniel
- **Número de control:** 22161222
- **Institución:** Instituto Tecnológico de Oaxaca
- **Materia:** Desarrollo de Servicios Web

---

## Características

- **Dashboard interactivo:** Navegación fluida y centralizada mediante barra lateral (*Sidebar*).
- **Gestión de Catálogo de Productos:**
  - Listado general con visualización de ID, nombre, descripción, precio unitario, stock disponible y estado (*En stock* / *Agotado*).
  - Búsqueda reactiva por nombre del producto.
  - Filtro dinámico por disponibilidad de inventario (*Todos*, *Con stock disponible*, *Agotados*).
  - Modal interactivo para alta y edición de productos con validaciones de formulario (longitud de caracteres, precio positivo y stock numérico).
  - Eliminación de productos con confirmación y retroalimentación inmediata.
- **Gestión de Ventas (Maestro-Detalle):**
  - Registro de ventas con múltiples productos y cantidades independientes.
  - Validación de inventario en tiempo real: impide vender cantidades superiores al stock disponible.
  - Cálculo automático de subtotales por renglón y total acumulado de la venta.
  - Descuento automático de stock en el microservicio al procesar la venta.
  - Listado de ventas con folio (#ID), fecha de transacción, conteo de productos adquiridos y total monetario.
  - Búsqueda por folio (#ID) o nombre de producto.
  - Modal de consulta detallada (*Ver Detalle*) que desglosa los productos comprados, cantidades, precios unitarios históricos y subtotales.
  - Cancelación/eliminación de ventas con restitución automática del stock al inventario.
- **Arquitectura Frontend y Reactividad:**
  - **Composable reutilizable (`useCrud`):** Abstracción y centralización de operaciones HTTP asíncronas (`GET`, `POST`, `PUT`, `DELETE`).
  - **Cliente Axios centralizado (`apiClient`):** Gestión de cabeceras, URL base y configuración mediante variables de entorno (`.env`).
  - **Sistema de notificaciones flotantes (*Toast alerts*):** Alertas visuales con temporizador de cierre automático para confirmación de transacciones y manejo amigable de errores devueltos por el backend.

---

## Estructura de archivos

```text
22161222_RodriguezJJoseD_FrontVue/
├── public/
│   └── favicon.ico                   # Ícono de la aplicación
├── src/
│   ├── composables/
│   │   └── useCrudComposables.js     # Composable reutilizable para operaciones CRUD con Axios
│   ├── icons/                        # Componentes modales y elementos de interfaz
│   │   ├── pedidoFormModal.components.vue   # Modal auxiliar de formulario
│   │   ├── productoFormModal.components.vue # Modal para registro y edición de productos
│   │   ├── sidebar.components.vue           # Barra lateral de navegación principal
│   │   └── ventaFormModal.components.vue    # Modal interactivo maestro-detalle para ventas
│   ├── router/
│   │   └── index.js                  # Definición de rutas (/productos, /ventas)
│   ├── services/
│   │   └── apiClient.js              # Configuración e instancia global de Axios
│   ├── stores/
│   │   └── counter.js                # Tienda de estado Pinia
│   ├── views/
│   │   ├── productos.views.vue       # Vista principal para administración de productos
│   │   └── ventas.views.vue          # Vista principal para historial y control de ventas
│   ├── __tests__/
│   │   └── App.spec.js               # Pruebas unitarias de la aplicación
│   ├── App.vue                       # Componente raíz con layout principal
│   └── main.js                       # Punto de entrada de la aplicación Vue
├── .editorconfig                     # Reglas de formato del editor
├── .env                              # Variables de entorno (URL base de la API)
├── .gitignore                        # Archivos y carpetas ignorados por Git
├── eslint.config.js                  # Configuración de ESLint para calidad de código
├── index.html                        # Plantilla HTML base
├── jsconfig.json                     # Configuración de resolución de módulos y rutas
├── package.json                      # Dependencias y scripts de ejecución
├── vite.config.js                    # Configuración del empaquetador Vite
└── vitest.config.js                  # Configuración del entorno de pruebas Vitest
```


## Instalación y uso

### Requisitos Previos

- **Node.js:** Versión `>= 22.18.0` o `>= 24.12.0`
- **npm:** Gestor de paquetes de Node
- **Java JDK:** Versión `17` o superior (para el microservicio Spring Boot)
- **PostgreSQL:** Versión `14` o superior con una base de datos llamada `inventario`

---

### Paso 1: Configurar y levantar la Base de Datos

1. Asegúrate de tener el servicio de PostgreSQL en ejecución en el puerto `5432`.
2. Crea la base de datos `inventario` si aún no existe:
   ```sql
   CREATE DATABASE inventario;
   ```

---

### Paso 2: Ejecutar el Microservicio Backend (Spring Boot)

1. Dirígete a la carpeta del proyecto backend:
   ```bash
   cd ../22161222_RodriguezJJoseD_BackSpring
   ```
2. Verifica que las credenciales en `src/main/resources/application.yaml` coincidan con tu configuración local de PostgreSQL.
3. Inicia el microservicio con Maven Wrapper:
   - **En Windows:**
     ```powershell
     .\mvnw spring-boot:run
     ```
   - **En Linux/macOS:**
     ```bash
     ./mvnw spring-boot:run
     ```
4. El microservicio arrancará en el puerto `8000` (URL base: `http://localhost:8000/api`).

---

### Paso 3: Configurar el Frontend (Vue.js 3)

1. Regresa al directorio del proyecto frontend:
   ```bash
   cd ../22161222_RodriguezJJoseD_FrontVue
   ```
2. Revisa el archivo `.env` y confirma que la URL apunte al microservicio:
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api
   ```
3. Instala las dependencias del proyecto:
   ```bash
   npm install
   ```

---

### Paso 4: Ejecutar la Aplicación en Modo Desarrollo

Inicia el servidor local de Vite:
```bash
npm run dev
```

La consola mostrará la URL de acceso local (por defecto `http://localhost:5173`). Abre dicho enlace en tu navegador para interactuar con la aplicación.

---

### Scripts adicionales disponibles

- **Compilar para producción:**
  ```bash
  npm run build
  ```
- **Previsualizar compilación de producción:**
  ```bash
  npm run preview
  ```
- **Ejecutar pruebas unitarias:**
  ```bash
  npm run test:unit
  ```
- **Analizar y formatear código (Linting):**
  ```bash
  npm run lint
  ```
