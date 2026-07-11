# Module Specification — Template

Produced by: the Software Architect, consuming a Feature Design artifact.
Consumed by: the API Contract Engineer, Database Engineer, Backend
Engineer, Frontend Engineer, Premium UI Engineer. This is the technical
counterpart to Feature Design — Feature Design says what the feature does;
this says how the codebase will be structured to build it.

---

## Feature

*(Name — matches the Feature Design artifact this was built from.)*

## Layers touched

*(Frontend `modules/{feature}/`? Backend `api/v1/admin/{feature}/`? Both?
New module or extending an existing one — check the Module Registry.)*

## Module boundaries

*(What this module owns vs. what it consumes from other modules' public
exports — per each side's module-isolation rule in `AGENTS.md`. Name the
specific other modules whose barrel exports get imported, and what's
imported from them.)*

## Data model sketch

*(New or changed Mongoose schema fields, relationships, indexes needed —
enough for the Database Engineer to implement without re-deriving intent.)*

## Cross-cutting concerns

*(Auth/role guards required, response envelope usage — should always be
"yes, via `sendSuccess`," pagination needs, caching considerations.)*

## Existing patterns being reused

*(Name the specific existing file(s) this follows the shape of — e.g. "this
module's controller/service/repository split follows
`api/v1/admin/users/` exactly." This is what prevents a second way of
solving the same problem from creeping in.)*

## Work breakdown

*(Concrete file list: what gets created/changed in Backend and Frontend,
matching each side's module structure exactly — controller.ts/service.ts/
repository.ts/routes.ts/model.ts/schema.ts/dto.ts/mapper.ts on the backend;
api/components/hooks/pages/services/schema/types/constants/enums/utils on
the frontend.)*

## Risks / open technical questions

*(Anything the Architect isn't fully certain of — verify before other
agents build against an assumption, per the same "verify before
recommending" discipline used throughout this framework.)*
