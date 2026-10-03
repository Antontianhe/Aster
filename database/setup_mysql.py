"""Configure an isolated local MySQL instance. Never prints credentials."""
from pathlib import Path
import csv, io, json, os, re, secrets, socket, subprocess, time
root=Path(os.environ['LOCALAPPDATA'])/'Aster'
binary=root/'mysql-8.4.11-winx64'/'bin'
instance=root/'mysql-instance'
schema=Path(__file__).with_name('001_schema.sql')
if (instance/'configured.json').exists():
    print('Aster MySQL is already configured; use database/manage.ps1.')
    raise SystemExit(0)
if (instance/'data').exists():
    raise SystemExit('An initialized data directory exists; it will not be overwritten.')
with socket.socket() as probe:
    if probe.connect_ex(('127.0.0.1',3306))==0:
        raise SystemExit('Port 3306 is occupied; refusing to replace an existing server.')
instance.mkdir(parents=True,exist_ok=True)
identity=subprocess.check_output(['whoami','/user','/fo','csv','/nh'],text=True)
sid=list(csv.reader(io.StringIO(identity)))[0][1]
subprocess.run(['icacls',str(instance),'/inheritance:r','/grant:r',f'*{sid}:(OI)(CI)F','*S-1-5-18:(OI)(CI)F','*S-1-5-32-544:(OI)(CI)F'],check=True,capture_output=True)
(instance/'backups').mkdir(exist_ok=True)
data=instance/'data'
initlog=instance/'initialization.log'
config=instance/'my.ini'
config.write_text(f'''[mysqld]
basedir={binary.parent.as_posix()}
datadir={data.as_posix()}
port=3306
bind-address=127.0.0.1
mysqlx=0
character-set-server=utf8mb4
collation-server=utf8mb4_0900_ai_ci
default-time-zone=+00:00
innodb-buffer-pool-size=128M
max-connections=40
local-infile=0
secure-file-priv=NULL
log-error={(instance/'mysql.err').as_posix()}
pid-file={(instance/'mysql.pid').as_posix()}
sql-mode=STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION
''',encoding='utf-8')
result=subprocess.run([str(binary/'mysqld.exe'),'--no-defaults','--initialize',f'--basedir={binary.parent}',f'--datadir={data}',f'--log-error={initlog}'],capture_output=True,text=True)
if result.returncode:
    raise SystemExit(f'Initialization failed; inspect private log: {initlog}')
match=re.search(r'temporary password is generated for root@localhost: (.+)',initlog.read_text(encoding='utf-8'))
if not match:
    raise SystemExit('Temporary password not found in private initialization log.')
temporary=match.group(1).strip()
root_password=secrets.token_hex(32)+'Aa!9'
app_password=secrets.token_hex(32)+'Bb!9'
def client_file(path,user,password):
    escaped=password.replace('\\','\\\\').replace('"','\\"')
    path.write_text(f'[client]\nuser={user}\npassword="{escaped}"\nhost=127.0.0.1\nport=3306\nprotocol=TCP\nssl-mode=REQUIRED\ndefault-character-set=utf8mb4\n',encoding='utf-8')
bootstrap=instance/'bootstrap.cnf'
client_file(bootstrap,'root',temporary)
client_file(instance/'root.cnf','root',root_password)
client_file(instance/'app.cnf','aster_app',app_password)
(instance/'app.env').write_text(f'DB_HOST=127.0.0.1\nDB_PORT=3306\nDB_NAME=aster\nDB_USER=aster_app\nDB_PASSWORD={app_password}\nDB_SSL=true\n',encoding='utf-8')
subprocess.run(['powershell.exe','-NoProfile','-Command',f"Start-Process -FilePath '{binary/'mysqld.exe'}' -ArgumentList '--defaults-file={config}' -WindowStyle Hidden"],check=True,capture_output=True)
for _ in range(60):
    with socket.socket() as probe:
        if probe.connect_ex(('127.0.0.1',3306))==0: break
    time.sleep(.5)
else:
    raise SystemExit(f'Server did not start. Inspect {instance/"mysql.err"}.')
def sql(path,text):
    run=subprocess.run([str(binary/'mysql.exe'),f'--defaults-extra-file={path}','--connect-expired-password','--batch','--skip-column-names'],input=text,text=True,encoding='utf-8',capture_output=True)
    if run.returncode:
        raise RuntimeError(f'Database command failed ({run.returncode}); credentials not printed.')
    return run.stdout.strip()
sql(bootstrap,f"ALTER USER 'root'@'localhost' IDENTIFIED BY '{root_password}';")
bootstrap.unlink()
sql(instance/'root.cnf',schema.read_text(encoding='utf-8'))
seed=Path(__file__).with_name('002_courses.sql')
if seed.exists(): sql(instance/'root.cnf',seed.read_text(encoding='utf-8'))
for migration in sorted(Path(__file__).parent.glob('0*.sql')):
 if migration.name[:3] not in ['001','002']:sql(instance/'root.cnf',migration.read_text(encoding='utf-8'))
sql(instance/'root.cnf',f"CREATE USER 'aster_app'@'127.0.0.1' IDENTIFIED BY '{app_password}' REQUIRE SSL; GRANT SELECT,INSERT,UPDATE,DELETE ON aster.* TO 'aster_app'@'127.0.0.1';")
result=sql(instance/'app.cnf','USE aster; SELECT VERSION(),DATABASE(); SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE();')
(instance/'configured.json').write_text(json.dumps({'version':'8.4.11','host':'127.0.0.1','port':3306,'database':'aster','user':'aster_app','data_directory':str(data)},indent=2),encoding='utf-8')
print('MySQL configured with a password-protected app account and local TLS connections.')
print(result)
print(f'Private configuration: {instance}')
