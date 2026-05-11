# Dream

Dream is a local-first visual AI workflow studio. It keeps the browser canvas experience intact while pairing it with a Python local server for file access, caching, proxying, and workflow automation.

## Highlights

- Visual node canvas for images, video, text, storyboards, previews, and local saving.
- Provider/model library with OpenAI-compatible, Jimeng, ComfyUI, and custom request template support.
- Local Python server on `http://127.0.0.1:9527` for large file handling, local cache, proxy requests, and ComfyUI middleware.
- Folder loop workflow: use a `选择文件夹` node to output a local folder path, connect it to a `For 循环` node, scan supported images into a list, then process each file through a connected AI image/video node in order.
- Local storage migration from earlier browser keys to `dream_*` keys so existing browser data can continue to load.

## Local Setup

### 1. Frontend

```powershell
npm install
npm run dev
```

Open the Vite URL printed in the terminal, usually `http://127.0.0.1:5173`.

### 2. Python Local Server

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r localserver\requirements.txt
python -m localserver.dream_server
```

The server defaults to `http://127.0.0.1:9527`.

### 3. Build

```powershell
npm run build
```

The production build is written to `dist/`.

## Folder Loop

1. Start the Python local server.
2. In Dream, create a `选择文件夹` node and enter a local folder path.
3. Create a `For 循环` node.
4. Connect `选择文件夹` to `For 循环`.
5. Connect `For 循环` to an `AI 绘图` or `AI 视频` node.
6. Click scan, then start the loop.

Supported image extensions:

`.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.bmp`, `.avif`, `.svg`

The For loop node turns the folder contents into a naturally sorted file list. The first image is sent to the downstream node, Dream waits for that generated task to finish or fail, then moves to the next image.

## Local Server API

- `GET /ping`
- `GET /status`
- `GET /config`
- `POST /config`
- `GET /list-files`
- `GET /file/<path>`
- `POST /save`
- `POST /save-batch`
- `POST /save-cache`
- `POST /delete-file`
- `POST /delete-batch`
- `POST /folder-loop/scan`
- `GET /folder-loop/file?scan_id=<id>&index=<n>`

## Notes

- Dream's runtime path is the local venv workflow above.
- GPLv3 licensing is preserved in [LICENSE](./LICENSE).
- Third-party integration names such as Jimeng, OpenAI, and ComfyUI are retained because they describe supported services.
