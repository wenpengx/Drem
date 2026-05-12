export const LOOP_END_NODE_TYPE = 'loop-end';

const IMAGE_FILE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.bmp',
  '.avif',
  '.svg',
]);

const FOLDER_LOOP_ACTION_NODE_TYPES = new Set([
  'gen-image',
  'gen-video',
  'local-save',
  'preview',
]);

export const isFolderLoopImageName = (name = '') => {
  const text = String(name || '').trim().toLowerCase();
  const dotIndex = text.lastIndexOf('.');
  if (dotIndex < 0) return false;
  return IMAGE_FILE_EXTENSIONS.has(text.slice(dotIndex));
};

const naturalSortKey = (value = '') => (
  String(value)
    .toLowerCase()
    .split(/(\d+)/)
    .map((part) => (/^\d+$/.test(part) ? Number(part) : part))
);

const naturalCompare = (left = '', right = '') => {
  const a = naturalSortKey(left);
  const b = naturalSortKey(right);
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i += 1) {
    if (a[i] === undefined) return -1;
    if (b[i] === undefined) return 1;
    if (a[i] === b[i]) continue;
    if (typeof a[i] === 'number' && typeof b[i] === 'number') {
      return a[i] - b[i];
    }
    return String(a[i]).localeCompare(String(b[i]));
  }
  return 0;
};

export const normalizeFolderLoopFiles = (files = [], makeUrl = () => '') => (
  Array.from(files || [])
    .filter((file) => file && isFolderLoopImageName(file.name || file.filename))
    .sort((a, b) => naturalCompare(a.name || a.filename, b.name || b.filename))
    .map((file, index) => {
      const filename = file.name || file.filename || `image-${index + 1}`;
      return {
        index,
        filename,
        name: filename,
        size: Number(file.size || 0),
        mtime: Number(file.lastModified || file.mtime || 0),
        url: makeUrl(file),
        source: 'browser-folder',
      };
    })
);

export const getFolderLoopPreviewFiles = (files = [], activeIndex = -1, options = {}) => {
  const parsedActiveIndex = Number(activeIndex);
  const hasActiveIndex = Number.isFinite(parsedActiveIndex) && parsedActiveIndex >= 0;
  const allFiles = Array.from(files || []).filter((file) => file && file.url);
  const limit = Math.max(1, Number(options.limit || 60));
  const activeListIndex = hasActiveIndex
    ? allFiles.findIndex((file, listIndex) => {
      const index = Number.isFinite(Number(file.index)) ? Number(file.index) : listIndex;
      return index === parsedActiveIndex;
    })
    : -1;
  let start = 0;
  let end = Math.min(allFiles.length, limit);
  if (allFiles.length > limit && activeListIndex >= 0) {
    start = Math.max(0, activeListIndex - Math.floor(limit / 2));
    end = Math.min(allFiles.length, start + limit);
    start = Math.max(0, end - limit);
  }

  return allFiles
    .slice(start, end)
    .map((file, listIndex) => {
      const originalListIndex = start + listIndex;
      const index = Number.isFinite(Number(file.index)) ? Number(file.index) : originalListIndex;
      const filename = file.filename || file.name || `image-${index + 1}`;
      return {
        id: `${index}-${filename}`,
        index,
        filename,
        url: file.url,
        isActive: hasActiveIndex && index === parsedActiveIndex,
      };
    });
};

export const getRunnableFolderLoopNode = (nodes = [], selectedIds = [], options = {}) => {
  const loopTypes = new Set(options.loopTypes || ['for-loop', 'folder-loop']);
  const blockedStatuses = new Set(options.blockedStatuses || ['running', 'scanning', 'selecting']);
  const allNodes = Array.isArray(nodes) ? nodes : [];
  const nodeMap = buildNodeMap(allNodes);
  const selected = Array.from(selectedIds || []).filter(Boolean);
  const isRunnable = (node) => {
    if (!node || !loopTypes.has(node.type)) return false;
    if (blockedStatuses.has(node.settings?.status)) return false;
    return Array.isArray(node.settings?.files) && node.settings.files.length > 0;
  };

  for (const id of selected) {
    const node = nodeMap.get(id);
    if (isRunnable(node)) return node;
  }

  if (selected.length > 0) return null;
  const runnableNodes = allNodes.filter(isRunnable);
  return runnableNodes.length === 1 ? runnableNodes[0] : null;
};

export const getFirstFolderLoopActionNode = (nodes = [], actionTypes = FOLDER_LOOP_ACTION_NODE_TYPES) => {
  const allowedTypes = actionTypes instanceof Set ? actionTypes : new Set(actionTypes || []);
  return (Array.isArray(nodes) ? nodes : []).find((node) => node && allowedTypes.has(node.type)) || null;
};

const buildNodeMap = (nodes = []) => new Map(
  (Array.isArray(nodes) ? nodes : [])
    .filter((node) => node && node.id)
    .map((node) => [node.id, node])
);

export const rewireLoopEndAfterConnection = (
  connections = [],
  nodes = [],
  startNodeId,
  insertedNodeId,
  makeId = () => `conn-${Date.now()}`
) => {
  const nodeMap = buildNodeMap(nodes);
  const insertedNode = nodeMap.get(insertedNodeId);
  if (!startNodeId || !insertedNodeId || insertedNode?.type === LOOP_END_NODE_TYPE) {
    return Array.isArray(connections) ? connections : [];
  }

  const list = Array.isArray(connections) ? connections : [];
  const directNonEndConnections = list.filter((conn) => (
    conn?.from === startNodeId && nodeMap.get(conn.to)?.type !== LOOP_END_NODE_TYPE
  ));
  if (directNonEndConnections.length > 0) return null;

  const directLoopEndConnections = list.filter((conn) => (
    conn?.from === startNodeId && nodeMap.get(conn.to)?.type === LOOP_END_NODE_TYPE
  ));
  if (directLoopEndConnections.length === 0) return list;

  const loopEndId = directLoopEndConnections[0].to;
  const next = list.filter((conn) => !(
    conn?.from === startNodeId && nodeMap.get(conn.to)?.type === LOOP_END_NODE_TYPE
  ));
  const alreadyConnected = next.some((conn) => conn?.from === insertedNodeId && conn?.to === loopEndId);
  if (alreadyConnected) return next;

  return [
    ...next,
    {
      id: makeId(startNodeId, insertedNodeId, loopEndId),
      from: insertedNodeId,
      to: loopEndId,
    },
  ];
};

export const resolveLinearLoopChain = (nodes = [], connections = [], startNodeId) => {
  const nodeMap = buildNodeMap(nodes);
  const startNode = nodeMap.get(startNodeId);
  if (!startNode) {
    return { ok: false, error: 'Loop start node not found', nodes: [], endNode: null };
  }

  const chain = [];
  const visited = new Set([startNodeId]);
  let currentId = startNodeId;

  for (let guard = 0; guard < 200; guard += 1) {
    const outgoing = (Array.isArray(connections) ? connections : [])
      .filter((conn) => conn?.from === currentId)
      .map((conn) => nodeMap.get(conn.to))
      .filter(Boolean);

    if (outgoing.length === 0) {
      return { ok: false, error: 'Loop is missing a loop end node', nodes: chain, endNode: null };
    }
    if (outgoing.length > 1) {
      return { ok: false, error: 'Folder loop currently supports a single path between start and end', nodes: chain, endNode: null };
    }

    const nextNode = outgoing[0];
    if (nextNode.type === LOOP_END_NODE_TYPE) {
      return { ok: true, error: '', nodes: chain, endNode: nextNode };
    }
    if (visited.has(nextNode.id)) {
      return { ok: false, error: 'Loop path contains a cycle before the loop end node', nodes: chain, endNode: null };
    }

    visited.add(nextNode.id);
    chain.push(nextNode);
    currentId = nextNode.id;
  }

  return { ok: false, error: 'Loop path is too long to resolve safely', nodes: chain, endNode: null };
};

export const getHistoryOutputMediaItems = (item, fallbackType = 'image') => {
  if (!item || typeof item !== 'object') return [];
  const type = item.type || fallbackType;
  const outputType = type === 'video' ? 'video' : 'image';
  const urls = [];
  const push = (url) => {
    const text = String(url || '').trim();
    if (!text || urls.includes(text)) return;
    urls.push(text);
  };

  if (Array.isArray(item.mjImages)) item.mjImages.forEach(push);
  if (Array.isArray(item.output_images)) item.output_images.forEach(push);
  push(item.url);
  push(item.originalUrl);
  push(item.mjOriginalUrl);

  return urls.map((url) => ({ url, type: outputType }));
};
