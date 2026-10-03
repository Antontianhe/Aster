# Aster backend

The API is implemented in Java 21, Spring Boot 3.5.16, Maven, MyBatis Plus 3.5.17 and MySQL. It preserves the frontend's existing `/api` contracts and the installed database schema. No Node API server or Node subprocess is used to handle requests.

## Install, build, run

From the repository root on Windows:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\back-end\install-tools.ps1
.\back-end\mvnw.cmd package
pnpm server
```

The installer verifies the JDK's SHA-256 and Maven's SHA-512 checksums before extraction. Tools and Maven's dependency cache are stored privately under `%LOCALAPPDATA%\Aster`. `mvnw.cmd` is a Windows convenience launcher for this installation, not the standard Maven Wrapper JAR.

The executable package is `target/aster-backend.jar`. With an available JDK:

```powershell
java -Duser.timezone=UTC -jar back-end/target/aster-backend.jar
```

MySQL must be running first. The default API address is `127.0.0.1:5174`; `GET /api/health` checks the database and reports `backend: "spring-boot"` and `persistence: "mybatis-plus"`.

## Configuration

`LocalSettings` loads `%LOCALAPPDATA%\Aster\mysql-instance\app.env`, then overlays environment variables. Database secrets are never copied into `application.properties` or frontend files.

| Setting | Default / meaning |
| --- | --- |
| `ASTER_HOME` | Optional override for the private Aster installation directory |
| `ASTER_API_PORT` | `5174` |
| `DB_HOST` | `127.0.0.1` |
| `DB_PORT` | `3306` |
| `DB_NAME` | `aster` |
| `DB_USER` | `aster_app` |
| `DB_PASSWORD` | Read from private `app.env` or process environment |
| `OPENAI_API_KEY` | Optional private cloud key; no key is bundled |
| `ASTER_OPENAI_ENABLED` | Must be `true` in addition to a configured key |

MySQL TLS uses `mysql-instance/data/ca.pem`. A temporary PKCS12 trust store is created in that same restricted private directory and removed on normal JVM shutdown. TLS verification is not disabled. The account's existing `feed-encryption.key` is required to read saved Schoolbox feed connections.

Use `--aster.scheduling.enabled=false` for a temporary verification instance. Normal operation polls feeds every 60 seconds, prepares due mock plans, and expires old sessions. Services do not install themselves as Windows services or start at boot.

## Architecture

- `api`: Spring MVC controllers, stable JSON responses, and exception handling.
- `config`: local settings, Hikari datasource, request-origin/host checks, body limits, and scheduled-task configuration.
- `persistence`: MyBatis Plus `BaseMapper` entities for users/workspaces and parameterized MyBatis mappers for joined records and transactional operations.
- `service`: registration/verification, workspace-related privacy, discussions, course-based mock exams, school RSS, local/cloud tutoring, and exam coaching.
- `security`: bounded request rates, salted scrypt hashes, SHA-256 token hashes, and constant-time password comparisons.
- `util`: bounded JSON/text helpers.

Account and verification writes use Spring transactions. Mock result updates are conditional on a missing result, so retries return the first saved submission. Chat uses an account/client identifier uniqueness constraint to prevent duplicate messages on retry. The database user remains limited to application-data operations.

## Migration compatibility

The existing MySQL installation is retained. No table is dropped or recreated by Spring Boot.

- Existing scrypt password hashes use their original textual salt and work without password resets.
- Existing hashed session tokens and cookie names remain valid.
- Workspace and imported portal JSON keep their current shapes and account ownership.
- Feed ciphertext retains the original `IV + tag + ciphertext` layout and the original private key.
- Chat, privacy choices, mock plans and saved results retain their existing table formats.
- Browser routes, React libraries and frontend storage keys remain unchanged.

`src/main/resources/catalogue.json` is an exported snapshot of the frontend's shared course/curriculum and checked algebra data. After content changes run `pnpm catalogue:export`, then rebuild. The Java runtime does not import JavaScript.

## Tests

```powershell
.\back-end\mvnw.cmd test

# Include real MySQL, with transactional rollback:
$env:ASTER_INTEGRATION_TESTS='true'
.\back-end\mvnw.cmd test
Remove-Item Env:ASTER_INTEGRATION_TESTS
```

`BackendRulesTest` contains 15 regression tests, including cross-language fixtures produced by the former implementation and tutor requests with or without selected course context. `MySqlIntegrationTest` contains 6 opt-in checks against the installed MySQL database, using TLS, the actual schema, and MockMvc. All test data is rolled back; scheduled jobs are disabled in that test context. These tests replace the retired Node backend tests; frontend checks live entirely in `front-end/src`.

The AI transport is injectable for deterministic provider tests. Tests never send a paid request or upload student documents to a cloud provider.

See the root [README](../README.md#backend-api) for the endpoint catalogue and product limitations.
