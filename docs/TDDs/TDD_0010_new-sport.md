| identificación | 10 |
|---------------|---|
| estado        | Propuesto |
| autor         | Esteban Trillo |
| fecha         | 2026-05-03 |
| título        | Registro de Nuevo Deporte |

# TDD-0010: Registro de Nuevo Deporte

## 1. Contexto de Negocio

### 1.1. Objetivo

Permitir a los administradores crear nuevos deportes en el sistema del Club Alentapp, definiendo sus atributos principales como nombre, descripcion, cupo maximo, precio adicional y condiciones de acceso

### 1.2. User Persona

- **Administrativo**: Este usuario es responsable de mantener actualizada la oferta deportiva del club. Al interactuar con esta funcionalidad, espera poder registrar nuevos deportes de forma rápida y sin errores. Busca definir el nombre, cupo máximo y precio adicional de cada disciplina, sin permitirse ingresar datos inválidos ni duplicar deportes ya existentes

### 1.3. Criterios de Aceptación (User Stories)

#### Historia de Usuario 1: Crear Deporte
- **Como** administrativo, **quiero** crear un nuevo deporte con nombre, descripcion y cupo maximo, **para** para ampliar la oferta deportiva del club

- **Escenario de éxito**: si el administrativo completa de manera correcta los campos requeridos, el sistema debera responder creando el nuevo deporte y notificar la exitosa creacion
- **Escenario de fallo**: si el administrativo ingresa una capacidad maxima de menor o igual a cero, el sistema debera responder con una advertencia de rango invalido invalido y no permitir el alta del nuevo deporte

### 1.4. Criterios de Aceptación Generales

- El sistema debe validar que el `name` no esté vacío y sea único.
- El sistema debe validar que el `max_capacity` sea un número entero mayor a cero.
- Al finalizar, el sistema debe retornar los datos del deporte creado con un código `201 Created`.
- El deporte debe quedar guardado con el campo `name` inmutable luego de su creación.

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

#### Endpoint: Crear Deporte
**Método:** `POST /api/v1/sports`

**Request Body** (`CreateSportDto`):
```typescript
{
    name: string;                              //imutable luego de la cracion
    description: string;                       //editable
    max_capacity: int;                         // debe ser mayor a cero
    additional_price: number;                  // por defecto es cero
    requires_medical_certificate: boolean;
}
```

**Respose** (`201 Created`):
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

## 3. Arquitectura y Flujo

### 3.1. Definición del Puerto

```typescript
export interface SportRepository{
  create(sport: Sport): Promise<Sport>
}
```

### 3.2. Lógica del Caso de Uso

**Caso de Uso:** `Crear Deporte` (CreateSporte)

**Flujo paso a paso:**

1.
   - validar que `name` no este vacio
   - validar que los datos sean del tipo esperado

2.
   - validar que `max_capacity` sea mayor a cero
   - validar que no exista ya un deporte con el mismo dato `name`

3.
   - mapear los datos del DTO recibido en una entidad del dominio Sport

4.
   - persistir el mapeo de dicos datos, a travez de SportRepository.crate(deporte)

5.
   - retornar SportResponseDto mapeado desde la entidad persistida y devolver con condigo 201 Created

## 4. Casos de Borde y Manejo de Errores

| Escenario de Error | Validación / Regla de Negocio | Código HTTP |
|-------------------|-------------------------------|-------------|
| **Datos Faltantes** | los campos obligatorios (name, max_capacity) deben estar presentes | `400` | 
| **Cupo Invalido** | el campo `max_capacity` debe ser mayor a cero. | `400` | 
| **Nombre Duplicado** | no pueden exixtir dos deportes con el mismo `name` | `409` |
| **Error de Infraesctrutura** | falla la conexion con la base de datos. | `500` |

## 5. Observaciones Adicionales

### 5.1. Validaciones de datos
Se pueden utilizar librerías como `zod` para validar los datos de entrada en los DTOs, asegurando que los campos requeridos estén presentes y que `max_capacity` sea mayor a cero

### 5.2. Consideraciones de negocio
- El campo `name` no debe poder modificarse una vez creado el deporte

### 5.3. Consideraciones de seguridad
- Los endpoints de creación deberían estar restringidos a usuarios con rol administrativo

## 6. Componentes de Arquitectura Hexagonal

1. **Puerto:** `SportRepository` (Interface en el Dominio).
2. **Caso de Uso:** `CreateSport` (Valida que `max_capacity` sea mayor a cero y que no exista un deporte con el mismo `name` antes de llamar al repositorio).
3. **Adaptador de Salida:** Implementación de persistencia en base de datos via Prisma.
4. **Adaptador de Entrada:** `SportController` (Ruta HTTP `POST /api/v1/sports`).

## 7. Plan de Implementación

1. Definir el esquema `Sport` en Prisma y correr la migración correspondiente.
2. Crear los tipos y DTOs compartidos (`CreateSportDto`, `SportResponseDto`) en el paquete `@alentapp/shared`.
3. Definir el puerto `SportRepository` como interface en el Dominio.
4. Implementar el adaptador de salida `SportPrismaRepository` con el método `create`.
5. Implementar el Caso de Uso `CreateSport` con las validaciones de negocio (cupo > 0, nombre único).
6. Crear el `SportController` con la ruta `POST /api/v1/sports` y conectar con el Caso de Uso.
7. Conectar el formulario en el frontend (React) con el endpoint del backend.
