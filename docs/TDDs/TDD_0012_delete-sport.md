| identificación | 12 |
|---------------|---|
| estado        | Propuesto |
| autor         | Esteban Trillo |
| fecha         | 2026-05-03 |
| título        | Eliminar un Deporte |

# TDD-0010: Eliminar un Deporte

## 1. Contexto de Negocio

### 1.1. Objetivo

Permitir a los administradores eliminar un deporte existente en el sistema del Club Alentapp, manteniendo actualizada la lista de disciplinas deportivas disponibles.

### 1.2. User Personas

- **Administrativo**: yo como administrativo deportivo quiero eliminar un deporte

### 1.3. Criterios de Aceptación

#### Historia de Usuario 3: Eliminar Deporte
- **Como** administrativo, **quiero** quiero eliminar un deporte, **para** mantener actualizada la lista de deportes que ofrece el club.
- **Escenario de éxito**: si el administrativo quiere eliminar un deporte, el sistema debera solicitar una confirmacion de eliminacion y en caso adirmativo, eliminar dicho deporte 
- **Escenario de fallo**: si el socio intenta eliminar un deporte, el sistema debera notificar que no no tiene permisos para realizar dicha accion y redireccionarlo al inicio

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

#### Endpoint: Eliminar Deporte
**Método:** `DELETE /api/v1/sports/:id`

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
  daleteById(id: string): Promise<void>;
}
```

### 3.2. Lógica del Caso de Uso

**Caso de Uso:** `Eliminar Deporte` (DeleteSport)

**Flujo paso a paso:**

1.
   - validar la existencia del deporte a eliminar a traves de su id

2.
   - validar que no existan inscripciones en el deporte a eliminar (enrollments)
   - solicitar confirmacion de eliminacion

3.
   - Ejecutar la eliminación del deporte a través del repositorio

4.
   - Confirmar la operación sin retornar contenido

## 4. Casos de Borde y Manejo de Errores

| Escenario de Error | Validación / Regla de Negocio | Código HTTP |
|-------------------|-------------------------------|-------------|
| **Recurso Inexistente** | el `id` del deporte no existe en la base de datos. | `404` | 
| **Elimicacion de Inscriptos** | no se puede eliminar un deporte que tenga inscriptos asociados `enrollments`. | `409` | 
| **Sin Permisos** | el usuario no tiene permisos para eliminar el deporte | `403` |
| **Error de Infraesctrutura** | falla la conexion con la base de datos. | `500` |

## 5. Observaciones Adicionales

### 5.1. Consideraciones de negocio
- No se debe permitir eliminar un deporte si tiene inscripciones asociadas.

### 5.2. Consideraciones de seguridad
- Los endpoints de eliminación deberían estar restringidos a usuarios con rol administrativo
