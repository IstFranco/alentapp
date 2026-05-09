| identificación | 04 |
|---------------|---|
| Estado        | Propuesto |
| Autor         | Lautaro Flores |
| Fecha         | 2026-05-09 |
| Título        | Registro de Nuevo Certificado Médico |

# TDD-[0004]: Registro de Nuevo Certificado Médico

## 1. Contexto de Negocio

### 1.1. Objetivo
Permitir a los administradores registrar nuevos certificados médicos presentado por los socios, dejando asentadas la fecha de emisión, la fecha de vencimiento y la matrícula del profesional. Cada nuevo registro habilita al socio para la práctica deportiva e invalida automáticamente cualquier certificado anterior del mismo socio, garantizando que solo exista un único certificado vigente por persona.

### 1.2. User Persona
*   **Administrativo del Club**: Registrar de forma rápida y confiable los certificados médicos físicos que presentan los socios, manteniendo un único certificado vigente por socio. 

### 1.3. Criterios de Aceptación (User Stories)

#### Historia de Usuario 1: Registrar un nuevo Certificado Médico
*   **Como** administrativo del club, **quiero** registar un nuevo certificado médico de un socio, **para** habilitarlo a realizar actividad deportiva y mantener actualizado el respaldo sanitario del club. 
*   **Escenario de éxito**: Si el administrador completa correctamente todos los campos obligatorios y la fecha de vencimiento es posterior a la de emisión, el sistema crea el nuevo registro con `isValidated = false`, marca como inválidos los certificados activos anteriores del mismo socio en la misma operación, y devuelve una respuesta de éxito con el certificado creado.
*   **Escenario de fallo**: Si el administrativo ingresa una fecha de vencimiento menor o igual a la de emisión, el sistema rechaza la operación con un mensaje claro de "rango de fechas inválido" y no persiste ningún cambio en la base de datos.

### 1.4. Criterios Generales de Aceptación.
*   El sistema debe validar que todos los campos obligatorios (`memberId`, `issueDate`, `expiryDate`, `doctorLicense`) estén presentes y tengan el formato correcto.
*   El sistema debe validar que la fecha de vencimiento sea estrictamente posterior a la fecha de emisión.
*   El sistema debe validar que el socio referenciado por `memberId` exista en la base de datos.
*   El sistema debe inicializar el campo `isValidated` en `false` por defecto, ya que la validación administrativa es un paso posterior.
*   El sistema debe garantizar que, al crear un nuevo certificado, todos los certificados anteriores del mismo socio que estuvieran activos pasen a `isValidated = false` dentro de la misma transacción atómica.
*   El sistema debe permitir que coexistan múltiples certificados históricos de un mismo socio, pero solo uno puede tener `isValidated = true` en un momento dado.


## 2. Diseño Técnico

### 2.1. Modelo de Dominio
Se definirá la entidad **MedicalCertificate** que representa un cerificado médico presentado por un socio.

*   **id**: `string`. Identificador único universal (UUID) generado por el sistema.
*   **memberId**: `string`. UUID del socio asociado al certificado.
*   **issueDate**: `Date`. Fecha de emisión del certificado.
*   **expiryDate**: `Date`. Fecha de vencimiento. Debe ser posterior a `issueDate`.
*   **doctorLicense**: `string`. Matrícula del profesional. No puede estar vacía.
*   **isValidated**: `boolean`. Indica si el administrativo aprobó el documento. Por defecto es `false`.
*   **deletedAt**: `Date | null`. Marca de baja lógica. `null` indica que el registro está activo.

**Restricciones de dominio:**
*   Solo puede existir un certificado con `isValidated = true` y `deletedAt = null` por cada socio.
*   `expiryDate` debe ser estrictamente posterior a `issueDate`.

### 2.2. Contrato de API (Shared DTOs)

#### Endpoint: Crear Certificado Médico
**Método:** `POST /api/v1/medical-certificates`

**Request Body** (`CreateMedicalCertificateDto`):
```typescript
{
    memberId: string;      // UUID del socio
    issueDate: string;     
    expiryDate: string;    
    doctorLicense: string; // Matrícula médica
}
```

- **Response:** `201 Created`
- **Response Body**:
```ts
{
    id: string;
    memberId: string;
    issueDate: string;
    expiryDate: string;
    doctorLicense: string;
    isValidated: boolean;  // Se inicializa en false
}
```
> **Nota**: El campo `deletedAt` no se expone en la respuesta porque es un detalle interno de persistencia y no forma parte del documento de negocio.

## 3. Arquitectura y Flujo

### 3.1. Definición del Puerto

Puerto **`MedicalCertificateRepository`**. Para este caso de uso, los métodos relevantes son:

*   **`createAndInvalidatePrevious(certificate: MedicalCertificate): Promise<MedicalCertificate>`**
    Crea el nuevo certificado y, en la misma transacción, marca como inválidos (`isValidated = false`) todos los certificados activos anteriores del mismo socio. La operación es atómica: o se completa entera, o se revierte. Si el socio no tenía certificados activos previos, la invalidación no afecta filas y la creación se ejecuta normalmente. Devuelve el certificado recién creado.

**Dependencias externas:** El caso de uso requiere acceso al `MemberRepository` (módulo de Member) para validar la existencia del socio referenciado, mediante el método `findById(memberId: string): Promise<Member | null>`.

### 3.2. Lógica del Caso de Uso
**Caso de Uso:** `Registrar Nuevo Certificado` (CreateMedicalCertificate)

**Flujo paso a paso:**

1.  **Validación de formato de entrada.** Validar con `zod` que el DTO tenga todos los campos requeridos (`memberId`, `issueDate`, `expiryDate`, `doctorLicense`), que las fechas estén en formato ISO 8601 y que `doctorLicense` no sea una cadena vacía.

2.  **Validación de regla de fechas.** Verificar que `expiryDate` sea estrictamente posterior a `issueDate`.

3.  **Verificación de existencia del socio.** Consultar el repositorio de socios para confirmar que `memberId` corresponde a un socio existente.

4.  **Mapeo de DTO a entidad de dominio.** Construir una instancia de `MedicalCertificate` a partir del DTO. En este paso se transforman las fechas string a objetos `Date`, se inicializa `isValidated` en `false` y `deletedAt` en `null`. El `id` se genera como un UUID nuevo.

5.  **Persistencia atómica.** Invocar `MedicalCertificateRepository.createAndInvalidatePrevious(certificate)`. Este método garantiza, dentro de una transacción, que cualquier certificado activo previo del socio quede con `isValidated = false`, y que el nuevo certificado quede persistido. Si la transacción falla, todos los cambios se revierten.

6.  **Mapeo de entidad a DTO de respuesta.** Convertir la entidad persistida a `MedicalCertificateDto`, transformando las fechas `Date` a strings ISO 8601 y omitiendo el campo `deletedAt`.

7.  **Respuesta exitosa.** Devolver el DTO con código `201 Created`.


## 4. Casos de Borde y Manejo de Errores

| Escenario de Error | Validación / Regla de Negocio | Código HTTP |
|-------------------|-------------------------------|-------------|
| **Datos Faltantes** | Los campos obligatorios (`memberId`, `issueDate`, `expiryDate`, `doctorLicense`) no estan presentes o es nulo. | `400 Bad Request` |
| **Formato inválido** | Las fechas no respetan el formato ISO 8601, el `memberId` no es un UUID válido, o `doctorLicense` es una cadena vacía. | `400 Bad Request` |
| **Rango de Fechas Inválido** | `expiryDate` es menor o igual a `issueDate`. | `400 Bad Request` |
| **Certificado vencido al cargar** | `expiryDate` es anterior a la fecha actual. Un certificado que nace vencido no habilita al socio. | `400 Bad Request` |
| **Socio inexistente** | El `memberId` proporcionado no corresponde a ningún socio en la base de datos. | `404 Not Found` |
| **Error de infraestructura** | Falla de la conexión con la base de datos, o fallo durante la transacción atómica (rollback automático). | `500 Internal Server Error` |


## 5. Observaciones Adicionales

### 5.1. Validaciones de datos
Se utilizarán librerías como `zod` para validar que los strings de las fechas sigan el formato ISO, que la matrícula médica no sea una cadena vacía, y que el memberId este en formato UUID válido.

### 5.2. Atomicidad de la operación
La invalidación de los certificados anteriores y la creación del nuevo deben ocurrir dentro de una misma transacción de base de datos. Si la transacción falla por cualquier motivo, el rollback automático asegura que la base de datos vuelva a su estado previo, manteniendo la integridad de los datos.

### 5.3. Inicialización del campo `isValidated`
El campo `isValidated` se inicializa en `false` al crear un certificado nuevo. Esto refleja que la carga del documento y su validación administrativa son dos momentos distintos del proceso: primero el administrador registra el certificado físico recibido, y luego lo aprueba mediante la operación documentada en el TDD de Modificación.

### 5.4. Manejo de fechas
A nivel de transporte (DTO), las fechas viajan como strings en formato ISO 8601. A nivel de dominio y persistencia, se trabajan como objetos `Date`. La conversión entre ambas representaciones se realiza en la capa de aplicación, durante el mapeo entre DTO y entidad.


## 6. Componentes de Arquitectura Hexagonal

*   **Domain**: entidad `MedicalCertificate`, regla de negocio de un único certificado activo por socio, puerto `MedicalCertificateRepository`.
*   **Application**: caso de uso `CreateMedicalCertificate`, mapeo entre DTO y entidad, consumo del puerto `MemberRepository` (módulo Member).
*   **Infrastructure**: `MedicalCertificateController` (endpoint `POST /api/v1/medical-certificates`), `PrismaMedicalCertificateRepository` (implementación con `prisma.$transaction`), schemas de validación con `zod`.


## 7. Plan de Implementación

1.  Definir `CreateMedicalCertificateDto` y `MedicalCertificateDto` en `@alentapp/shared`.
2.  Agregar el modelo `MedicalCertificate` al `schema.prisma` y generar la migración.
3.  Implementar la entidad `MedicalCertificate` y el puerto `MedicalCertificateRepository` en la capa de Domain.
4.  Implementar `PrismaMedicalCertificateRepository` en Infrastructure usando `prisma.$transaction()`.
5.  Implementar el caso de uso `CreateMedicalCertificate` en Application, inyectando los repositorios necesarios.
6.  Definir los schemas de validación con `zod` para `CreateMedicalCertificateDto`.
7.  Registrar el endpoint `POST /api/v1/medical-certificates` en el controlador de Fastify.
8.  Escribir tests unitarios del caso de uso y tests de integración del repositorio.