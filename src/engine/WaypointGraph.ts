export interface Waypoint {
  id: string;
  x: number;
  y: number;
  neighbors: string[];
}

export class WaypointGraph {
  public waypoints: Map<string, Waypoint> = new Map();

  constructor() {
    this.buildGraph();
  }

  private addNode(id: string, x: number, y: number, neighbors: string[] = []) {
    this.waypoints.set(id, { id, x, y, neighbors });
  }

  private addEdge(fromId: string, toId: string) {
    const from = this.waypoints.get(fromId);
    const to = this.waypoints.get(toId);
    if (from && to) {
      if (!from.neighbors.includes(toId)) from.neighbors.push(toId);
      if (!to.neighbors.includes(fromId)) to.neighbors.push(fromId);
    }
  }

  private buildGraph() {
    // 1. Manager Area
    this.addNode('desk_orion', 190, 150);
    this.addNode('manager_door', 310, 150);

    // 2. Dev Area
    this.addNode('desk_forge', 430, 140);
    this.addNode('desk_frame', 550, 140);
    this.addNode('desk_aurora', 490, 200);
    this.addNode('dev_internal_hub', 490, 170);
    this.addNode('dev_door', 490, 240);

    // 3. Research Area
    this.addNode('desk_radar', 770, 140);
    this.addNode('desk_quant', 890, 140);
    this.addNode('research_hub', 830, 150);
    this.addNode('research_door', 710, 150);

    // 4. Hallways & Corridors
    this.addNode('hall_top_left', 350, 150);
    this.addNode('hall_top_mid', 490, 270);
    this.addNode('hall_top_right', 670, 150);
    this.addNode('hall_mid_left', 350, 360);
    this.addNode('hall_mid_right', 670, 360);

    // 5. Central Meeting Room
    this.addNode('meeting_door_n', 490, 310);
    this.addNode('meeting_table_n', 490, 345);
    this.addNode('meeting_table_s', 490, 375);
    this.addNode('meeting_door_s', 490, 410);

    // 6. QA & Security Area
    this.addNode('desk_prism', 180, 440);
    this.addNode('desk_lens', 280, 440);
    this.addNode('desk_sentinel', 230, 530);
    this.addNode('qa_hub', 230, 450);
    this.addNode('qa_door', 330, 450);

    // 7. Lounge & Breakroom
    this.addNode('lounge_entrance', 490, 450);
    this.addNode('lounge_hub', 540, 510);
    this.addNode('desk_nexus', 540, 520);
    this.addNode('lounge_coffee', 450, 480);
    this.addNode('lounge_sofa_l', 460, 540);
    this.addNode('lounge_sofa_r', 620, 540);

    // 8. Server Room
    this.addNode('desk_atlas', 840, 470);
    this.addNode('server_racks', 890, 430);
    this.addNode('server_hub', 820, 450);
    this.addNode('server_door', 710, 450);

    // Connect Nodes with Edges
    // Manager connections
    this.addEdge('desk_orion', 'manager_door');
    this.addEdge('manager_door', 'hall_top_left');

    // Dev connections
    this.addEdge('desk_forge', 'dev_internal_hub');
    this.addEdge('desk_frame', 'dev_internal_hub');
    this.addEdge('desk_aurora', 'dev_internal_hub');
    this.addEdge('dev_internal_hub', 'dev_door');
    this.addEdge('dev_door', 'hall_top_mid');

    // Research connections
    this.addEdge('desk_radar', 'research_hub');
    this.addEdge('desk_quant', 'research_hub');
    this.addEdge('research_hub', 'research_door');
    this.addEdge('research_door', 'hall_top_right');

    // Meeting Room connections
    this.addEdge('hall_top_mid', 'meeting_door_n');
    this.addEdge('meeting_door_n', 'meeting_table_n');
    this.addEdge('meeting_table_n', 'meeting_table_s');
    this.addEdge('meeting_table_s', 'meeting_door_s');
    this.addEdge('meeting_door_s', 'lounge_entrance');

    // Hallway backbone
    this.addEdge('hall_top_left', 'hall_top_mid');
    this.addEdge('hall_top_mid', 'hall_top_right');
    this.addEdge('hall_top_left', 'hall_mid_left');
    this.addEdge('hall_top_right', 'hall_mid_right');
    this.addEdge('hall_mid_left', 'qa_door');
    this.addEdge('hall_mid_right', 'server_door');
    this.addEdge('hall_mid_left', 'meeting_door_n');
    this.addEdge('hall_mid_right', 'meeting_door_n');

    // QA & Security connections
    this.addEdge('qa_door', 'qa_hub');
    this.addEdge('desk_prism', 'qa_hub');
    this.addEdge('desk_lens', 'qa_hub');
    this.addEdge('desk_sentinel', 'qa_hub');

    // Lounge connections
    this.addEdge('lounge_entrance', 'lounge_hub');
    this.addEdge('lounge_hub', 'desk_nexus');
    this.addEdge('lounge_hub', 'lounge_coffee');
    this.addEdge('lounge_hub', 'lounge_sofa_l');
    this.addEdge('lounge_hub', 'lounge_sofa_r');
    this.addEdge('hall_mid_left', 'lounge_entrance');
    this.addEdge('hall_mid_right', 'lounge_entrance');

    // Server Room connections
    this.addEdge('server_door', 'server_hub');
    this.addEdge('server_hub', 'desk_atlas');
    this.addEdge('server_hub', 'server_racks');
  }

  public findClosestNode(x: number, y: number): Waypoint {
    let closest: Waypoint | null = null;
    let minDistance = Infinity;

    for (const node of this.waypoints.values()) {
      const d = Math.hypot(node.x - x, node.y - y);
      if (d < minDistance) {
        minDistance = d;
        closest = node;
      }
    }

    return closest || this.waypoints.values().next().value!;
  }

  public findPath(startX: number, startY: number, targetX: number, targetY: number): Array<{ x: number; y: number }> {
    const startNode = this.findClosestNode(startX, startY);
    const endNode = this.findClosestNode(targetX, targetY);

    if (startNode.id === endNode.id) {
      return [{ x: targetX, y: targetY }];
    }

    // BFS Shortest Path
    const queue: string[] = [startNode.id];
    const visited = new Set<string>([startNode.id]);
    const parentMap = new Map<string, string>();

    let found = false;
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (currentId === endNode.id) {
        found = true;
        break;
      }

      const node = this.waypoints.get(currentId);
      if (!node) continue;

      for (const neighborId of node.neighbors) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          parentMap.set(neighborId, currentId);
          queue.push(neighborId);
        }
      }
    }

    if (!found) {
      return [{ x: targetX, y: targetY }];
    }

    // Reconstruct path
    const pathNodes: Waypoint[] = [];
    let curr = endNode.id;
    while (curr) {
      const n = this.waypoints.get(curr);
      if (n) pathNodes.unshift(n);
      curr = parentMap.get(curr)!;
    }

    const result = pathNodes.map((n) => ({ x: n.x, y: n.y }));
    result.push({ x: targetX, y: targetY });
    return result;
  }
}
