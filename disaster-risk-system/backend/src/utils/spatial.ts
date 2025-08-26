// 空间数据处理工具函数

// 地球半径（米）
const EARTH_RADIUS = 6371000;

// 坐标点接口
export interface Point {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface LineString {
  type: 'LineString';
  coordinates: [number, number][];
}

export interface Polygon {
  type: 'Polygon';
  coordinates: [number, number][][];
}

export type Geometry = Point | LineString | Polygon;

// 度转弧度
export const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

// 弧度转度
export const toDegrees = (radians: number): number => {
  return radians * (180 / Math.PI);
};

// 计算两点间距离（Haversine公式）
export const calculateDistance = (point1: Point, point2: Point): number => {
  const [lon1, lat1] = point1.coordinates;
  const [lon2, lat2] = point2.coordinates;
  
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return EARTH_RADIUS * c;
};

// 计算方位角
export const calculateBearing = (point1: Point, point2: Point): number => {
  const [lon1, lat1] = point1.coordinates;
  const [lon2, lat2] = point2.coordinates;
  
  const dLon = toRadians(lon2 - lon1);
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);
  
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  
  const bearing = toDegrees(Math.atan2(y, x));
  
  return (bearing + 360) % 360;
};

// 根据起点、距离和方位角计算终点
export const calculateDestination = (point: Point, distance: number, bearing: number): Point => {
  const [lon, lat] = point.coordinates;
  const bearingRad = toRadians(bearing);
  const latRad = toRadians(lat);
  const lonRad = toRadians(lon);
  
  const angularDistance = distance / EARTH_RADIUS;
  
  const destLatRad = Math.asin(
    Math.sin(latRad) * Math.cos(angularDistance) +
    Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearingRad)
  );
  
  const destLonRad = lonRad + Math.atan2(
    Math.sin(bearingRad) * Math.sin(angularDistance) * Math.cos(latRad),
    Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(destLatRad)
  );
  
  return {
    type: 'Point',
    coordinates: [toDegrees(destLonRad), toDegrees(destLatRad)]
  };
};

// 判断点是否在多边形内（射线法）
export const pointInPolygon = (point: Point, polygon: Polygon): boolean => {
  const [x, y] = point.coordinates;
  const vertices = polygon.coordinates[0]; // 外环
  
  let inside = false;
  
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const [xi, yi] = vertices[i];
    const [xj, yj] = vertices[j];
    
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
};

// 计算多边形面积（球面面积）
export const calculatePolygonArea = (polygon: Polygon): number => {
  const coordinates = polygon.coordinates[0];
  
  if (coordinates.length < 3) {
    return 0;
  }
  
  let area = 0;
  
  for (let i = 0; i < coordinates.length - 1; i++) {
    const [lon1, lat1] = coordinates[i];
    const [lon2, lat2] = coordinates[i + 1];
    
    area += toRadians(lon2 - lon1) * (2 + Math.sin(toRadians(lat1)) + Math.sin(toRadians(lat2)));
  }
  
  area = Math.abs(area) * EARTH_RADIUS * EARTH_RADIUS / 2;
  
  return area;
};

// 计算线段长度
export const calculateLineLength = (lineString: LineString): number => {
  const coordinates = lineString.coordinates;
  let totalLength = 0;
  
  for (let i = 0; i < coordinates.length - 1; i++) {
    const point1: Point = { type: 'Point', coordinates: coordinates[i] };
    const point2: Point = { type: 'Point', coordinates: coordinates[i + 1] };
    totalLength += calculateDistance(point1, point2);
  }
  
  return totalLength;
};

// 获取几何对象的边界框
export const getBoundingBox = (geometry: Geometry): { minLon: number; minLat: number; maxLon: number; maxLat: number } => {
  let coordinates: [number, number][] = [];
  
  switch (geometry.type) {
    case 'Point':
      coordinates = [geometry.coordinates];
      break;
    case 'LineString':
      coordinates = geometry.coordinates;
      break;
    case 'Polygon':
      coordinates = geometry.coordinates[0];
      break;
  }
  
  const lons = coordinates.map(coord => coord[0]);
  const lats = coordinates.map(coord => coord[1]);
  
  return {
    minLon: Math.min(...lons),
    minLat: Math.min(...lats),
    maxLon: Math.max(...lons),
    maxLat: Math.max(...lats)
  };
};

// 简化线段（Douglas-Peucker算法）
export const simplifyLine = (coordinates: [number, number][], tolerance: number): [number, number][] => {
  if (coordinates.length <= 2) {
    return coordinates;
  }
  
  const douglasPeucker = (points: [number, number][], epsilon: number): [number, number][] => {
    if (points.length <= 2) {
      return points;
    }
    
    let maxDistance = 0;
    let maxIndex = 0;
    
    const start = points[0];
    const end = points[points.length - 1];
    
    for (let i = 1; i < points.length - 1; i++) {
      const distance = pointToLineDistance(points[i], start, end);
      if (distance > maxDistance) {
        maxDistance = distance;
        maxIndex = i;
      }
    }
    
    if (maxDistance > epsilon) {
      const left = douglasPeucker(points.slice(0, maxIndex + 1), epsilon);
      const right = douglasPeucker(points.slice(maxIndex), epsilon);
      return left.slice(0, -1).concat(right);
    } else {
      return [start, end];
    }
  };
  
  return douglasPeucker(coordinates, tolerance);
};

// 计算点到线段的距离
const pointToLineDistance = (point: [number, number], lineStart: [number, number], lineEnd: [number, number]): number => {
  const [x, y] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;
  
  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  if (lenSq === 0) {
    return Math.sqrt(A * A + B * B);
  }
  
  const param = dot / lenSq;
  
  let xx: number, yy: number;
  
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }
  
  const dx = x - xx;
  const dy = y - yy;
  
  return Math.sqrt(dx * dx + dy * dy);
};

// 创建缓冲区（简化版本）
export const createBuffer = (point: Point, radius: number, segments: number = 16): Polygon => {
  const coordinates: [number, number][] = [];
  
  for (let i = 0; i <= segments; i++) {
    const angle = (i * 360) / segments;
    const destination = calculateDestination(point, radius, angle);
    coordinates.push(destination.coordinates);
  }
  
  return {
    type: 'Polygon',
    coordinates: [coordinates]
  };
};

// 转换为WKT格式
export const toWKT = (geometry: Geometry): string => {
  switch (geometry.type) {
    case 'Point':
      return `POINT(${geometry.coordinates[0]} ${geometry.coordinates[1]})`;
    case 'LineString':
      const lineCoords = geometry.coordinates.map(coord => `${coord[0]} ${coord[1]}`).join(', ');
      return `LINESTRING(${lineCoords})`;
    case 'Polygon':
      const ringCoords = geometry.coordinates.map(ring => 
        '(' + ring.map(coord => `${coord[0]} ${coord[1]}`).join(', ') + ')'
      ).join(', ');
      return `POLYGON(${ringCoords})`;
    default:
      throw new Error(`Unsupported geometry type: ${(geometry as any).type}`);
  }
};

// 从WKT格式解析
export const fromWKT = (wkt: string): Geometry => {
  const trimmed = wkt.trim().toUpperCase();
  
  if (trimmed.startsWith('POINT')) {
    const coords = trimmed.match(/POINT\(([^)]+)\)/);
    if (coords) {
      const [lon, lat] = coords[1].split(' ').map(Number);
      return { type: 'Point', coordinates: [lon, lat] };
    }
  }
  
  // 可以扩展支持其他几何类型
  throw new Error(`Unsupported WKT format: ${wkt}`);
};