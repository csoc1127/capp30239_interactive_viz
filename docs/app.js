
const map = new maplibregl.Map({
    container: "map",
    style: "https://tiles.stadiamaps.com/styles/stamen_watercolor.json",
    center: [-87.6298, 41.8781],
    zoom: 10,
    maxZoom: 16
});

map.addControl(new maplibregl.NavigationControl());


map.on("load", async () => {
    // Load the community boundaries and monthly birding data.
    const areas = await d3.json("data/community_areas.geojson");
    const monthly = await d3.csv("data/community_monthly.csv", d3.autoType);

    // Start with January 2024.
    const january = monthly.filter(d => d.year === 2024 && d.month === 1);

    // Match each community area to its monthly bird counts.
    const birdData = new Map(
        january.map(d => [d.community.trim().toUpperCase(), d])
    );

    // Create one point for each community with reports that month.
    const points = {
        type: "FeatureCollection",
        features: areas.features.flatMap(area => {
            const name = area.properties.community.trim().toUpperCase();
            const record = birdData.get(name);

            if (!record) {
                return [];
            }

            return [{
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: d3.geoCentroid(area)
                },
                properties: {
                    community: name,
                    birds: record.birds_counted ?? 0,
                    species: record.species,
                    checklists: record.checklists
                }
            }];
        })
    };

    // Add the points to MapLibre.
    map.addSource("bird-data", {
        type: "geojson",
        data: points
    });

    // Draw circles sized by birds counted.
    map.addLayer({
        id: "bird-circles",
        type: "circle",
        source: "bird-data",
        paint: {
            "circle-color": "#7A2137",
            "circle-opacity": 0.65,
            "circle-stroke-color": "#FFFFFF",
            "circle-stroke-width": 1,
            "circle-radius": [
                "interpolate",
                ["linear"],
                ["get", "birds"],
                0, 3,
                1000, 6,
                10000, 13,
                50000, 23
            ]
        }
    });
// Let readers choose what the circle sizes represent.
const scales = {
    birds: [0, 3, 1000, 6, 10000, 13, 50000, 23],
    species: [0, 3, 25, 7, 75, 13, 150, 23],
    checklists: [0, 3, 10, 6, 100, 13, 500, 23]
};

document.getElementById("metric").addEventListener("change", function () {
    const metric = this.value;

    map.setPaintProperty("bird-circles", "circle-radius", [
        "interpolate",
        ["linear"],
        ["coalesce", ["get", metric], 0],
        ...scales[metric]
    ]);
});
    // Click a circle to read its birding totals.
    map.on("click", "bird-circles", event => {
        const place = event.features[0].properties;

        new maplibregl.Popup()
            .setLngLat(event.lngLat)
            .setText(
            `${place.community}: ${Number(place.birds).toLocaleString()} birds reported in January 
            2024`)
            .addTo(map);
    });

    console.log(`Displayed ${points.features.length} community areas.`);
});
