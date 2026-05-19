# Dream Local Server

The Dream local server provides local file saving, local cache access, CORS proxying, ComfyUI middleware, and For-loop image-folder scanning.

## Start With venv

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r localserver\requirements.txt
python -m localserver.dream_server
```

Optional arguments:

```powershell
python -m localserver.dream_server --port 9527 --dir "$HOME\Downloads\Dream"
```

## Config

Edit `localserver/dream-local-config.json` when you need persistent defaults.

```json
{
  "allowed_roots": ["~/Downloads", "D:\\DreamData"],
  "proxy_timeout": 300,
  "features": {
    "file_server": true,
    "proxy_server": true,
    "comfy_middleware": true,
    "log_console": true
  }
}
```

Folder-loop scanning uses explicit user-provided local paths. It is intended for a local trusted desktop workflow.

## Health Checks

```powershell
curl http://127.0.0.1:9527/ping
curl http://127.0.0.1:9527/status
```

## API Discovery

The server exposes a read-only API catalog for the frontend, scripts, or external workflow tools:

```powershell
curl http://127.0.0.1:9527/api
curl http://127.0.0.1:9527/api/schema
```

The response includes the current base URL, feature flags, save paths, media conversion status, and supported endpoints such as `/save`, `/save-batch`, `/save-cache`, `/list-files`, `/pick-path`, `/folder-loop/scan`, `/folder-loop/file`, `/proxy`, and `/comfy/*`.

## Folder Loop API

```powershell
curl -Method POST http://127.0.0.1:9527/folder-loop/scan `
  -ContentType "application/json" `
  -Body '{"path":"D:\\images"}'
```

The response contains a `scan_id` and a naturally sorted list of image files. Images can be read through:

```text
http://127.0.0.1:9527/folder-loop/file?scan_id=<id>&index=<n>
```
