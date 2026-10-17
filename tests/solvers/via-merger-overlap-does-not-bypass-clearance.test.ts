import { expect, test } from "bun:test"
import { ConnectivityMap } from "circuit-json-to-connectivity-map"
import { SameNetViaMergerSolver } from "lib/solvers/SameNetViaMergerSolver/SameNetViaMergerSolver"
import type { HighDensityRoute } from "lib/types/high-density-types"

test("overlapping same-net vias still validate foreign barrel clearance", (): void => {
  for (const anchorX of [0.2, 0.4]) {
    const moving: HighDensityRoute = {
      connectionName: "moving",
      traceThickness: 0.1524,
      viaDiameter: 0.2032,
      route: [
        { x: -1, y: 0, z: 0 }, { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 3 }, { x: -1, y: 0, z: 3 },
      ],
      vias: [{ x: 0, y: 0 }],
    }
    const anchor: HighDensityRoute = {
      ...moving, connectionName: "anchor",
      route: [{ x: anchorX, y: 0, z: 0 }, { x: anchorX, y: 0, z: 1 }],
      vias: [{ x: anchorX, y: 0 }],
    }
    const foreign: HighDensityRoute = {
      ...moving, connectionName: "wire",
      route: [{ x: anchorX + 0.25, y: -1, z: 2 }, { x: anchorX + 0.25, y: 1, z: 2 }],
      vias: [],
    }
    const solver = new SameNetViaMergerSolver({
      inputHdRoutes: [moving], otherHdRoutes: [anchor, foreign],
      usePhysicalClearance: true, allowBlindAndBuriedVias: true,
      obstacles: [], colorMap: {}, layerCount: 4,
      connMap: new ConnectivityMap({ signal: ["moving", "anchor"], foreign: ["wire"] }),
    })
    solver.solve()
    expect(solver.solved).toBeTrue()
    expect(solver.getMergedViaHdRoutes()![0]!.vias).toEqual(moving.vias)
  }
})
