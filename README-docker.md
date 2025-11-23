# Docker + Compose — MuseCareer (local dev + prod)

## Summary
- Use `docker-compose.yml` for production-ish builds (nginx frontend, node backend).
- Use `docker-compose.override.yml` for development. It mounts your local code into containers so edits apply without rebuilding images (bind mounts).

## Setup (local)
1. Copy backend env example:
