import test from 'node:test';
import assert from 'node:assert/strict';

import {
  LOOP_END_NODE_TYPE,
  getHistoryOutputMediaItems,
  normalizeFolderLoopFiles,
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
