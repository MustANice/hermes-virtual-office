import { WaypointGraph } from './src/engine/WaypointGraph.ts';
import { ROOMS } from './src/engine/OfficeMap.ts';

const nav = new WaypointGraph();
const waypoints = nav.waypoints;
console.log(`Loaded ${waypoints.size} waypoints.`);

let failures = 0;

// 1. Check all nodes have coordinates and valid numbers
for (const [id, wp] of waypoints.entries()) {
  if (!Number.isFinite(wp.x) || !Number.isFinite(wp.y)) {
    console.error(`[FAIL] Waypoint ${id} has non-finite coordinates: (${wp.x}, ${wp.y})`);
    failures++;
  }
}

// 2. Check all neighbor references exist
for (const [id, wp] of waypoints.entries()) {
  for (const neighborId of wp.neighbors) {
    if (!waypoints.has(neighborId)) {
      console.error(`[FAIL] Waypoint ${id} has dangling neighbor: ${neighborId}`);
      failures++;
    }
  }
}

// 3. Check graph connectivity (BFS from desk_orion to all other nodes)
const visited = new Set();
const queue = ['desk_orion'];
visited.add('desk_orion');

while (queue.length > 0) {
  const currentId = queue.shift();
  const node = waypoints.get(currentId);
  for (const n of node.neighbors) {
    if (!visited.has(n)) {
      visited.add(n);
      queue.push(n);
    }
  }
}

for (const id of waypoints.keys()) {
  if (!visited.has(id)) {
    console.error(`[FAIL] Waypoint ${id} is disconnected from graph (not reachable from desk_orion)`);
    failures++;
  }
}

console.log(`Connectivity check: ${visited.size} / ${waypoints.size} nodes reachable.`);

// 4. Room Waypoint Containment Check
const roomMap = new Map();
for (const r of ROOMS) {
  roomMap.set(r.id, r);
}

const ROOM_PREFIX_MAP = {
  desk_orion: 'manager',
  manager_door: 'manager',
  desk_forge: 'dev',
  desk_frame: 'dev',
  desk_aurora: 'dev',
  dev_internal_hub: 'dev',
  dev_door: 'dev',
  desk_radar: 'research',
  desk_quant: 'research',
  research_hub: 'research',
  research_door: 'research',
  meeting_door_n: 'meeting',
  meeting_table_n: 'meeting',
  meeting_table_s: 'meeting',
  meeting_door_s: 'meeting',
  desk_prism: 'qa_security',
  desk_lens: 'qa_security',
  desk_sentinel: 'qa_security',
  qa_hub: 'qa_security',
  qa_door: 'qa_security',
  lounge_entrance: 'lounge',
  lounge_hub: 'lounge',
  desk_nexus: 'lounge',
  lounge_coffee: 'lounge',
  lounge_sofa_l: 'lounge',
  lounge_sofa_r: 'lounge',
  desk_atlas: 'server_room',
  server_racks: 'server_room',
  server_hub: 'server_room',
  server_door: 'server_room',
};

for (const [wpId, roomId] of Object.entries(ROOM_PREFIX_MAP)) {
  const wp = waypoints.get(wpId);
  const room = roomMap.get(roomId);
  if (!wp) {
    console.error(`[FAIL] Expected waypoint ${wpId} not found in graph`);
    failures++;
    continue;
  }
  // Check if waypoint is within room bounding box (with 20px tolerance for doors on boundary)
  const isInsideOrDoor = (wp.x >= room.x - 20 && wp.x <= room.x + room.w + 20) &&
                         (wp.y >= room.y - 20 && wp.y <= room.y + room.h + 20);
  if (!isInsideOrDoor) {
    console.error(`[FAIL] Waypoint ${wpId} (${wp.x}, ${wp.y}) outside room ${roomId} bounds:`, room);
    failures++;
  } else {
    console.log(`[PASS] Waypoint ${wpId} within room ${roomId} envelope.`);
  }
}

if (failures === 0) {
  console.log(`\n========================================`);
  console.log(`WAYPOINT GRAPH VERIFICATION RESULT: ALL PASS (30/30 nodes valid and fully connected)`);
  console.log(`========================================\n`);
} else {
  console.error(`\nFAILED: ${failures} issues found.`);
  process.exit(1);
}
