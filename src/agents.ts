// Agents are whatever Hermes profiles the machine reports (plus OpenCode), so nothing here is
// tied to particular names: each agent's look is derived from its id.

export interface AgentLook { hair: string; skin: string; shirt: string; pants: string }

const HAIR = ['#1d293c', '#b54b45', '#6a4d8d', '#3b2a20', '#c9a24a', '#2f4f3a', '#8b5a2b', '#11151c']
const SKIN = ['#e9b57d', '#c98e5a', '#f1c9a0', '#a8714a', '#dca06e']
const SHIRT = ['#e6b34e', '#70bdcb', '#93ca67', '#e76f51', '#8f7ae6', '#f4a3b4', '#4f9c7a', '#d9534f', '#5a8dee', '#c7a17a']
const PANTS = ['#36475d', '#374052', '#344349', '#4a3b2f', '#2f3a44', '#3d2f4a']

/** A small stable hash (FNV-1a) so an agent keeps the same look on every device. */
export function hashName(name: string): number {
  let hash = 2166136261
  for (let index = 0; index < name.length; index += 1) {
    hash ^= name.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export const FLEET_AGENT_LOOKS: Record<string, AgentLook> = {
  orion: {
    hair: '#0f172a',
    skin: '#e9b57d',
    shirt: '#2563eb', // Royal Cobalt Blue (Orchestrator & Chief of Staff)
    pants: '#1e293b',
  },
  aurora: {
    hair: '#4a2840',
    skin: '#f1c9a0',
    shirt: '#a855f7', // Vibrant Violet (Product & UX Design)
    pants: '#2e1065',
  },
  frame: {
    hair: '#1e293b',
    skin: '#e9b57d',
    shirt: '#06b6d4', // Modern Tech Cyan (Frontend Engineering)
    pants: '#0f172a',
  },
  lens: {
    hair: '#3b2a20',
    skin: '#c98e5a',
    shirt: '#f59e0b', // Sharp Amber / Gold (Visual QA & Art Direction)
    pants: '#292524',
  },
  forge: {
    hair: '#18181b',
    skin: '#dca06e',
    shirt: '#ea580c', // Industrial Rust Orange (Backend & Systems Code)
    pants: '#27272a',
  },
  prism: {
    hair: '#1e293b',
    skin: '#f1c9a0',
    shirt: '#10b981', // Emerald Green PASS (Verification & Correctness)
    pants: '#134e4a',
  },
  sentinel: {
    hair: '#111827',
    skin: '#c98e5a',
    shirt: '#dc2626', // Security Crimson Red (Shield & Threat Audit)
    pants: '#18181b',
  },
  atlas: {
    hair: '#334155',
    skin: '#e9b57d',
    shirt: '#475569', // Datacenter Slate / SRE Steel (Infra & Reliability)
    pants: '#0f172a',
  },
  radar: {
    hair: '#1e293b',
    skin: '#a8714a',
    shirt: '#0284c7', // Sky Blue Radar (External Intel & Research)
    pants: '#1e293b',
  },
  quant: {
    hair: '#262626',
    skin: '#e9b57d',
    shirt: '#ca8a04', // Financial Gold (Quantitative & Market Research)
    pants: '#1c1917',
  },
  nexus: {
    hair: '#2e1065',
    skin: '#f1c9a0',
    shirt: '#6366f1', // Operations Indigo (Cross-Cutting Coordination)
    pants: '#1e1b4b',
  },
  scholar: {
    hair: '#3b2a20',
    skin: '#e9b57d',
    shirt: '#8b5cf6', // Academic Violet (Paper Pipeline)
    pants: '#312e81',
  },
  groupbot: {
    hair: '#1e293b',
    skin: '#e9b57d',
    shirt: '#64748b',
    pants: '#334155',
  },
  default: {
    hair: '#1e293b',
    skin: '#e9b57d',
    shirt: '#3b82f6',
    pants: '#1e293b',
  },
}

export function agentLook(id: string): AgentLook {
  const custom = FLEET_AGENT_LOOKS[id.toLowerCase()]
  if (custom) return custom
  const hash = hashName(id)
  return { hair: HAIR[hash % HAIR.length], skin: SKIN[(hash >>> 4) % SKIN.length], shirt: SHIRT[(hash >>> 8) % SHIRT.length], pants: PANTS[(hash >>> 12) % PANTS.length] }
}
