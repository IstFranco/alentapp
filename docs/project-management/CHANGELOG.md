# Changelog

Todos los cambios importantes de este proyecto se documentan en este archivo.

ENTIDAD: MEDICAL CERTIFICATES
---
## [1.1.0] - 2026-05-03

### Added
- Se agregan TDD separados para Medical Certificates (0004_new, 0005_update, 0006_delete) en /docs/TDDs.

### Removed
- Se elimina el archivo anterior de certificados médicos.

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

## [1.0.0] - 2026-05-02

### Changed
- Se movio "SPORT-01.md" de ./docs a ./docs/TDDs

---

## [1.0.0] - 2026-05-01

### Added
- Creación inicial del TDD de Sport "SPORT-01.md"

---

ENTIDAD: LOCKERS

## [1.2.0] - 2026-05-03

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

## [1.0.0] - 2026-05-03
### Added
- Se agregan TDD separados para EquipmentLoan (TDD_0001_new-equipment-loan, TDD_0002_update-equipment-loan, TDD_0003_delete-equipment-loan) en /docs/TDDs
- TDD_0001: Alta de préstamo con validación de restricción por categoría
- TDD_0002: Devolución de préstamo con estados Returned y Damaged
- TDD_0003: Cancelación de préstamo (baja lógica)

### Removed
- Se elimina equipment_loan.md de ./docs

---
