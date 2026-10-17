import { expect, test } from "bun:test"
import { ConnectivityMap } from "circuit-json-to-connectivity-map"
import { SameNetViaMergerSolver } from "lib/solvers/SameNetViaMergerSolver/SameNetViaMergerSolver"
import type { HighDensityRoute } from "lib/types/high-density-types"

test("merging blind vias checks the combined barrel on intermediate layers", (): void => {
  const moving: HighDensityRoute = {
    connectionName: "moving",
    rootConnectionName: "signal",
    traceThickness: 0.1524,
    viaDiameter: 0.2032,
    route: [
      { x: -1, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 3 },
      { x: -1, y: 0, z: 3 },
    ],
    vias: [{ x: 0, y: 0 }],
  }
  const anchor: HighDensityRoute = {
    ...moving,
    connectionName: "anchor",
    route: [
      { x: 0.4, y: -1, z: 0 },
      { x: 0.4, y: 0, z: 0 },
      { x: 0.4, y: 0, z: 1 },
      { x: 0.4, y: -1, z: 1 },
    ],
    vias: [{ x: 0.4, y: 0 }],
  }
  const wire: HighDensityRoute = {
    ...moving,
    connectionName: "wire",
    rootConnectionName: "foreign",
    route: [{ x: 0.4, y: -0.4, z: 2 }, { x: 0.4, y: 0.4, z: 2 }],
    vias: [],
  }
  const solver = new SameNetViaMergerSolver({
    inputHdRoutes: [moving],
    otherHdRoutes: [anchor, wire],
    usePhysicalClearance: true,
    allowBlindAndBuriedVias: true,
    obstacles: [],
    colorMap: {},
    layerCount: 4,
    connMap: new ConnectivityMap({ signal: ["moving", "anchor"], foreign: ["wire"] }),
  })
  solver.solve()
  expect(solver.solved).toBeTrue()
  expect(solver.getMergedViaHdRoutes()![0]!.vias).toEqual(moving.vias)
})
