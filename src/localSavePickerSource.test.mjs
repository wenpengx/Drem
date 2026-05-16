import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('local save picker uses the local server folder picker without browser upload fallback', () => {
  const appSource = readFileSync(new URL('./App.jsx', import.meta.url), 'utf8');
  const pickerStart = appSource.indexOf('const pickLocalSaveNodePath = useCallback');
  assert.notEqual(pickerStart, -1);

  const pickerEnd = appSource.indexOf('const handleVideoFileUpload', pickerStart);
  assert.notEqual(pickerEnd, -1);

  const pickerSource = appSource.slice(pickerStart, pickerEnd);
  assert.match(pickerSource, /\/pick-path/);
  assert.doesNotMatch(pickerSource, /document\.createElement\('input'\)/);
  assert.doesNotMatch(pickerSource, /webkitdirectory/);
});

test('local server exposes a native folder picker endpoint', () => {
  const serverSource = readFileSync(new URL('../localserver/dream_server/app.py', import.meta.url), 'utf8');
  assert.match(serverSource, /path == '\/pick-path'/);
  assert.match(serverSource, /handle_pick_path/);
});
