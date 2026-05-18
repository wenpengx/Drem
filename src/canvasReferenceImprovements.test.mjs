import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const appSource = readFileSync(new URL('./App.jsx', import.meta.url), 'utf8');

test('canvas accepts dropped local media files as new nodes', () => {
  assert.match(appSource, /readDroppedFileAsDataUrl/);
  assert.match(appSource, /e\.dataTransfer\?\.files\?\.length/);
  assert.match(appSource, /addNode\('input-image'/);
  assert.match(appSource, /addNode\('video-input'/);
  assert.match(appSource, /isCanvasFileDragActive/);
});

test('connected node drop suppresses empty-canvas quick add menu', () => {
  assert.match(appSource, /connectionDropHandledRef/);
  assert.match(appSource, /connectionDropHandledRef\.current = true/);
  assert.match(appSource, /\(connectingSource \|\| connectingTarget\) && !connectionDropHandledRef\.current/);
});
