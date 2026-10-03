"""Check real DB integrity and permissions without leaving test data."""
from pathlib import Path
import os, subprocess
root=Path(os.environ['LOCALAPPDATA'])/'Aster'
client=root/'mysql-8.4.11-winx64/bin/mysql.exe'
cnf=root/'mysql-instance/app.cnf'
def sql(statement,extra=()):
    return subprocess.run([str(client),f'--defaults-extra-file={cnf}','--database=aster','--batch','--skip-column-names',*extra],input=statement,text=True,encoding='utf-8',capture_output=True)
query="""
SET @uid=UUID();
START TRANSACTION;
INSERT INTO users(id,display_name) VALUES(@uid,'数据库验证 · 蓝色恐龙 🦕');
INSERT INTO tasks(id,user_id,title,all_day,due_date) VALUES(UUID(),@uid,'Review course materials',TRUE,'2026-09-24');
INSERT INTO learning_attempts(id,user_id,course_id,question,question_key,is_correct,confidence,attempted_at) VALUES(UUID(),@uid,'maths','What is 2+2?','qa-only',TRUE,2,UTC_TIMESTAMP(3));
SELECT display_name FROM users WHERE id=@uid;
SELECT COUNT(*) FROM tasks WHERE user_id=@uid;
UPDATE tasks SET title='Updated test task' WHERE user_id=@uid;
DELETE FROM tasks WHERE user_id=@uid;
ROLLBACK;
SELECT COUNT(*) FROM users WHERE id=@uid;
"""
result=sql(query)
if result.returncode: raise SystemExit('Database transaction test failed: '+result.stderr)
assert result.stdout.strip().splitlines()==['数据库验证 · 蓝色恐龙 🦕','1','0'],result.stdout
assert sql('CREATE TABLE aster.__forbidden_ddl(id INT);').returncode!=0, 'App account unexpectedly has DDL privileges'
assert sql('SELECT User FROM mysql.user;').returncode!=0, 'App account can access administrative account data'
assert sql('SELECT 1;',('--ssl-mode=DISABLED',)).returncode!=0, 'Application account accepted an unencrypted connection'
bad=sql("START TRANSACTION; SET @u=UUID(); INSERT INTO users(id,display_name) VALUES(@u,'constraint check'); INSERT INTO learning_attempts(id,user_id,course_id,question,question_key,is_correct,confidence,attempted_at) VALUES(UUID(),@u,'maths','x','qa',TRUE,9,UTC_TIMESTAMP()); ROLLBACK;")
assert bad.returncode!=0 and '3819' in bad.stderr, 'Confidence constraint was not enforced'
print('PASS: Unicode round-trip; transactional create/read/update/delete; rollback; confidence constraint; DDL/admin access denied; TLS required.')
