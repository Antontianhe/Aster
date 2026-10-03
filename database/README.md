# Aster MySQL database

This folder contains the MySQL schema, course seed data, migrations, and installation/management tools. The running database uses MySQL Community Server **8.4.11 LTS** on Windows x64.

The **live data directory is deliberately outside this repository and OneDrive**. Reorganizing the project does not move or recreate an existing database. The Java backend connects to that same installation using MyBatis Plus and MySQL Connector/J.

## Connection and private files

| Item | Default |
| --- | --- |
| Host / port | `127.0.0.1:3306` |
| Database | `aster` |
| Application user | `aster_app` |
| Character set / collation | `utf8mb4` / `utf8mb4_0900_ai_ci` |
| Session time zone | UTC; user calendar operations use Europe/Berlin |
| Transport | TLS required, CA verified by the Java client |
| App privileges | SELECT, INSERT, UPDATE and DELETE in `aster` only |

The installer uses these private locations:

```text
%LOCALAPPDATA%/Aster/
├── mysql-8.4.11-winx64/      Official server binaries
└── mysql-instance/
    ├── data/               MySQL data and generated CA certificate
    ├── app.env             Backend connection credentials
    ├── app.cnf             Application CLI connection settings
    ├── root.cnf            Maintenance account connection settings
    ├── my.ini              Server configuration
    ├── feed-encryption.key Private RSS encryption key
    ├── configured.json     Installation marker
    ├── mysql.err           Server log
    └── backups/            Timestamped SQL backups
```

Credentials are randomly generated. Directory permissions restrict access to the installing Windows user, SYSTEM and local administrators. Do not copy these private files into Git, `front-end/public`, browser code, or a `VITE_` variable. `.env.example` contains placeholders only.

## New installation

Use Python 3.11+ from the project root:

```powershell
py -3 database/download_mysql.py
py -3 database/setup_mysql.py
```

The download script retrieves the official Oracle archive, checks its published checksum and checks extraction paths. Setup creates an isolated instance, generates credentials, limits application privileges, and applies all numbered SQL migrations. It refuses to overwrite an initialized data directory or an occupied port 3306.

The supplied scripts target Windows x64. If using a separate existing MySQL server, have its administrator apply the schema and provision a restricted TLS-required user; configure the backend's private environment and trusted CA accordingly. Do not run the isolated-instance installer against an unrelated server.

## Existing installation and migrations

```powershell
.\database\manage.ps1 -Action Start
py -3 database/migrate.py
```

`schema_migrations` records applied versions. The Java service does not execute schema creation at startup and does not need administrator credentials.

| Migration | Contents |
| --- | --- |
| `001_schema.sql` | 15 base tables: users, courses, materials, study sets, flashcards, tasks, attempts, sessions, progress, reward events, daily activity, reading progress, milestones, bookmarks, migration tracking |
| `002_courses.sql` | Thirteen source-linked school course snapshots |
| `003_accounts.sql` | Credentials, sessions, account workspace snapshots, imported portal records |
| `004_school_feeds.sql` | Encrypted private Schoolbox RSS connections and cached news |
| `005_community.sql` | Discussion messages and reports |
| `006_mock_exams.sql` | Exam plans, generated papers and first saved results |
| `007_onboarding.sql` | Contact/consent preferences, preview verification challenges, explicit owner roles |

Together these migrations define **26 tables**. The existing frontend continues to synchronize account-scoped workspace JSON; not every learning feature writes directly to a dedicated relational table. The schema includes tables reserved for more granular persistence.

## Daily management

```powershell
.\database\manage.ps1 -Action Status
.\database\manage.ps1 -Action Start
.\database\manage.ps1 -Action Stop
.\database\manage.ps1 -Action Backup
.\database\manage.ps1 -Action Connect
```

- `Start` launches a hidden local process, preserving existing data.
- `Stop` requests a normal MySQL shutdown.
- `Status` checks the version, active database account and TLS connection.
- `Backup` uses a transaction-consistent SQL dump in the private `backups/` folder.
- `Connect` opens the CLI with the restricted application account.

No Windows service, scheduled startup task, firewall rule, or public listener is installed. `Start-Aster.cmd` at the repository root starts MySQL along with the app after a computer restart.

## Backup and recovery

Back up before schema changes. Preserve both the SQL dump and the private feed-encryption key securely; the key is needed to decrypt saved RSS links. A browser workspace export is not a substitute for this database backup.

Restore is an explicit administrator operation, not an automatic startup action. Stop the app, inspect the chosen dump, and restore into an appropriate isolated instance using the maintenance account. The project intentionally does not provide a one-click command that overwrites an existing database.

A pre-migration SQL backup was created before validating the Java backend. It remains in the original installation's private backup directory and is not uploaded to GitHub.

## Validation

```powershell
py -3 database/smoke_test.py
$env:ASTER_INTEGRATION_TESTS='true'
.\back-end\mvnw.cmd test
Remove-Item Env:ASTER_INTEGRATION_TESTS
```

The Java integration suite uses the actual MySQL schema over TLS and rolls back temporary account, chat, privacy, workspace, and mock-exam records. It checks authentication boundaries, isolation, ownership, retries and saved results. Separate Java fixtures confirm compatibility with the previous password and encrypted-feed formats.

The previous local setup also checked Unicode storage, restart persistence and application-account permission limits. Real user accounts are not used as test fixtures.

Official references: [MySQL downloads](https://dev.mysql.com/downloads/mysql/8.4.html), [initializing the data directory](https://dev.mysql.com/doc/refman/8.4/en/data-directory-initialization.html), [running MySQL on Windows](https://dev.mysql.com/doc/refman/8.4/en/windows-start-command-line.html).
