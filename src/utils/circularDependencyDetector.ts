import { ComponentDependency, CircularDependencyPath } from '../services/a2aClient';

/**
 * Circular Dependency Detector
 * Uses Depth-First Search (DFS) to detect cycles in a dependency graph
 */

interface DependencyGraph {
  [component: string]: string[];
}

interface VisitState {
  WHITE: 0;   // Not visited
  GRAY: 1;    // Being visited (in current DFS path)
  BLACK: 2;   // Fully visited (no cycle found through this node)
}

const VisitState: VisitState = {
  WHITE: 0,
  GRAY: 1,
  BLACK: 2,
};

/**
 * Build a directed graph from component dependencies
 */
function buildDependencyGraph(dependencies: ComponentDependency[]): DependencyGraph {
  const graph: DependencyGraph = {};

  // Initialize all components
  const allComponents = new Set<string>();
  dependencies.forEach(dep => {
    allComponents.add(dep.source_component);
    allComponents.add(dep.target_component);
  });

  allComponents.forEach(component => {
    graph[component] = [];
  });

  // Build edges
  dependencies.forEach(dep => {
    if (!graph[dep.source_component]) {
      graph[dep.source_component] = [];
    }
    graph[dep.source_component].push(dep.target_component);
  });

  return graph;
}

/**
 * Detect all cycles in a dependency graph using DFS
 * Returns the components involved in circular dependencies
 */
export function detectCircularDependencies(
  dependencies: ComponentDependency[]
): CircularDependencyPath[] {
  const graph = buildDependencyGraph(dependencies);
  const visited = new Map<string, number>();
  const cycles: CircularDependencyPath[] = [];

  // Initialize visit states
  Object.keys(graph).forEach(component => {
    visited.set(component, VisitState.WHITE);
  });

  /**
   * DFS visitor function to find cycles
   */
  function dfs(node: string, currentPath: string[]): void {
    const state = visited.get(node) || VisitState.WHITE;

    if (state === VisitState.GRAY) {
      // Found a cycle - node is in current path
      const cycleStart = currentPath.indexOf(node);
      if (cycleStart !== -1) {
        const cycle = currentPath.slice(cycleStart);
        cycle.push(node); // Complete the cycle

        // Only add if not already found (avoid duplicates)
        const cycleKey = cycle.slice(0, -1).sort().join('->');
        const isDuplicate = cycles.some(
          c => c.components.slice(0, -1).sort().join('->') === cycleKey
        );

        if (!isDuplicate) {
          cycles.push({
            components: cycle,
            cycle_length: cycle.length - 1,
            severity: determineSeverity(cycle.length - 1),
          });
        }
      }
      return;
    }

    if (state === VisitState.BLACK) {
      // Already fully processed
      return;
    }

    // Mark as being visited
    visited.set(node, VisitState.GRAY);
    currentPath.push(node);

    // Visit neighbors
    const neighbors = graph[node] || [];
    for (const neighbor of neighbors) {
      dfs(neighbor, currentPath);
    }

    // Mark as fully visited
    visited.set(node, VisitState.BLACK);
    currentPath.pop();
  }

  // Run DFS from all nodes
  Object.keys(graph).forEach(component => {
    if (visited.get(component) === VisitState.WHITE) {
      dfs(component, []);
    }
  });

  return cycles;
}

/**
 * Determine severity based on cycle length
 * Shorter cycles are more severe (e.g., A->B->A is critical)
 */
function determineSeverity(cycleLength: number): 'low' | 'medium' | 'high' {
  if (cycleLength <= 2) {
    return 'high';    // Direct or 2-node cycles are critical
  } else if (cycleLength <= 4) {
    return 'medium';   // 3-4 node cycles are concerning
  }
  return 'low';        // Longer cycles are less immediate concern
}

/**
 * Get statistics about circular dependencies
 */
export function getCircularDependencyStats(
  cycles: CircularDependencyPath[]
): {
  totalCycles: number;
  criticalCycles: number;
  affectedComponents: Set<string>;
  avgCycleLength: number;
} {
  const affectedComponents = new Set<string>();

  cycles.forEach(cycle => {
    cycle.components.forEach(component => {
      affectedComponents.add(component);
    });
  });

  const criticalCycles = cycles.filter(c => c.severity === 'high').length;
  const avgCycleLength =
    cycles.length > 0
      ? cycles.reduce((sum, c) => sum + c.cycle_length, 0) / cycles.length
      : 0;

  return {
    totalCycles: cycles.length,
    criticalCycles,
    affectedComponents,
    avgCycleLength: Math.round(avgCycleLength * 10) / 10,
  };
}

/**
 * Find the shortest path between two components
 * Useful for understanding how they depend on each other
 */
export function findDependencyPath(
  dependencies: ComponentDependency[],
  source: string,
  target: string
): string[] | null {
  const graph = buildDependencyGraph(dependencies);

  function bfs(start: string): string[] | null {
    const queue: { node: string; path: string[] }[] = [{ node: start, path: [start] }];
    const visited = new Set<string>([start]);

    while (queue.length > 0) {
      const { node, path } = queue.shift()!;

      if (node === target) {
        return path;
      }

      const neighbors = graph[node] || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push({ node: neighbor, path: [...path, neighbor] });
        }
      }
    }

    return null;
  }

  return bfs(source);
}

/**
 * Filter dependencies to only include those involved in cycles
 */
export function filterCyclicDependencies(
  dependencies: ComponentDependency[],
  cycles: CircularDependencyPath[]
): ComponentDependency[] {
  const cyclicComponents = new Set<string>();

  cycles.forEach(cycle => {
    cycle.components.forEach(component => {
      cyclicComponents.add(component);
    });
  });

  return dependencies.filter(
    dep =>
      cyclicComponents.has(dep.source_component) ||
      cyclicComponents.has(dep.target_component)
  );
}
