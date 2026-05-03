# Contributing

## Flujo de trabajo

El proyecto sigue un flujo basado en **Git Feature Branch Workflow**, donde la rama principal es `main`.

### Reglas generales

* La rama `main` es la fuente de verdad del proyecto
* No se permite trabajar directamente sobre `main`
* Todo cambio debe realizarse mediante ramas de feature y Pull Requests (PR)

---

## Uso de ramas

Para cada nueva funcionalidad o cambio:

1. Crear una nueva rama a partir de `main`

```bash
git checkout main
git pull origin main
git checkout -b feature/nombre-de-la-feature
```

2. Nombrado de ramas:

* `feature/...` → nuevas funcionalidades
* `fix/...` → corrección de errores
* `refactor/...` → mejoras sin cambiar comportamiento
* `chore/...` → tareas menores

---

## Commits

Los commits deben ser claros y descriptivos:

* `feat:` nueva funcionalidad
* `fix:` corrección de error
* `refactor:` mejora interna
* `chore:` cambios menores
* `docs:` cambios en documentacion

Ejemplo:

```bash
git commit -m "feat: agregar TDD de alta de deporte"
```

---

## Pull Requests (PR)

Todo cambio debe integrarse mediante un Pull Request hacia `main`.

### Reglas para PR:

* El PR debe incluir:

  * título claro
  * descripción del cambio
  * contexto

* El código debe ser revisado por al menos **otro integrante del equipo**

* No se permite hacer merge directo sin aprobación

---

## Protección de la rama `main`

La rama `main` cuenta con reglas de protección:

* No se permite push directo
* Se requiere aprobación de PR para hacer merge
* El código debe ser revisado antes de integrarse

---

## Objetivo

Este flujo asegura:

* Calidad del código
* Revisión entre pares
* Historial limpio y entendible
* Trabajo colaborativo ordenado
