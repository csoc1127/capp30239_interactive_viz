
const map = new maplibregl.Map({
    container: "map",
    style: "https://tiles.stadiamaps.com/styles/stamen_watercolor.json",
    center: [-87.6298, 41.8781],
    zoom: 10,
    maxZoom: 16
});

map.addControl(new maplibregl.NavigationControl());
