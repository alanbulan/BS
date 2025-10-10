import React, { useMemo } from 'react';
import { View, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import type { FeatureCollection } from 'geojson';

type Marker = { lat: number; lng: number; title?: string };

type Props = {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Marker[];
  geojson?: FeatureCollection; // 新增：GeoJSON 覆盖
  height?: number;
};

const htmlTemplate = (centerLat: number, centerLng: number, zoom: number, markers: Marker[] | undefined, geojson: FeatureCollection | undefined) => `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; }
  .leaflet-control-attribution { display: none; }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  const map = L.map('map').setView([${centerLat}, ${centerLng}], ${zoom});
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 20
  }).addTo(map);

  // markers
  ${Array.isArray(markers) ? markers.map(m => `
    L.marker([${m.lat}, ${m.lng}]).addTo(map)${m.title ? `.bindPopup(${JSON.stringify(m.title)})` : ''};
  `).join('') : ''}

  // geojson
  ${geojson ? `
    try {
      const gj = ${JSON.stringify(geojson)};
      
      // 自定义图标
      const startIcon = L.divIcon({
        html: '<div style="background:#409EFF;width:30px;height:30px;border-radius:50%;border:4px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><div style="width:10px;height:10px;background:white;border-radius:50%;"></div></div>',
        className: '',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
      
      const endIcon = L.divIcon({
        html: '<div style="background:#67C23A;width:36px;height:36px;border-radius:50%;border:4px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.4);position:relative;"><div style="position:absolute;top:8px;left:8px;width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:8px solid white;"></div><div style="position:absolute;bottom:8px;left:8px;width:20px;height:12px;background:white;border-radius:2px 2px 0 0;"></div></div>',
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });
      
      const createMonitoringIcon = function(color) {
        return L.divIcon({
          html: '<div style="background:' + color + ';width:32px;height:32px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><div style="width:6px;height:12px;background:white;border-radius:1px;position:relative;"><div style="width:8px;height:8px;background:white;border-radius:50%;position:absolute;top:-10px;left:-1px;"></div></div></div>',
          className: '',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });
      };
      
      const layer = L.geoJSON(gj, {
        pointToLayer: function (feature, latlng) {
          const props = feature.properties || {};
          
          // 根据类型使用不同图标
          if (props.type === 'start' || props.id === 'start-marker') {
            return L.marker(latlng, { icon: startIcon }).bindPopup(props.title || '起点');
          } else if (props.type === 'end' || props.id === 'end-marker') {
            return L.marker(latlng, { icon: endIcon }).bindPopup(props.title || '终点');
          } else if (props.type === 'monitoring-station') {
            // 监测站点标记（紫色圆形图标，中间有信号图案）
            const stationColor = props.color || '#667EEA';
            const stationIcon = createMonitoringIcon(stationColor);
            const popupContent = '<strong>' + (props.title || '监测站') + '</strong>' +
              (props.isActive ? '<br><span style="color:#67C23A;">● 运行中</span>' : '<br><span style="color:#909399;">● 已停用</span>');
            return L.marker(latlng, { icon: stationIcon }).bindPopup(popupContent);
          } else if (props.level && props.level >= 1) {
            // 预警标记（根据等级使用不同颜色）
            const warningIcon = L.divIcon({
              html: '<div style="background:' + (props.color || '#F56C6C') + ';width:40px;height:40px;border-radius:50%;border:4px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:22px;">⚠</div>',
              className: '',
              iconSize: [40, 40],
              iconAnchor: [20, 20]
            });
            
            const popupContent = props.title + 
              (props.evacuation ? '<br><strong style="color:#F56C6C;">需要疏散</strong>' : '');
            return L.marker(latlng, { icon: warningIcon }).bindPopup(popupContent);
          }
          
          // 默认标记
          return L.circleMarker(latlng, {
            radius: 8,
            fillColor: props.color || '#409EFF',
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
          });
        },
        style: function (feature) {
          const p = feature.properties || {};
          const style = {
            color: p.stroke || '#2563eb',
            weight: p['stroke-width'] || 2,
            opacity: p['stroke-opacity'] ?? 0.9,
            fillColor: p.fill || '#3b82f6',
            fillOpacity: p['fill-opacity'] ?? 0.2
          };
          
          // 支持虚线样式
          if (p['stroke-dasharray']) {
            style.dashArray = p['stroke-dasharray'];
          }
          
          return style;
        },
        onEachFeature: function (feature, layer) {
          const name = feature.properties && (feature.properties.name || feature.properties.title);
          if (name && layer.bindPopup) layer.bindPopup(String(name));
        }
      }).addTo(map);
      try { map.fitBounds(layer.getBounds(), { padding: [50, 50] }); } catch (e) {}
    } catch (e) { console.error('GeoJSON render error', e); }
  ` : ''}
</script>
</body>
</html>`;

export default function MapContainer({ center = { lat: 39.9042, lng: 116.4074 }, zoom = 11, markers = [], geojson, height }: Props) {
  const source = useMemo(() => {
    return { html: htmlTemplate(center.lat, center.lng, zoom, markers, geojson as any) };
  }, [center.lat, center.lng, zoom, JSON.stringify(markers), JSON.stringify(geojson)]);

  const containerStyle = height ? { height, backgroundColor: '#fff' } : { flex: 1 as const, backgroundColor: '#fff' };

  return (
    <View style={containerStyle}>
      {Platform.OS === 'web' ? (
        // Web 平台用 iframe 兼容
        <iframe
          title="map"
          style={{ width: '100%', height: '100%', border: 'none' } as any}
          srcDoc={(source as any).html}
        />
      ) : (
        <WebView style={{ flex: 1 }} originWhitelist={['*']} source={source} />
      )}
    </View>
  );
}