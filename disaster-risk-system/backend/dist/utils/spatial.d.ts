export interface Point {
    type: 'Point';
    coordinates: [number, number];
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
export declare const toRadians: (degrees: number) => number;
export declare const toDegrees: (radians: number) => number;
export declare const calculateDistance: (point1: Point, point2: Point) => number;
export declare const calculateBearing: (point1: Point, point2: Point) => number;
export declare const calculateDestination: (point: Point, distance: number, bearing: number) => Point;
export declare const pointInPolygon: (point: Point, polygon: Polygon) => boolean;
export declare const calculatePolygonArea: (polygon: Polygon) => number;
export declare const calculateLineLength: (lineString: LineString) => number;
export declare const getBoundingBox: (geometry: Geometry) => {
    minLon: number;
    minLat: number;
    maxLon: number;
    maxLat: number;
};
export declare const simplifyLine: (coordinates: [number, number][], tolerance: number) => [number, number][];
export declare const createBuffer: (point: Point, radius: number, segments?: number) => Polygon;
export declare const toWKT: (geometry: Geometry) => string;
export declare const fromWKT: (wkt: string) => Geometry;
//# sourceMappingURL=spatial.d.ts.map