let mapSource = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
let mapCopyright = 'Map tiles by Carto, under CC BY 3.0. Data by OpenStreetMap, under ODbL.';

function updateMap(data) {
  data = data || selectedRecords;
  selectedRecords = data;
  if (!data || data.length === 0) {
    showProblem("No data found yet");
    return;
  }
  if (!(Longitude in data[0] && Latitude in data[0] && Name in data[0])) {
    showProblem(
      "Table does not yet have all expected columns: Name, Longitude, Latitude. You can map custom columns in the Creator Panel."
    );
    return;
  }

  const tiles = L.tileLayer(mapSource, { attribution: mapCopyright });

  const error = document.querySelector('.error');
  if (error) { error.remove(); }
  if (amap) {
    try {
      amap.off();
      amap.remove();
    } catch (e) {
      console.warn(e);
    }
  }

  const map = L.map('map', {
    layers: [tiles],
    wheelPxPerZoomLevel: 90,
  });

  const points = [];
  popups = {};
  markers = L.markerClusterGroup({
    disableClusteringAtZoom: 18,
    maxClusterRadius: 30,
    showCoverageOnHover: true,
    clusterPane: 'clusters',
    iconCreateFunction: selectedRowClusterIconFactory(() => popups[selectedRowId]),
  });

  markers.on('click', (e) => {
    const id = e.layer.options.id;
    selectMaker(id);
  });

  for (const rec of data) {
    const { id, name, lng, lat } = getInfo(rec);
    if (String(lng) === '...') { continue; }
    if (Math.abs(lat) < 0.01 && Math.abs(lng) < 0.01) { continue; }

    const pt = new L.LatLng(lat, lng);
    points.push(pt);

    const marker = L.marker(pt, {
      title: name,
      id: id,
      icon: (id == selectedRowId) ? selectedIcon : defaultIcon,
      pane: (id == selectedRowId) ? "selectedMarker" : "otherMarkers",
    });

    marker.bindPopup(name);
    markers.addLayer(marker);
    popups[id] = marker;
  }

  map.addLayer(markers);

  clearMakers = () => map.removeLayer(markers);

  try {
    map.fitBounds(new L.LatLngBounds(points), { maxZoom: 15, padding: [0, 0] });
  } catch (err) {
    console.warn('cannot fit bounds');
  }

  function makeSureSelectedMarkerIsShown() {
    const rowId = selectedRowId;
    if (rowId && popups[rowId]) {
      var marker = popups[rowId];
      if (!marker._icon) { markers.zoomToShowLayer(marker); }
      marker.openPopup();
    }
  }

  amap = map;
  makeSureSelectedMarkerIsShown();
}
