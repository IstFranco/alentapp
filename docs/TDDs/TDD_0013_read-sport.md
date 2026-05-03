| identificación | 13 |
|---------------|---|
| estado        | Propuesto |
| autor         | Esteban Trillo |
| fecha         | 2026-05-03 |
| título        | Visualizacion de Deportes |

# TDD-0010: Visualizacion de Deportes

## 1. Contexto de Negocio

### 1.1. Objetivo

Permitir a los cordinadores deportivos consultar y listar los deportes disponibles en el sistema del Club Alentapp, para conocer la oferta deportiva vigente.

### 1.2. User Personas

- **Cordinador Deportivo**: yo como cordinador deportivo quiero poder consultar los deportes disponibles

### 1.3. Criterios de Aceptación

#### Historia de Usuario 2: Consultar Deportes
- **Como** cordinador deportivo, **quiero** listar todos los deportes disponibles, **para** conocer la oferta del club
- **Escenario de éxito**: si el cordinador deportivo busca un deporte a travez de nombre, el sistema debera mostrar solo los deportes que coincidan con campo cargado
- **Escenario de fallo**: si el cordinador deportivo busca deportes a travez de un nombre vacio, el sistema debera notifcar que no existen deportes con ese campo vacio y no mostrar ninguna coincidencia

## 2. Diseño Técnico

### 2.1. Modelo de Dominio

Se definirá la entidad **Sport** con las siguientes propiedades y restricciones:

- **id**: identificador único universal (UUID) generado por el sistema
- **name**: cadena de texto. No puede ser modificado luego de su creación
- **description**: cadena de texto editable.
- **max_capacity**: número entero. Debe ser mayor a cero.
- **additional_price**: número. Representa el costo adicional del deporte.
- **requires_medical_certificate**: booleano. Indica si se requiere certificado médico para participar.

### 2.2. Contrato de API (Shared DTOs)

#### Endpoint: Listar Deportes
**Método:** `GET /api/v1/sports`

**Respose** (`200 Ok`):
```typescript
{
    id: string;
    name: string;                              //imutable luego de la cracion
    description: string;                       //editable
    max_capacity: int;                         // debe ser mayor a cero
    additional_price: number;
    requires_medical_certificate: boolean;
}
```

### 2.3. Esquema de Persistencia (Prisma)

```prisma
model Sport{
    id          String    @id @default(uuid())
    name        String
    description String
    max_capacity number
    additional_price number @default(0)
    requires_medical_cerificate boolean @default(flase)

    enrollments   Enrollment []
}
```

## 3. Arquitectura y Flujo

### 3.1. Definición del Puerto

```typescript
export interface SportRepository{
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
   - retornar la lista de deportes con codigo 200 Ok

## 4. Casos de Borde y Manejo de Errores

| Escenario de Error | Validación / Regla de Negocio | Código HTTP |
|-------------------|-------------------------------|-------------|
| **Busqueda Invalida** | no se deben aceptar busquedas con nombre vacio | `400` |
| **Sin Resultados** | no existen deportes que coincidan con el criterio de busqueda | `404` |
| **Error de Infraesctrutura** | falla la conexion con la base de datos. | `500` |

## 5. Observaciones Adicionales

### 5.1. Consideraciones de negocio
- Se pueden aplicar filtros por nombre para facilitar la busqueda de deportes
- La funcionalidad de listado es necesaria como paso previo para la seleccion de un deporte en operaciones de modificacion o eliminacion

### 5.2. Consideraciones de seguridad
- Los endpoints de consulta pueden ser accesibles a otros roles según necesidades del sistema
