import { expect, test } from "bun:test"
import { ConnectivityMap } from "circuit-json-to-connectivity-map"
import { SameNetViaMergerSolver } from "lib/solvers/SameNetViaMergerSolver/SameNetViaMergerSolver"
import type { HighDensityRoute } from "lib/types/high-density-types"

test("via relocation validates its new wire leads, not only the movement vector", (): void => {
  const moving: HighDensityRoute = {
    connectionName: "moving", traceThickness: 0.05, viaDiameter: 0.2032,
    route: [
      { x: -1, y: 0, z: 0 }, { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 1 }, { x: -1, y: 0, z: 1 },
    ],
    vias: [{ x: 0, y: 0 }],
  }
  const anchor: HighDensityRoute = {
    ...moving, connectionName: "anchor",
    route: [
      { x: 0.3, y: -0.7, z: 0 }, { x: 0.3, y: 0.3, z: 0 },
      { x: 0.3, y: 0.3, z: 1 }, { x: 0.3, y: -0.7, z: 1 },
    ],
    vias: [{ x: 0.3, y: 0.3 }],
  }
  const foreign: HighDensityRoute = {
    ...moving, connectionName: "wire",
    route: [{ x: -0.2, y: 0.18, z: 0 }, { x: -0.2, y: 0.19, z: 0 }],
    vias: [],
  }
  const solver = new SameNetViaMergerSolver({
    inputHdRoutes: [moving], otherHdRoutes: [anchor, foreign],
    usePhysicalClearance: true, allowBlindAndBuriedVias: true,
    obstacles: [], colorMap: {}, layerCount: 2,
    connMap: new ConnectivityMap({ signal: ["moving", "anchor"], foreign: ["wire"] }),
  })
  solver.solve()
  expect(solver.solved).toBeTrue()
  expect(solver.getMergedViaHdRoutes()![0]!.vias).toEqual(moving.vias)
})
