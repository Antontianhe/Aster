CREATE DATABASE IF NOT EXISTS aster CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE aster;
CREATE TABLE IF NOT EXISTS schema_migrations(version VARCHAR(50) PRIMARY KEY, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS users(
 id CHAR(36) PRIMARY KEY, display_name VARCHAR(80) NOT NULL, grade VARCHAR(30),
 timezone VARCHAR(64) NOT NULL DEFAULT 'Europe/Berlin', preferences JSON,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS courses(
 id VARCHAR(40) PRIMARY KEY, name VARCHAR(100) NOT NULL, current_unit VARCHAR(200),
 source_url VARCHAR(1000), snapshot_at DATE, content JSON
);
CREATE TABLE IF NOT EXISTS materials(
 id CHAR(36) PRIMARY KEY, course_id VARCHAR(40) NOT NULL, title VARCHAR(250) NOT NULL,
 kind VARCHAR(30) NOT NULL, source_url VARCHAR(1000), content JSON,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(course_id) REFERENCES courses(id), INDEX idx_material_course(course_id,kind)
);
CREATE TABLE IF NOT EXISTS study_sets(
 id CHAR(36) PRIMARY KEY, owner_id CHAR(36) NOT NULL, course_id VARCHAR(40) NOT NULL,
 title VARCHAR(200) NOT NULL, source_url VARCHAR(1000), created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(owner_id) REFERENCES users(id), FOREIGN KEY(course_id) REFERENCES courses(id)
);
CREATE TABLE IF NOT EXISTS flashcards(
 id CHAR(36) PRIMARY KEY, study_set_id CHAR(36) NOT NULL, position SMALLINT UNSIGNED NOT NULL,
 question TEXT NOT NULL, answer TEXT NOT NULL, explanation TEXT, source_url VARCHAR(1000),
 FOREIGN KEY(study_set_id) REFERENCES study_sets(id) ON DELETE CASCADE,
 UNIQUE KEY uq_card_position(study_set_id,position)
);
CREATE TABLE IF NOT EXISTS tasks(
 id CHAR(36) PRIMARY KEY, user_id CHAR(36) NOT NULL, course_id VARCHAR(40),
 title VARCHAR(250) NOT NULL, kind ENUM('homework','assessment','revision','personal') NOT NULL DEFAULT 'homework',
 notes TEXT, due_at_utc DATETIME(3), due_date DATE, all_day BOOLEAN NOT NULL DEFAULT FALSE,
 timezone VARCHAR(64) NOT NULL DEFAULT 'Europe/Berlin', priority ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
 reminder_minutes INT UNSIGNED, completed_at DATETIME(3), checklist JSON, source_url VARCHAR(1000),
 source_id VARCHAR(100), deleted_at DATETIME(3), created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(course_id) REFERENCES courses(id),
 INDEX idx_task_due(user_id,completed_at,due_at_utc), INDEX idx_task_date(user_id,due_date),
 CONSTRAINT chk_task_date CHECK ((all_day=TRUE AND due_at_utc IS NULL) OR (all_day=FALSE AND due_date IS NULL))
);
CREATE TABLE IF NOT EXISTS learning_attempts(
 id CHAR(36) PRIMARY KEY, user_id CHAR(36) NOT NULL, course_id VARCHAR(40) NOT NULL,
 question TEXT NOT NULL, question_key VARCHAR(100) NOT NULL, selected_answer TEXT, expected_answer TEXT,
 is_correct BOOLEAN NOT NULL, confidence TINYINT UNSIGNED NOT NULL,
 hint_used BOOLEAN NOT NULL DEFAULT FALSE, reasoning TEXT, diagnosis VARCHAR(30), reflection TEXT,
 can_explain BOOLEAN NOT NULL DEFAULT FALSE, attempted_at DATETIME(3) NOT NULL,
 FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(course_id) REFERENCES courses(id),
 CONSTRAINT chk_confidence CHECK (confidence BETWEEN 1 AND 3),
 INDEX idx_attempt_history(user_id,course_id,question_key,attempted_at)
);
CREATE TABLE IF NOT EXISTS study_sessions(
 id CHAR(36) PRIMARY KEY, user_id CHAR(36) NOT NULL, course_id VARCHAR(40),
 kind VARCHAR(30) NOT NULL, title VARCHAR(250), score SMALLINT UNSIGNED, total SMALLINT UNSIGNED,
 duration_seconds INT UNSIGNED, content JSON, finished_at DATETIME(3) NOT NULL,
 FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(course_id) REFERENCES courses(id),
 CONSTRAINT chk_session_score CHECK (score IS NULL OR (total IS NOT NULL AND score<=total)),
 INDEX idx_sessions_user(user_id,finished_at)
);
CREATE TABLE IF NOT EXISTS course_progress(
 user_id CHAR(36) NOT NULL, course_id VARCHAR(40) NOT NULL, completed_stages JSON,
 best_score SMALLINT UNSIGNED NOT NULL DEFAULT 0, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 PRIMARY KEY(user_id,course_id), FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(course_id) REFERENCES courses(id)
);
CREATE TABLE IF NOT EXISTS reward_events(
 id CHAR(36) PRIMARY KEY, user_id CHAR(36) NOT NULL, session_id CHAR(36),
 idempotency_key VARCHAR(100) NOT NULL, xp_delta INT NOT NULL DEFAULT 0, currency_delta INT NOT NULL DEFAULT 0,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(session_id) REFERENCES study_sessions(id),
 UNIQUE KEY uq_reward_once(user_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS daily_activity(
 user_id CHAR(36) NOT NULL, local_date DATE NOT NULL, xp INT UNSIGNED NOT NULL DEFAULT 0,
 focus_minutes INT UNSIGNED NOT NULL DEFAULT 0, PRIMARY KEY(user_id,local_date), FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS reading_progress(
 user_id CHAR(36) NOT NULL, book_id VARCHAR(80) NOT NULL,
 status ENUM('not-started','reading','finished') NOT NULL DEFAULT 'not-started',
 is_saved BOOLEAN NOT NULL DEFAULT FALSE, page_index INT UNSIGNED NOT NULL DEFAULT 0, notes TEXT,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 PRIMARY KEY(user_id,book_id), FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS milestones(
 user_id CHAR(36) NOT NULL, milestone_key VARCHAR(100) NOT NULL, completed_at DATETIME(3), notes TEXT,
 PRIMARY KEY(user_id,milestone_key), FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS bookmarks(
 user_id CHAR(36) NOT NULL, resource_key VARCHAR(150) NOT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(user_id,resource_key), FOREIGN KEY(user_id) REFERENCES users(id)
);
INSERT IGNORE INTO schema_migrations(version) VALUES ('001_initial');
