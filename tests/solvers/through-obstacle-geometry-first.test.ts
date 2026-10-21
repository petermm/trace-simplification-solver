import { expect, spyOn, test } from "bun:test"
import { ConnectivityMap } from "circuit-json-to-connectivity-map"
import { TraceSimplificationSolver } from "lib/solvers/TraceSimplificationSolver/TraceSimplificationSolver"
import type { Obstacle } from "lib/types"
import type { HighDensityRoute } from "lib/types/high-density-types"

test("marks the first containing same-net obstacle without resolving distant nets", (): void => {
  for (const offset of [0, 100_000, -100_000]) {
    const connMap = new ConnectivityMap({
      route_net: ["route", "pad"],
      other_net: ["other-pad", "far-pad"],
    })
    const connections = spyOn(connMap, "areIdsConnected")
    const near: Obstacle = {
      type: "rect",
      layers: ["top", "bottom"],
      center: { x: offset, y: offset },
      width: 1,
      height: 1,
      connectedTo: ["pad"],
      circuitJsonMetadata: { pcb_port_id: "first-pad" },
    }
    const obstacles: Obstacle[] = [
      {
        ...near,
        center: { x: offset + 100, y: offset + 100 },
        connectedTo: ["far-pad"],
      },
      { ...near, connectedTo: ["other-pad"] },
      near,
      {
        ...near,
        circuitJsonMetadata: { pcb_port_id: "second-pad" },
      },
    ]
    const solver = new TraceSimplificationSolver({
      hdRoutes: [],
      obstacles,
      connMap,
      colorMap: {},
      defaultViaDiameter: 0.6,
      layerCount: 2,
    })
    const corner = { x: offset + 0.5 + 5e-7, y: offset + 0.5 }
    const outside = { x: offset + 5, y: offset + 5 }
    const route: HighDensityRoute = {
      connectionName: "route",
      traceThickness: 0.15,
      viaDiameter: 0.6,
      route: [
        { ...corner, z: 0 },
        { ...corner, z: 1 },
        { ...outside, z: 1 },
      ],
      vias: [corner, outside],
    }

    const [marked] = solver.markThroughObstacleSegments([route])

    expect(marked!.route[0]).toEqual({
      ...route.route[0]!,
      toNextSegmentType: "through_obstacle",
      toNextSegmentCircuitJsonMetadata: { pcb_port_id: "first-pad" },
    })
    expect(marked!.route.slice(1)).toEqual(route.route.slice(1))
    expect(marked!.vias).toEqual([outside])
    expect(route.vias).toEqual([corner, outside])
    expect(connections.mock.calls.length).toBeGreaterThan(0)
    expect(
      connections.mock.calls.some(([, id]): boolean => id === "far-pad"),
    ).toBeFalse()
    connections.mockRestore()
  }
})
