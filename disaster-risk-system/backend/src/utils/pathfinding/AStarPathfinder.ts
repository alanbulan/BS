import { Point, RiskZone } from '../../types';

/**
 * 图节点（路网交叉点）
 */
export interface GraphNode {
  id: string;
  location: Point;
  connections: Map<string, number>; // 连接的节点ID和距离
}

/**
 * A*算法中的节点
 */
class AStarNode {
  id: string;
  location: Point;
  g: number; // 从起点到当前节点的实际代价
  h: number; // 从当前节点到终点的启发式估计代价
  f: number; // f = g + h 总代价
  parent: AStarNode | null;
  riskFactor: number; // 风险因子 (0-1)

  constructor(
    id: string,
    location: Point,
    g: number = 0,
    h: number = 0,
    parent: AStarNode | null = null,
    riskFactor: number = 0
  ) {
    this.id = id;
    this.location = location;
    this.g = g;
    this.h = h;
    this.f = g + h;
    this.parent = parent;
    this.riskFactor = riskFactor;
  }

  /**
   * 更新代价和父节点
   */
  update(g: number, h: number, parent: AStarNode, riskFactor: number): void {
    this.g = g;
    this.h = h;
    this.f = g + h;
    this.parent = parent;
    this.riskFactor = riskFactor;
  }
}

/**
 * 路径规划选项
 */
export interface PathfindingOptions {
  routeType: 'fastest' | 'safest' | 'shortest';
  avoidHighRiskZones: boolean;
  riskWeightFactor: number; // 风险权重因子 (0-1)，越大越倾向避险
  maxDistance?: number; // 最大搜索距离（米）
}

/**
 * 路径结果
 */
export interface PathResult {
  path: Point[]; // 路径点序列
  totalDistance: number; // 总距离（米）
  totalRisk: number; // 总风险值
  estimatedTime: number; // 预计时间（分钟）
  safetyScore: number; // 安全评分 (1-5)
}

/**
 * A*路径规划算法实现
 * 支持多目标优化：最短路径、最快路径、最安全路径
 */
export class AStarPathfinder {
  private graph: Map<string, GraphNode>;
  private riskZones: RiskZone[];
  private options: PathfindingOptions;

  // 默认速度（米/分钟）
  private static readonly WALKING_SPEED = 80; // 步行约80m/min
  private static readonly DRIVING_SPEED = 500; // 驾车约500m/min
  
  constructor(
    graph: Map<string, GraphNode>,
    riskZones: RiskZone[],
    options: PathfindingOptions
  ) {
    this.graph = graph;
    this.riskZones = riskZones;
    this.options = options;
  }

  /**
   * 执行A*路径搜索
   */
  findPath(startPoint: Point, endPoint: Point): PathResult | null {
    const startNodeId = this.findNearestNodeId(startPoint);
    const endNodeId = this.findNearestNodeId(endPoint);

    if (!startNodeId || !endNodeId) {
      console.error('[A*] 无法找到路网节点');
      return null;
    }

    if (startNodeId === endNodeId) {
      return null;
    }

    const openSet = new Map<string, AStarNode>();
    const closedSet = new Set<string>();

    // 初始化起始节点
    const startNode = this.graph.get(startNodeId)!;
    const endNode = this.graph.get(endNodeId)!;
    
    const startAStarNode = new AStarNode(
      startNodeId,
      startNode.location,
      0,
      this.calculateHeuristic(startNode.location, endNode.location),
      null,
      0
    );

    openSet.set(startNodeId, startAStarNode);

    let iterations = 0;
    const MAX_ITERATIONS = 5000; // 减少迭代次数，加快速度
    const startTime = Date.now();

    while (openSet.size > 0 && iterations < MAX_ITERATIONS) {
      iterations++;
      
      // 每1000次迭代检查一次超时（避免太慢）
      if (iterations % 1000 === 0) {
        const elapsed = Date.now() - startTime;
        if (elapsed > 10000) { // 10秒超时
          console.warn(`[A*] 搜索超时 (${elapsed}ms)，终止搜索`);
          break;
        }
      }

      // 从openSet中找到f值最小的节点
      const current = this.getLowestFNode(openSet);
      
      if (!current) {
        break;
      }

      // 到达目标
      if (current.id === endNodeId) {
        const elapsed = Date.now() - startTime;
        console.log(`[A*] 成功找到路径，耗时: ${elapsed}ms，迭代: ${iterations}次`);
        return this.reconstructPath(current, endNode.location);
      }

      openSet.delete(current.id);
      closedSet.add(current.id);

      // 检查所有邻居节点
      const currentGraphNode = this.graph.get(current.id)!;
      
      for (const [neighborId, edgeDistance] of currentGraphNode.connections) {
        if (closedSet.has(neighborId)) {
          continue;
        }

        const neighborGraphNode = this.graph.get(neighborId)!;
        
        // 计算风险因子
        const edgeRiskFactor = this.calculateEdgeRisk(
          currentGraphNode.location,
          neighborGraphNode.location
        );

        // 计算实际代价（考虑距离和风险）
        const baseDistance = edgeDistance;
        const riskPenalty = this.options.avoidHighRiskZones ? 
          edgeRiskFactor * this.options.riskWeightFactor * baseDistance : 0;
        
        // 根据路径类型调整代价（统一单位：距离等价值）
        let tentativeG: number;
        
        switch (this.options.routeType) {
          case 'fastest':
            // 最快路径：距离（等价于时间），几乎忽略风险（只避开极高风险）
            // 目标：找到物理距离最短的路径，因为步行时距离≈时间
            tentativeG = current.g + baseDistance + (edgeRiskFactor > 0.8 ? riskPenalty * 2 : 0);
            break;
          case 'safest':
            // 最安全路径：距离 + 极高风险惩罚
            // 目标：大幅绕开所有风险区，距离可以增加很多
            tentativeG = current.g + baseDistance + riskPenalty * 20;
            break;
          case 'shortest':
          default:
            // 最短路径：纯距离优先，轻微避险
            tentativeG = current.g + baseDistance + riskPenalty * 0.3;
            break;
        }

        const h = this.calculateHeuristic(neighborGraphNode.location, endNode.location);

        if (openSet.has(neighborId)) {
          const existingNode = openSet.get(neighborId)!;
          if (tentativeG < existingNode.g) {
            existingNode.update(tentativeG, h, current, edgeRiskFactor);
          }
        } else {
          const newNode = new AStarNode(
            neighborId,
            neighborGraphNode.location,
            tentativeG,
            h,
            current,
            edgeRiskFactor
          );
          openSet.set(neighborId, newNode);
        }
      }
    }

    if (iterations >= MAX_ITERATIONS) {
      console.warn(`[A*] 达到最大迭代次数 ${MAX_ITERATIONS}`);
    }

    console.warn(`[A*] 无法找到连通路径 (迭代${iterations}次, openSet大小${openSet.size}, closedSet大小${closedSet.size})`);
    console.warn(`[A*] 可能原因: 起点和终点节点不在同一连通分量中`);
    return null;
  }

  /**
   * 计算启发式函数（欧几里得距离）
   */
  private calculateHeuristic(from: Point, to: Point): number {
    return this.calculateDistance(from, to);
  }

  /**
   * 计算两点之间的欧几里得距离（米）
   */
  private calculateDistance(point1: Point, point2: Point): number {
    const [lon1, lat1] = point1.coordinates;
    const [lon2, lat2] = point2.coordinates;

    // 简化的平面距离计算（对于小范围内足够精确）
    const R = 6371000; // 地球半径（米）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  /**
   * 计算路径段的风险因子
   */
  private calculateEdgeRisk(from: Point, to: Point): number {
    let maxRisk = 0;

    for (const riskZone of this.riskZones) {
      // 检查路径段是否穿过风险区域
      if (this.lineIntersectsZone(from, to, riskZone)) {
        // 使用base_risk_level作为风险值
        const riskLevel = riskZone.base_risk_level || 1;
        const risk = riskLevel / 5;
        maxRisk = Math.max(maxRisk, risk);
      }
    }

    return maxRisk;
  }

  /**
   * 检查线段是否与风险区域相交
   * 简化版本：检查中点是否在风险区域内
   */
  private lineIntersectsZone(from: Point, to: Point, zone: RiskZone): boolean {
    // 简化实现：检查中点
    const midLon = (from.coordinates[0] + to.coordinates[0]) / 2;
    const midLat = (from.coordinates[1] + to.coordinates[1]) / 2;
    const midPoint: Point = {
      type: 'Point',
      coordinates: [midLon, midLat]
    };

    return this.pointInZone(midPoint, zone);
  }

  /**
   * 检查点是否在风险区域内
   * 简化版本：使用边界框检查
   */
  private pointInZone(point: Point, zone: RiskZone): boolean {
    if (!zone.geometry || zone.geometry.type !== 'Polygon') {
      return false;
    }

    const coordinates = zone.geometry.coordinates[0]; // 第一个环（外环）
    const [lon, lat] = point.coordinates;

    // 简单的边界框检查
    let minLon = Infinity, maxLon = -Infinity;
    let minLat = Infinity, maxLat = -Infinity;

    for (const [pLon, pLat] of coordinates) {
      minLon = Math.min(minLon, pLon);
      maxLon = Math.max(maxLon, pLon);
      minLat = Math.min(minLat, pLat);
      maxLat = Math.max(maxLat, pLat);
    }

    return lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat;
  }

  /**
   * 找到离给定点最近的图节点（增加容错：最远搜索5公里）
   */
  private findNearestNodeId(point: Point): string | null {
    let nearestNodeId: string | null = null;
    let minDistance = Infinity;
    const MAX_SEARCH_DISTANCE = 5000; // 最远搜索5公里

    for (const [nodeId, node] of this.graph) {
      const distance = this.calculateDistance(point, node.location);
      if (distance < minDistance) {
        minDistance = distance;
        nearestNodeId = nodeId;
      }
    }

    // 如果最近节点太远，记录警告
    if (minDistance > MAX_SEARCH_DISTANCE) {
      console.warn(`最近节点距离 ${(minDistance/1000).toFixed(2)}公里，可能找不到路径`);
    } else {
      console.log(`找到最近节点，距离 ${minDistance.toFixed(0)}米`);
    }

    return nearestNodeId;
  }

  /**
   * 从openSet中获取f值最小的节点（优化：使用数组并排序，减少遍历）
   */
  private getLowestFNode(openSet: Map<string, AStarNode>): AStarNode | null {
    if (openSet.size === 0) return null;
    
    // 优化：当openSet较小时直接遍历，否则转数组排序
    if (openSet.size <= 10) {
      let lowestNode: AStarNode | null = null;
      let lowestF = Infinity;
      for (const node of openSet.values()) {
        if (node.f < lowestF) {
          lowestF = node.f;
          lowestNode = node;
        }
      }
      return lowestNode;
    }
    
    // openSet较大时，使用Array.from并取最小值
    const nodes = Array.from(openSet.values());
    return nodes.reduce((min, node) => node.f < min.f ? node : min);
  }

  /**
   * 重建路径（从终点回溯到起点）
   */
  private reconstructPath(endNode: AStarNode, actualEndPoint: Point): PathResult {
    const path: Point[] = [];
    let currentNode: AStarNode | null = endNode;
    let totalDistance = 0;
    let totalRisk = 0;
    let riskCount = 0;

    // 从终点回溯到起点
    while (currentNode) {
      path.unshift(currentNode.location);
      
      if (currentNode.parent) {
        totalDistance += this.calculateDistance(currentNode.location, currentNode.parent.location);
        totalRisk += currentNode.riskFactor;
        riskCount++;
      }
      
      currentNode = currentNode.parent;
    }

    // 添加实际终点（如果不同）
    if (path.length > 0) {
      const lastPoint = path[path.length - 1];
      const distanceToEnd = this.calculateDistance(lastPoint, actualEndPoint);
      if (distanceToEnd > 10) { // 如果距离超过10米
        path.push(actualEndPoint);
        totalDistance += distanceToEnd;
      }
    }

    const avgRisk = riskCount > 0 ? totalRisk / riskCount : 0;
    const safetyScore = Math.max(1, Math.min(5, Math.round(5 - avgRisk * 4)));
    const estimatedTime = Math.round(totalDistance / AStarPathfinder.WALKING_SPEED);

    return {
      path,
      totalDistance: Math.round(totalDistance),
      totalRisk: Math.round(avgRisk * 100) / 100,
      estimatedTime,
      safetyScore
    };
  }

  /**
   * 生成图节点（从道路网络数据）
   * 这是一个静态方法，用于从道路网络构建图
   */
  static buildGraphFromRoads(roads: any[]): Map<string, GraphNode> {
    console.log(`[GRAPH] 开始构建路网图，道路数: ${roads.length}`);
    const startTime = Date.now();
    
    const graph = new Map<string, GraphNode>();
    const nodeMap = new Map<string, string>(); // 坐标字符串 -> 节点ID
    const MERGE_THRESHOLD = 0.0001; // 约11米，增大合并阈值减少节点数

    // 为每条道路的所有点创建节点，并合并相近节点
    roads.forEach((road, roadIndex) => {
      if (road.geometry && road.geometry.type === 'LineString') {
        const coordinates = road.geometry.coordinates;
        
        for (let i = 0; i < coordinates.length; i++) {
          const [lon, lat] = coordinates[i];
          
          // 查找是否有相近的已存在节点（提高连通性）
          let existingNodeId: string | null = null;
          for (const [key, nodeId] of nodeMap.entries()) {
            const [existingLon, existingLat] = key.split(',').map(parseFloat);
            const lonDiff = Math.abs(existingLon - lon);
            const latDiff = Math.abs(existingLat - lat);
            
            if (lonDiff < MERGE_THRESHOLD && latDiff < MERGE_THRESHOLD) {
              existingNodeId = nodeId;
              break;
            }
          }
          
          if (existingNodeId) {
            // 使用已存在的节点
            const coordKey = `${lon.toFixed(6)},${lat.toFixed(6)}`;
            nodeMap.set(coordKey, existingNodeId);
          } else {
            // 创建新节点
            const coordKey = `${lon.toFixed(6)},${lat.toFixed(6)}`;
            const nodeId = `node_${graph.size}`;
            nodeMap.set(coordKey, nodeId);
            
            graph.set(nodeId, {
              id: nodeId,
              location: {
                type: 'Point',
                coordinates: [lon, lat]
              },
              connections: new Map()
            });
          }
        }

        // 连接相邻节点
        for (let i = 0; i < coordinates.length - 1; i++) {
          const [lon1, lat1] = coordinates[i];
          const [lon2, lat2] = coordinates[i + 1];
          
          const coordKey1 = `${lon1.toFixed(6)},${lat1.toFixed(6)}`;
          const coordKey2 = `${lon2.toFixed(6)},${lat2.toFixed(6)}`;
          
          const nodeId1 = nodeMap.get(coordKey1);
          const nodeId2 = nodeMap.get(coordKey2);
          
          if (nodeId1 && nodeId2 && nodeId1 !== nodeId2) {
            const node1 = graph.get(nodeId1)!;
            const node2 = graph.get(nodeId2)!;
            
            const distance = AStarPathfinder.prototype.calculateDistance(
              node1.location,
              node2.location
            );
            
            // 双向连接
            node1.connections.set(nodeId2, distance);
            node2.connections.set(nodeId1, distance);
          }
        }
      }
    });

    // 统计连通性
    let totalConnections = 0;
    for (const node of graph.values()) {
      totalConnections += node.connections.size;
    }
    
    const elapsed = Date.now() - startTime;
    console.log(`[GRAPH] 构建完成: ${graph.size}节点, ${totalConnections}条边, 耗时:${elapsed}ms`);
    return graph;
  }
}



