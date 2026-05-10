| identificación | 13 |
|---------------|---|
| estado        | Propuesto |
| autor         | Esteban Trillo |
| fecha         | 2026-05-03 |
| título        | Visualizacion de Deportes |

# TDD-0013: Visualizacion de Deportes

## 1. Contexto de Negocio

### 1.1. Objetivo

Permitir a los coordinadores deportivos consultar y listar los deportes disponibles en el sistema del Club Alentapp, para conocer la oferta deportiva vigente.

### 1.2. User Persona

- **Administrativo**: Este usuario es responsable de conocer la oferta deportiva del club. Al interactuar con esta funcionalidad, espera poder consultar y filtrar los deportes disponibles de forma rapida y sin errores. Busca visualizar el listado completo o encontrar un deporte especifico por nombre.

### 1.3. Criterios de Aceptación (User Stories)

#### Historia de Usuario 1: Consultar Deportes
- **Como** administrativo, **quiero** listar todos los deportes disponibles, **para** conocer la oferta del club

- **Escenario de éxito**: si el administrativo busca un deporte a traves de nombre, el sistema debera mostrar solo los deportes que coincidan con el campo cargado
- **Escenario de fallo**: si el administrativo busca deportes a traves de un nombre vacio, el sistema debera notificar que no existen deportes con ese criterio y no mostrar ninguna coincidencia

### 1.4. Criterios de Aceptación Generales

- El sistema debe retornar todos los deportes disponibles cuando no se aplica ningun filtro.
- El sistema debe permitir filtrar por `name` como parametro de busqueda opcional.
- El sistema no debe aceptar busquedas con el parametro `name` vacio.
- Al finalizar, el sistema debe retornar la lista de deportes con un codigo `200 OK`.

## 2. Diseño Técnico

### 2.1. Modelo de Dominio

Se definirá la entidad **Sport** con las siguientes propiedades y restricciones:

- **id**: identificador único universal (UUID) generado por el sistema
- **name**: cadena de texto. No puede ser modificado luego de su creación.
- **description**: cadena de texto editable.
- **max_capacity**: número entero. Debe ser mayor a cero.
- **additional_price**: número. Representa el costo adicional del deporte.
- **requires_medical_certificate**: booleano. Indica si se requiere certificado médico para participar.

### 2.2. Contrato de API (Shared DTOs)

#### Endpoint: Listar Deportes
**Método:** `GET /api/v1/sports`

**Query Params** (opcionales):
```
name?: string   // filtro por nombre del deporte
```

**Response** (`200 OK`):
```typescript
[
  {
    id: string;
    name: string;                              // inmutable luego de la creacion
    description: string;                       // editable
    max_capacity: number;                      // debe ser mayor a cero
    additional_price: number;
    requires_medical_certificate: boolean;
  }
]
```

## 3. Arquitectura y Flujo

### 3.1. Definición del Puerto

```typescript
export interface SportRepository {
  findById(id: string): Promise<Sport | null>;
  findAll(name?: string): Promise<Sport[]>;
}
```

### 3.2. Lógica del Caso de Uso

**Caso de Uso:** `Listar Deportes` (GetAllSports)

**Flujo paso a paso:**

1.
   - validar el parametro de busqueda `name`
   - en caso de no ser provisto, considerar la consulta sin filtros

2.
   - consultar los deportes a traves del repositorio, aplicando el filtro por nombre si corresponde

3.
   - validar si existen resultados para el criterio de busqueda ingresado

4.
   - mapear la respuesta a SportResponseDto

5.
   - retornar la lista de deportes con codigo 200 OK

## 4. Casos de Borde y Manejo de Errores

| Escenario de Error | Validación / Regla de Negocio | Código HTTP |
|-------------------|-------------------------------|-------------|
| **Busqueda Invalida** | no se deben aceptar busquedas con el parametro `name` vacio. | `400` |
| **Sin Resultados** | no existen deportes que coincidan con el criterio de busqueda. | `404` |
| **Error de Infraestructura** | falla la conexion con la base de datos. | `500` |

## 5. Observaciones Adicionales

### 5.1. Validaciones de datos
Se pueden utilizar librerias como `zod` para validar los parametros de entrada, asegurando que el campo `name` no sea una cadena vacia en caso de ser enviado.

### 5.2. Consideraciones de negocio
- Se pueden aplicar filtros por nombre para facilitar la busqueda de deportes.
- La funcionalidad de listado es necesaria como paso previo para la seleccion de un deporte en operaciones de modificacion o eliminacion.

### 5.3. Consideraciones de seguridad
- Los endpoints de consulta pueden ser accesibles a otros roles segun las necesidades del sistema.

## 6. Componentes de Arquitectura Hexagonal

1. **Puerto:** `SportRepository` (Interface en el Dominio).
2. **Caso de Uso:** `GetAllSports` (Valida el parametro de busqueda y delega la consulta al repositorio).
3. **Adaptador de Salida:** Implementación de persistencia en base de datos via Prisma.
4. **Adaptador de Entrada:** `SportController` (Ruta HTTP `GET /api/v1/sports`).

## 7. Plan de Implementación

1. Verificar que el esquema `Sport` en Prisma ya contempla los campos necesarios.
2. Crear los tipos y DTOs compartidos (`SportResponseDto`) en el paquete `@alentapp/shared`.
3. Extender el puerto `SportRepository` con los métodos `findAll` y `findById` como interface en el Dominio.
4. Implementar el adaptador de salida `SportPrismaRepository` con los métodos `findAll` y `findById`, soportando el filtro opcional por nombre.
5. Implementar el Caso de Uso `GetAllSports` con la validación del parametro de busqueda.
6. Actualizar el `SportController` con la ruta `GET /api/v1/sports` y conectar con el Caso de Uso.
7. Conectar el listado en el frontend (React) con el endpoint del backend.
