# Dream ComfyUI Middleware

Dream can expose local ComfyUI workflows through the same local server used by the browser app.

## Template Layout

```text
localserver/
  dream_server/
  workflows/
    your-workflow/
      template.json
      meta.json
```

`template.json` is the ComfyUI API workflow export. `meta.json` maps Dream inputs to workflow fields.

## Common Endpoints

```text
GET  /comfy/apps
POST /comfy/queue
GET  /comfy/status/<requestId>
GET  /w/v1/webapp/task/openapi/detail?requestId=<requestId>
```

ComfyUI defaults to `http://127.0.0.1:8188`.
