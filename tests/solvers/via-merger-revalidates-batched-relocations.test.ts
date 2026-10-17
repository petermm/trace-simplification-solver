import { expect, test } from "bun:test"
import { ConnectivityMap } from "circuit-json-to-connectivity-map"
import { SameNetViaMergerSolver } from "lib/solvers/SameNetViaMergerSolver/SameNetViaMergerSolver"
import type { HighDensityRoute } from "lib/types/high-density-types"

test("batched via relocations do not validate against stale foreign wire leads", (): void => {
  const moving = [-1, 1].map((x, index): HighDensityRoute => ({
    connectionName: `moving${index}`, traceThickness: 0.05, viaDiameter: 1,
    route: [
      { x, y: -1, z: 0 }, { x, y: -0.5, z: 0 },
      { x, y: -0.5, z: 1 }, { x, y: -1, z: 1 },
    ],
    vias: [{ x, y: -0.5 }],
  }))
  const anchors = [1, -1].map((x, index): HighDensityRoute => ({
    connectionName: `anchor${index}`, traceThickness: 0.05, viaDiameter: 1,
    route: [{ x, y: 1, z: 4 + index * 2 }, { x, y: 1, z: 5 + index * 2 }],
    vias: [{ x, y: 1 }],
  }))
  const solver = new SameNetViaMergerSolver({
    inputHdRoutes: moving, otherHdRoutes: anchors,
    usePhysicalClearance: true, allowBlindAndBuriedVias: true,
    obstacles: [], colorMap: {}, layerCount: 8,
    connMap: new ConnectivityMap({ a: ["moving0", "anchor0"], b: ["moving1", "anchor1"] }),
  })
  solver.solve()
  expect(solver.solved).toBeTrue()
  const output = solver.getMergedViaHdRoutes()!
  expect(output[0]!.vias).toEqual(anchors[0]!.vias)
  expect(output[1]!.vias).toEqual(moving[1]!.vias)
})
