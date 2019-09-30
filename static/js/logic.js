function createMap(earthquakes, boundaries) {

    // // Create the tile layers into an js object
    const urls = {
        light: "https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?access_token={accessToken}",
        custom: "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}"
    };

    const tileLayers = {

        streetMap: L.tileLayer(urls.custom, {
            attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
            maxZoom: 18,
            id: 'mapbox.streets',
            accessToken: API_KEY
        }),

        lightMap: L.tileLayer(urls.light, {
            attribution: "Map data &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a> contributors, <a href=\"http://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"http://mapbox.com\">Mapbox</a>",
            maxZoom: 18,
            id: "mapbox.light",
            accessToken: API_KEY
        }),

        comicMap: L.tileLayer(urls.custom, {
            attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
            maxZoom: 18,
            id: 'mapbox.comic',
            accessToken: API_KEY
        }),

        sateliteMap: L.tileLayer(urls.custom, {
            attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
            maxZoom: 18,
            id: 'mapbox.satellite',
            accessToken: API_KEY
        })

    };

    const baseMaps = {
        Street: tileLayers.streetMap,
        Light: tileLayers.lightMap,
        Comic: tileLayers.comicMap,
        Satelite: tileLayers.sateliteMap
        // "Satelite": sateliteMap
    };

    const overlayMaps = {
        "Fault Lines": boundaries,
        Earthquakes: earthquakes
    };

    // Create the map
    const map = L.map("map-id", {
        center: [37.0902, -95.7129], // center of US
        zoom: 3,
        layers: [tileLayers.streetMap, boundaries, earthquakes]
    });

    L.control.layers(baseMaps, overlayMaps, {
        collased: false
    }).addTo(map);

    // Create a legend
    const legend = L.control({
        position: "bottomright"
    });

    // When the layer control is added, insert a div with the class of "legend"
    legend.onAdd = function () {
        const div = L.DomUtil.create("div", "info legend");
        const magnitudes = [0, 1, 2, 3, 4, 5, 6];

        // loop through our density intervals and generate a label with a colored square for each interval
        div.innerHTML = `<strong>By magintude</strong><hr>`
        for (let i = 0; i < magnitudes.length; i++) {
            div.innerHTML +=
                `<i style="background: ${getColor(magnitudes[i] + 1)}"></i>
                ${magnitudes[i]}` + (magnitudes[i + 1] ? '&ndash;' + magnitudes[i + 1] + '<br>' : '+');
        };

        return div;
    }

    // Add the legend to the map
    legend.addTo(map);
}

url_earthquake = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson"

url_boundaries = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json"

Promise.all([d3.json(url_earthquake),
d3.json(url_boundaries)])
    .then(function (response) {

        const earthquakes = response[0].features;
        const boundaries = response[1].features;

        // Scaling for bubble size
        const valueExtent = d3.extent(earthquakes, d => d.properties.mag)
        const size = d3.scalePow()
            .exponent(2.5)
            .domain(valueExtent)
            .range([1, 30])

        // a layer group of circle markers for earth quakes
        earthQuakesMarkers = [];
        earthquakes.forEach(earthquake => {
            const lon = earthquake.geometry.coordinates[0],
                lat = earthquake.geometry.coordinates[1];

            const title = earthquake.properties.title;
            const occurAt = earthquake.properties.time / 1000,
                updatedAt = earthquake.properties.updated / 1000;
            const magnitude = earthquake.properties.mag;

            const earthquakeMarker = L.circleMarker([lat, lon], {
                radius: size(magnitude),
                color: magnitude > 6 ? 'white' : 'black',
                weight: 1,
                fillColor: getColor(magnitude),
                fillOpacity: 1
            })
                .bindPopup(`<h3>${title}<h3><hr>
                            <h4> Earthquake ID: ${earthquake.id}
                            <h4> Occurred at: ${moment.unix(occurAt).format("MM-DD-YYYY hh:mm:ss A")}<h4> Updated at: ${moment.unix(updatedAt).format("MM-DD-YYYY hh:mm:ss A")} `);

            earthQuakesMarkers.push(earthquakeMarker);
        });

        // a layer group of polyline for boundaries of tectonic plates
        const boundaryMarkers = [];
        boundaries.forEach(data => {

            const coords = data.geometry.coordinates
            // console.log(coords);
            line = coords.map(d => {
                return [d[1], d[0]]
            });

            const boundary = L.polyline(line, {
                color: 'gold',
                weight: 4
            });

            boundaryMarkers.push(boundary);

        });

        // create map with tectonic plates boundaries and earth quakes
        createMap(L.layerGroup(earthQuakesMarkers), L.layerGroup(boundaryMarkers));

    }).catch(function (err) {
        if (err) throw err;
    });


function getColor(d) {
    return d > 6 ? '#000' :
        d > 5 ? '#800026' :
            d > 4 ? '#BD0026' :
                d > 3 ? '#E31A1C' :
                    d > 2 ? '#FC4E2A' :
                        d > 1 ? '#FD8D3C' :
                            d > 0 ? '#FEB24C' :
                                '#FFEDA0';
}