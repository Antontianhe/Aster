from pathlib import Path
import os,subprocess
root=Path(os.environ['LOCALAPPDATA'])/'Aster'
client=root/'mysql-8.4.11-winx64/bin/mysql.exe'
config=root/'mysql-instance/root.cnf'
for path in sorted(Path(__file__).parent.glob('0*.sql')):
 if path.name[:3] in ['001','002']:continue
 result=subprocess.run([str(client),f'--defaults-extra-file={config}','--default-character-set=utf8mb4','--batch'],input=path.read_text(encoding='utf-8'),text=True,encoding='utf-8',capture_output=True)
 if result.returncode:raise RuntimeError(f'Migration failed: {path.name}. {result.stderr[:200]}')
 print('Applied',path.name)
