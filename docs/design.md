# Stampede Server Design

## Hooks

The stampede server handles the following events:

- check_suite
- check_run
- pull_request
- push
- release

## Dependencies

- Redis for realtime caching
- Postgres for task status & history
