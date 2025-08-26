"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromWKT = exports.toWKT = exports.createBuffer = exports.simplifyLine = exports.getBoundingBox = exports.calculateLineLength = exports.calculatePolygonArea = exports.pointInPolygon = exports.calculateDestination = exports.calculateBearing = exports.calculateDistance = exports.toDegrees = exports.toRadians = void 0;
const EARTH_RADIUS = 6371000;
const toRadians = (degrees) => {
    return degrees * (Math.PI / 180);
};
exports.toRadians = toRadians;
const toDegrees = (radians) => {
    return radians * (180 / Math.PI);
};
exports.toDegrees = toDegrees;
const calculateDistance = (point1, point2) => {
    const [lon1, lat1] = point1.coordinates;
    const [lon2, lat2] = point2.coordinates;
    const dLat = (0, exports.toRadians)(lat2 - lat1);
    const dLon = (0, exports.toRadians)(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((0, exports.toRadians)(lat1)) * Math.cos((0, exports.toRadians)(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS * c;
};
exports.calculateDistance = calculateDistance;
const calculateBearing = (point1, point2) => {
    const [lon1, lat1] = point1.coordinates;
    const [lon2, lat2] = point2.coordinates;
    const dLon = (0, exports.toRadians)(lon2 - lon1);
    const lat1Rad = (0, exports.toRadians)(lat1);
    const lat2Rad = (0, exports.toRadians)(lat2);
    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
        Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    const bearing = (0, exports.toDegrees)(Math.atan2(y, x));
    return (bearing + 360) % 360;
};
exports.calculateBearing = calculateBearing;
const calculateDestination = (point, distance, bearing) => {
    const [lon, lat] = point.coordinates;
    const bearingRad = (0, exports.toRadians)(bearing);
    const latRad = (0, exports.toRadians)(lat);
    const lonRad = (0, exports.toRadians)(lon);
    const angularDistance = distance / EARTH_RADIUS;
    const destLatRad = Math.asin(Math.sin(latRad) * Math.cos(angularDistance) +
        Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearingRad));
    const destLonRad = lonRad + Math.atan2(Math.sin(bearingRad) * Math.sin(angularDistance) * Math.cos(latRad), Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(destLatRad));
    return {
        type: 'Point',
        coordinates: [(0, exports.toDegrees)(destLonRad), (0, exports.toDegrees)(destLatRad)]
    };
};
exports.calculateDestination = calculateDestination;
const pointInPolygon = (point, polygon) => {
    const [x, y] = point.coordinates;
    const vertices = polygon.coordinates[0];
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
exports.pointInPolygon = pointInPolygon;
const calculatePolygonArea = (polygon) => {
    const coordinates = polygon.coordinates[0];
    if (coordinates.length < 3) {
        return 0;
    }
    let area = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
        const [lon1, lat1] = coordinates[i];
        const [lon2, lat2] = coordinates[i + 1];
        area += (0, exports.toRadians)(lon2 - lon1) * (2 + Math.sin((0, exports.toRadians)(lat1)) + Math.sin((0, exports.toRadians)(lat2)));
    }
    area = Math.abs(area) * EARTH_RADIUS * EARTH_RADIUS / 2;
    return area;
};
exports.calculatePolygonArea = calculatePolygonArea;
const calculateLineLength = (lineString) => {
    const coordinates = lineString.coordinates;
    let totalLength = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
        const point1 = { type: 'Point', coordinates: coordinates[i] };
        const point2 = { type: 'Point', coordinates: coordinates[i + 1] };
        totalLength += (0, exports.calculateDistance)(point1, point2);
    }
    return totalLength;
};
exports.calculateLineLength = calculateLineLength;
const getBoundingBox = (geometry) => {
    let coordinates = [];
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
exports.getBoundingBox = getBoundingBox;
const simplifyLine = (coordinates, tolerance) => {
    if (coordinates.length <= 2) {
        return coordinates;
    }
    const douglasPeucker = (points, epsilon) => {
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
        }
        else {
            return [start, end];
        }
    };
    return douglasPeucker(coordinates, tolerance);
};
exports.simplifyLine = simplifyLine;
const pointToLineDistance = (point, lineStart, lineEnd) => {
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
    let xx, yy;
    if (param < 0) {
        xx = x1;
        yy = y1;
    }
    else if (param > 1) {
        xx = x2;
        yy = y2;
    }
    else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }
    const dx = x - xx;
    const dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
};
const createBuffer = (point, radius, segments = 16) => {
    const coordinates = [];
    for (let i = 0; i <= segments; i++) {
        const angle = (i * 360) / segments;
        const destination = (0, exports.calculateDestination)(point, radius, angle);
        coordinates.push(destination.coordinates);
    }
    return {
        type: 'Polygon',
        coordinates: [coordinates]
    };
};
exports.createBuffer = createBuffer;
const toWKT = (geometry) => {
    switch (geometry.type) {
        case 'Point':
            return `POINT(${geometry.coordinates[0]} ${geometry.coordinates[1]})`;
        case 'LineString':
            const lineCoords = geometry.coordinates.map(coord => `${coord[0]} ${coord[1]}`).join(', ');
            return `LINESTRING(${lineCoords})`;
        case 'Polygon':
            const ringCoords = geometry.coordinates.map(ring => '(' + ring.map(coord => `${coord[0]} ${coord[1]}`).join(', ') + ')').join(', ');
            return `POLYGON(${ringCoords})`;
        default:
            throw new Error(`Unsupported geometry type: ${geometry.type}`);
    }
};
exports.toWKT = toWKT;
const fromWKT = (wkt) => {
    const trimmed = wkt.trim().toUpperCase();
    if (trimmed.startsWith('POINT')) {
        const coords = trimmed.match(/POINT\(([^)]+)\)/);
        if (coords) {
            const [lon, lat] = coords[1].split(' ').map(Number);
            return { type: 'Point', coordinates: [lon, lat] };
        }
    }
    throw new Error(`Unsupported WKT format: ${wkt}`);
};
exports.fromWKT = fromWKT;
//# sourceMappingURL=spatial.js.map