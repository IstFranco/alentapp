| identificación | 11 |
|---------------|---|
| estado        | Propuesto |
| autor         | Esteban Trillo |
| fecha         | 2026-05-03 |
| título        | Modificacion de un Deporte |

# TDD-0010: Modificacion de un Deporte

## 1. Contexto de Negocio

### 1.1. Objetivo

Permitir a los administradores modificar la informacion de un deporte existente en el sistema del Club Alentapp, actualizando su descripcion y/o cupo maximo para mantener la oferta deportiva actualizada.

### 1.2. User Personas

- **Administrativo**: yo como administrativo deportivo quiero modificar la descripcion y/o el cupo maximo de un deporte

### 1.3. Criterios de Aceptación

#### Historia de Usuario 3: Editar Deporte
- **Como** administrativo, **quiero** quiero modificar la descripcion y/o el cupo maximo de un deporte, **para** mantener actualizada la lista de deportes que ofrece el club
- **Escenario de éxito**: si el administrativo ingresa una nueva descripcion y/o un cupo maximo mayor a cero, el sistema debera actulizar el o los campos modificados y notificar como actualizacion exitosa
- **Escenario de fallo**: si el administrativo quiere cambiar el nombre de un deporte, el sistema debera ignorar el cambio y notificar que no es posible realizar dicha actualizacion

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

#### Endpoint: Actualizar Deporte
**Método:** `PATCH /api/v1/sports/:id`

**Request Body** (`UpdateSportDto`):
```typescript
{
  description?: string;                       //editable
  max_capacity?: number;                  // debe ser mayor a cero
}
```

**Respose** (`200 Ok`):
```typescript
{
    id: string;
    name: string;                              //imutable luego de la cracion
    description: string;                       //editable
    max_capacity: number;                   // debe ser mayor a cero
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
  update(id: string, data: Partial<Omit<Sport, 'id' | 'name'>>): Promise<Sport>;
}
```

### 3.2. Lógica del Caso de Uso

**Caso de Uso:** `Actualizar Deporte` (UpdateSport)

**Flujo paso a paso:**

1.
   - validar la existencia del deporte a modificar
   - validar que solo se reciban los datos `max_capacity` y `description` o ignorar el resto de datos

2.
   - validar que `max_capacity` sea mayor a cero
   - validar que `max_capacity` no sea menor a la cantidad de inscriptos actuales (enrollments)

3.
   - mapear los datos del DTO recibido en la entidad asociada al deporte que se espera modificar

4.
   - persistir el mapeo de dicos datos, a travez de SportRepository.update()

5.
   - retornar SportResponseDto mapeado desde la entidad persistida actualizada

## 4. Casos de Borde y Manejo de Errores

| Escenario de Error | Validación / Regla de Negocio | Código HTTP |
|-------------------|-------------------------------|-------------|
| **Recurso Inexistente** | el `id` del deporte no existe en la base de datos. | `404` | 
| **Modificacion Invalida** | no se permite modificar el campo `name` una vez creado el deporte | `400` |
| **Cupo Invalido** | el campo `max_capacity` debe ser mayor a cero. | `400` | 
| **Cupo menor a Inscriptos** | no se puede reducir el `max_capacity` por debajo de la cantidad de inscriptos actuales. | `409` |
| **Error de Infraesctrutura** | falla la conexion con la base de datos | `500` |

## 5. Observaciones Adicionales

### 5.1. Validaciones de datos
Se pueden utilizar librerías como `zod` para validar los datos de entrada en los DTOs

### 5.2. Consideraciones de negocio
- El campo `name` no debe poder modificarse una vez creado el deporte
- No se debe permitir reducir el `max_capacity` por debajo de la cantidad de inscriptos actuales.

### 5.3. Consideraciones de seguridad
- Los endpoints de modificación deberían estar restringidos a usuarios con rol administrativo
