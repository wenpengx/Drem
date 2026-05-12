import test from 'node:test';
import assert from 'node:assert/strict';

import {
  LOOP_END_NODE_TYPE,
  getFirstFolderLoopActionNode,
  getFolderLoopPreviewFiles,
  getRunnableFolderLoopNode,
  getHistoryOutputMediaItems,
  normalizeFolderLoopFiles,
  rewireLoopEndAfterConnection,
  resolveLinearLoopChain,
} from './folderLoopUtils.js';

test('normalizeFolderLoopFiles keeps image files and sorts them naturally', () => {
  const files = normalizeFolderLoopFiles([
    { name: 'shot-10.png', size: 10, lastModified: 1000 },
    { name: 'notes.txt', size: 1, lastModified: 1000 },
    { name: 'shot-2.JPG', size: 20, lastModified: 2000 },
    { name: 'shot-1.webp', size: 30, lastModified: 3000 },
  ], (file) => `blob:${file.name}`);

  assert.deepEqual(files.map((file) => file.filename), [
    'shot-1.webp',
    'shot-2.JPG',
    'shot-10.png',
  ]);
  assert.equal(files[0].index, 0);
  assert.equal(files[0].url, 'blob:shot-1.webp');
  assert.equal(files[0].source, 'browser-folder');
});

test('resolveLinearLoopChain returns the nodes between the loop start and end', () => {
  const nodes = [
    { id: 'start', type: 'for-loop' },
    { id: 'image', type: 'gen-image' },
    { id: 'video', type: 'gen-video' },
    { id: 'end', type: LOOP_END_NODE_TYPE },
    { id: 'outside', type: 'gen-image' },
  ];
  const connections = [
    { from: 'start', to: 'image' },
    { from: 'image', to: 'video' },
    { from: 'video', to: 'end' },
    { from: 'end', to: 'outside' },
  ];

  const result = resolveLinearLoopChain(nodes, connections, 'start');

  assert.equal(result.ok, true);
  assert.equal(result.endNode.id, 'end');
  assert.deepEqual(result.nodes.map((node) => node.id), ['image', 'video']);
});

test('resolveLinearLoopChain rejects branches inside a loop', () => {
  const nodes = [
    { id: 'start', type: 'for-loop' },
    { id: 'a', type: 'gen-image' },
    { id: 'b', type: 'gen-video' },
    { id: 'end', type: LOOP_END_NODE_TYPE },
  ];
  const connections = [
    { from: 'start', to: 'a' },
    { from: 'start', to: 'b' },
    { from: 'a', to: 'end' },
    { from: 'b', to: 'end' },
  ];

  const result = resolveLinearLoopChain(nodes, connections, 'start');

  assert.equal(result.ok, false);
  assert.match(result.error, /single path/i);
});

test('getHistoryOutputMediaItems extracts image and video outputs for chaining', () => {
  assert.deepEqual(getHistoryOutputMediaItems({
    id: 'image-task',
    type: 'image',
    output_images: ['https://example.com/a.png', 'https://example.com/b.png'],
  }), [
    { url: 'https://example.com/a.png', type: 'image' },
    { url: 'https://example.com/b.png', type: 'image' },
  ]);

  assert.deepEqual(getHistoryOutputMediaItems({
    id: 'video-task',
    type: 'video',
    url: 'https://example.com/movie.mp4',
  }), [
    { url: 'https://example.com/movie.mp4', type: 'video' },
  ]);
});

test('getFolderLoopPreviewFiles marks the active image and keeps filenames for thumbnails', () => {
  const previews = getFolderLoopPreviewFiles([
    { index: 0, filename: 'shot-1.png', url: 'blob:shot-1' },
    { index: 1, filename: 'shot-2.png', url: 'blob:shot-2' },
    { index: 2, filename: 'shot-3.png', url: 'blob:shot-3' },
  ], 1);

  assert.deepEqual(previews, [
    {
      id: '0-shot-1.png',
      index: 0,
      filename: 'shot-1.png',
      url: 'blob:shot-1',
      isActive: false,
    },
    {
      id: '1-shot-2.png',
      index: 1,
      filename: 'shot-2.png',
      url: 'blob:shot-2',
      isActive: true,
    },
    {
      id: '2-shot-3.png',
      index: 2,
      filename: 'shot-3.png',
      url: 'blob:shot-3',
      isActive: false,
    },
  ]);
});

test('getFolderLoopPreviewFiles limits large folders around the active image', () => {
  const files = Array.from({ length: 100 }, (_, index) => ({
    index,
    filename: `shot-${index}.png`,
    url: `blob:shot-${index}`,
  }));

  const previews = getFolderLoopPreviewFiles(files, 50, { limit: 9 });

  assert.equal(previews.length, 9);
  assert.deepEqual(previews.map((file) => file.index), [46, 47, 48, 49, 50, 51, 52, 53, 54]);
  assert.equal(previews[4].isActive, true);
});

test('getRunnableFolderLoopNode prefers a selected runnable loop', () => {
  const nodes = [
    { id: 'first', type: 'for-loop', settings: { files: [{ url: 'blob:first' }], status: 'ready' } },
    { id: 'selected', type: 'for-loop', settings: { files: [{ url: 'blob:selected' }], status: 'idle' } },
  ];

  const node = getRunnableFolderLoopNode(nodes, ['selected']);

  assert.equal(node.id, 'selected');
});

test('getRunnableFolderLoopNode falls back to the first ready loop and skips running loops', () => {
  const nodes = [
    { id: 'running', type: 'for-loop', settings: { files: [{ url: 'blob:running' }], status: 'running' } },
    { id: 'empty', type: 'for-loop', settings: { files: [], status: 'ready' } },
    { id: 'ready', type: 'folder-loop', settings: { files: [{ url: 'blob:ready' }], status: 'completed' } },
  ];

  const node = getRunnableFolderLoopNode(nodes, []);

  assert.equal(node.id, 'ready');
});

test('getRunnableFolderLoopNode does not fall back when selection is explicit but not runnable', () => {
  const nodes = [
    { id: 'selected-empty', type: 'for-loop', settings: { files: [], status: 'ready' } },
    { id: 'ready', type: 'for-loop', settings: { files: [{ url: 'blob:ready' }], status: 'ready' } },
  ];

  const node = getRunnableFolderLoopNode(nodes, ['selected-empty']);

  assert.equal(node, null);
});

test('getRunnableFolderLoopNode does not pick between multiple unselected runnable loops', () => {
  const nodes = [
    { id: 'first', type: 'for-loop', settings: { files: [{ url: 'blob:first' }], status: 'ready' } },
    { id: 'second', type: 'for-loop', settings: { files: [{ url: 'blob:second' }], status: 'ready' } },
  ];

  const node = getRunnableFolderLoopNode(nodes, []);

  assert.equal(node, null);
});

test('rewireLoopEndAfterConnection moves the loop end after an inserted downstream node', () => {
  const nodes = [
    { id: 'start', type: 'for-loop' },
    { id: 'image', type: 'gen-image' },
    { id: 'end', type: LOOP_END_NODE_TYPE },
  ];
  const connections = [
    { id: 'start-end', from: 'start', to: 'end' },
  ];

  const rewired = rewireLoopEndAfterConnection(connections, nodes, 'start', 'image', () => 'image-end');

  assert.deepEqual(rewired, [
    { id: 'image-end', from: 'image', to: 'end' },
  ]);
});

test('rewireLoopEndAfterConnection rejects a second direct branch from the loop start', () => {
  const nodes = [
    { id: 'start', type: 'for-loop' },
    { id: 'first', type: 'gen-image' },
    { id: 'second', type: 'gen-video' },
    { id: 'end', type: LOOP_END_NODE_TYPE },
  ];
  const connections = [
    { id: 'start-first', from: 'start', to: 'first' },
    { id: 'first-end', from: 'first', to: 'end' },
  ];

  const rewired = rewireLoopEndAfterConnection(connections, nodes, 'start', 'second', () => 'second-end');

  assert.equal(rewired, null);
});

test('getFirstFolderLoopActionNode recognizes non-generation loop actions', () => {
  const chainNodes = [
    { id: 'save', type: 'local-save' },
    { id: 'preview', type: 'preview' },
  ];

  const node = getFirstFolderLoopActionNode(chainNodes);

  assert.equal(node.id, 'save');
});
