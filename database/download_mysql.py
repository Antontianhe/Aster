"""Install the official, checksum-verified Windows archive into local app data."""
from pathlib import Path
import hashlib
import os
import urllib.request
import zipfile

VERSION = '8.4.11'
EXPECTED_MD5 = '2e833921898a9a030ea6bfe81bd811bc'
root = Path(os.environ['LOCALAPPDATA']) / 'Aster'
archive = root / f'mysql-{VERSION}-winx64.zip'
target = root / f'mysql-{VERSION}-winx64'
root.mkdir(parents=True, exist_ok=True)
if not archive.exists():
    request = urllib.request.Request(f'https://cdn.mysql.com/Downloads/MySQL-8.4/mysql-{VERSION}-winx64.zip', headers={'User-Agent': 'Aster-local-setup/1.0'})
    partial = archive.with_suffix('.download')
    with urllib.request.urlopen(request, timeout=30) as response, partial.open('wb') as out:
        if not response.url.startswith('https://cdn.mysql.com/'):
            raise RuntimeError('Unexpected download destination')
        total = 0
        next_report = 64 * 1024 * 1024
        while chunk := response.read(1024 * 1024):
            out.write(chunk)
            total += len(chunk)
            if total >= next_report:
                print(f'Downloaded {total // (1024 * 1024)} MiB', flush=True)
                next_report += 64 * 1024 * 1024
    partial.replace(archive)
with archive.open('rb') as handle:
    actual = hashlib.file_digest(handle, 'md5').hexdigest()
if actual != EXPECTED_MD5:
    raise RuntimeError('Official archive checksum does not match; nothing will be run')
print('Official archive checksum verified.', flush=True)
if not (target / 'bin' / 'mysqld.exe').exists():
    with zipfile.ZipFile(archive) as bundle:
        for item in bundle.infolist():
            resolved = (root / item.filename).resolve()
            if not resolved.is_relative_to(target.resolve()):
                raise RuntimeError('Archive member leaves the expected installation directory')
        bundle.extractall(root)
print(f'MySQL {VERSION} extracted to {target}', flush=True)
