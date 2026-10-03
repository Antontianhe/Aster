"""Install the official Ollama portable release; preserve existing files and models."""
import hashlib, json, os, pathlib, subprocess, urllib.request, zipfile
root=pathlib.Path(os.environ['LOCALAPPDATA'])/'Aster'
root.mkdir(parents=True,exist_ok=True)
target=root/'ollama-0.34.2'; archive=root/'ollama-windows-amd64-0.34.2.zip'
url='https://github.com/ollama/ollama/releases/download/v0.34.2/ollama-windows-amd64.zip'
expected='8f3fd071a2a2f9497b562f43502c77c2b701a99d1ee5dfda28da8c786373063b'
if not archive.exists():
 print('Downloading official Ollama portable package (1.46 GB).',flush=True)
 urllib.request.urlretrieve(url,archive)
with archive.open('rb') as stream:
 digest=hashlib.file_digest(stream,'sha256').hexdigest()
if digest!=expected: raise RuntimeError('Official package checksum mismatch')
if not (target/'ollama.exe').exists():
 print('Checksum verified. Extracting.',flush=True)
 with zipfile.ZipFile(archive) as z:
  for item in z.infolist():
   if not (target/item.filename).resolve().is_relative_to(target.resolve()): raise RuntimeError('Unsafe archive path')
  z.extractall(target)
env={**os.environ,'OLLAMA_HOST':'127.0.0.1:11434','OLLAMA_MODELS':str(root/'ai-models'),'OLLAMA_NO_CLOUD':'1','OLLAMA_CONTEXT_LENGTH':'4096'}
import time
def ready():
 try:
  with urllib.request.urlopen('http://127.0.0.1:11434/api/tags',timeout=2) as response:return response.status==200
 except Exception:return False
if not ready():
 with (root/'ollama.log').open('ab') as log:
  subprocess.Popen([str(target/'ollama.exe'),'serve'],env=env,stdout=log,stderr=log,creationflags=subprocess.CREATE_NO_WINDOW)
 for attempt in range(60):
  if ready():break
  time.sleep(.5)
 else:raise RuntimeError('Ollama did not start. Check the private ollama.log.')
print('Downloading Qwen 3.5 2B model (about 2.7 GB).',flush=True)
subprocess.run([str(target/'ollama.exe'),'pull','qwen3.5:2b'],env=env,check=True,stdout=subprocess.DEVNULL)
print('Local AI installed and model ready.',flush=True)
