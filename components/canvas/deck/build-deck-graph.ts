import type { Edge, Node } from "@xyflow/react"
import { TOPOLOGY_NODES } from "../topology/data"
import { REPO_META } from "../topology/data"
import type { RepoKey } from "../topology/types"
import { BRANCH_COLORS, BRANCH_LABELS } from "./branch-colors"
import type { DeckEdgeData, DeckNodeData } from "./types"

const CENTER = { x: 560, y: 420 }
const HUB_RADIUS = 210
const LEAF_START = 115
const LEAF_STEP = 78

const GHOST_ROOT = { w: 130, h: 100 }
const GHOST_HUB = { w: 120, h: 95 }
const LEAF = { w: 56, h: 72 }

function polar(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
}

export function buildDeckGraph(): {
  nodes: Node<DeckNodeData>[]
  edges: Edge<DeckEdgeData>[]
} {
  const nodes: Node<DeckNodeData>[] = []
  const edges: Edge<DeckEdgeData>[] = []
  const repos = Object.keys(REPO_META) as RepoKey[]

  nodes.push({
    id: "root",
    type: "deckGhost",
    position: { x: CENTER.x - GHOST_ROOT.w / 2, y: CENTER.y - GHOST_ROOT.h / 2 },
    data: {
      title: BRANCH_LABELS.root,
      role: "Komuta Merkezi",
      description: "Tüm ekosistemin merkezi — 4 repo buradan dallanır.",
      type: "root",
      status: "calisir",
      repo: "root",
      collaboratesWith: [],
      visualKind: "ghost",
      branchColor: BRANCH_COLORS.root,
    },
  })

  repos.forEach((repo, i) => {
    const angle = -Math.PI / 2 + (i * (2 * Math.PI)) / repos.length
    const hubPos = polar(CENTER.x, CENTER.y, HUB_RADIUS, angle)
    const color = BRANCH_COLORS[repo]
    const meta = REPO_META[repo]
    const hubId = `hub-${repo}`

    nodes.push({
      id: hubId,
      type: "deckGhost",
      position: { x: hubPos.x - GHOST_HUB.w / 2, y: hubPos.y - GHOST_HUB.h / 2 },
      data: {
        title: BRANCH_LABELS[repo],
        role: meta.sub,
        description: `${meta.label} — ${meta.sub}`,
        type: "hub",
        status: "calisir",
        repo,
        collaboratesWith: [],
        visualKind: "ghost",
        branchColor: color,
        parentId: "root",
      },
    })

    edges.push({
      id: `e-root-${repo}`,
      source: "root",
      target: hubId,
      type: "deckPulse",
      data: { branchColor: color, kind: "hierarchy", animated: true },
      zIndex: 1,
    })

    const children = TOPOLOGY_NODES.filter((n) => n.repo === repo)
    children.forEach((raw, j) => {
      const leafPos = polar(
        CENTER.x,
        CENTER.y,
        HUB_RADIUS + LEAF_START + j * LEAF_STEP,
        angle
      )

      nodes.push({
        id: raw.id,
        type: "deckLeaf",
        position: { x: leafPos.x - LEAF.w / 2, y: leafPos.y - LEAF.h / 2 },
        data: {
          title: raw.title,
          role: raw.role,
          description: raw.description,
          type: raw.type,
          status: raw.status,
          repo: raw.repo,
          collaboratesWith: raw.collaboratesWith,
          visualKind: "leaf",
          branchColor: color,
          parentId: hubId,
        },
      })

      const edgeSource = j === 0 ? hubId : children[j - 1].id
      edges.push({
        id: `e-${edgeSource}-${raw.id}`,
        source: edgeSource,
        target: raw.id,
        type: "deckPulse",
        data: {
          branchColor: color,
          kind: "hierarchy",
          animated: raw.status === "calisir" || raw.status === "devam",
        },
        zIndex: 1,
      })
    })
  })

  TOPOLOGY_NODES.forEach((raw) => {
    raw.collaboratesWith.forEach((targetId) => {
      const edgeId = `link-${raw.id}-${targetId}`
      const reverse = `link-${targetId}-${raw.id}`
      if (edges.some((e) => e.id === edgeId || e.id === reverse)) return
      edges.push({
        id: edgeId,
        source: raw.id,
        target: targetId,
        type: "deckCable",
        data: { branchColor: "#94a3b8", kind: "collaboration", animated: false },
        zIndex: 0,
      })
    })
  })

  return { nodes, edges }
}

export function getNodeById(nodes: Node<DeckNodeData>[], id: string) {
  return nodes.find((n) => n.id === id)
}
