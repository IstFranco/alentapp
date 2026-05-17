# Changelog

Todos los cambios importantes de este proyecto se documentan en este archivo.

ENTIDAD: MEDICAL CERTIFICATES
---
## [1.3.0] - 2026-05-16

### Added
- Se implementa el backend del Alta para Medical Certificates según el TDD-0004 (endpoint `POST /api/v1/medical-certificates`).
- Se agrega el modelo `MedicalCertificate` al schema de Prisma con baja lógica vía `deletedAt`.
- Se incorporan los DTOs `MedicalCertificateDTO` y `CreateMedicalCertificateRequest` al paquete compartido `@alentapp/shared`.
- Se agrega endpoint `GET /api/v1/medical-certificates` para validación funcional del backend.

### Fixed
- Se declara `@alentapp/shared` como dependencia explícita del paquete `@alentapp/api` (estaba faltando).

## [1.2.0] - 2026-05-11

### Changed
- Se aplican correcciones del code review sobre los TDDs de Medical Certificates (0004_new, 0005_update, 0006_delete)

---
## [1.1.0] - 2026-05-03

### Added
- Se agregan TDD separados para Medical Certificates (0004_new, 0005_update, 0006_delete) en /docs/TDDs.

### Removed
- Se elimina el archivo anterior de certificados médicos.

---
## [1.0.0] - 2026-05-01

### Added
- Creación inicial del TDD de Medical Certificates en un archivo único.


ENTIDAD: SPORTS
---
## [1.1.0] - 2026-05-03

### Added
- Se agregan TDD separados para Sport (create, update, delete, read) en /docs/TDDs

### Changed
- Se refactoriza el TDD general de Sport

### Removed
- Se elimina SPORT-01.md de ./docs/TDDs

---

## [1.1.0] - 2026-05-02

### Changed
- Se movio "SPORT-01.md" de ./docs a ./docs/TDDs

---

## [1.1.0] - 2026-05-01

### Added
- Creación inicial del TDD de Sport "SPORT-01.md"

---

ENTIDAD: LOCKERS

## [1.1.0] - 2026-05-03

### Added
- Se agregan TDD separados para Locker (TDD_0007_NEW_LOCKER, TDD_0008_DELETE_LOCKER, TDD_0009_UPDATE_LOCKER) en /TDDs.

### Changed
- Se refactoriza el TDD general de Locker.

### Removed
- Se elimina tddLockers.md de /TDDs.

---

## [1.1.0] - 2026-05-01

### Added
- Creación inicial del TDD de Locker "tddLockers.md".

---

## [1.1.0] - 2026-05-03
### Added
- Se agregan TDD separados para EquipmentLoan (TDD_0001_new-equipment-loan, TDD_0002_update-equipment-loan, TDD_0003_delete-equipment-loan) en /docs/TDDs

### Removed
- Se elimina equipment_loan.md de ./docs

---
## [1.1.0] - 2026-05-10
### Changed
- Se modificaron las TDDs para la entidad EquipmentLoan(TDD_0014_new-equipment-loan, TDD_0015_update-equipment-loan, TDD_0016_delete-equipment-loan) en /docs/TDDs para cumplir revision.
