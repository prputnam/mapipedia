var articleLayer = new L.layerGroup();

function getCardinalBounds() {
    var
    bounds = map.getBounds(),
    response = {
        north: bounds.getNorthEast().lat,
        south: bounds.getSouthWest().lat,
        east: bounds.getNorthEast().lng,
        west: bounds.getSouthWest().lng
    };

    return response;
}

function getRequestParameters() {
    return $.extend(getCardinalBounds(), {username: 'prputnam', maxRows: 1000});
}

function addArticlesToMap(data) {
    articleLayer.clearLayers();

    for (var i = 0; i < data.geonames.length; i++) {
        var article = data.geonames[i];

        articleLayer.addLayer(L.marker([article.lat, article.lng]).bindPopup('<a href="https://' + article.wikipediaUrl + '">' + article.title + '</a>'));
    }

    articleLayer.addTo(map);
}

function updateArticles() {
    $.getJSON(
        'http://api.geonames.org/wikipediaBoundingBoxJSON',
        getRequestParameters(),
        function(data) {
            addArticlesToMap(data);
        }
    );
}

var
terrain =  L.tileLayer('http://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.{ext}', {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 20,
    ext: 'png'
}),
toner =  L.tileLayer('http://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.{ext}', {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 20,
    ext: 'png'
}),
map = L.map('map', {
    center: [43.0861056, -77.672703],
    zoom: 15,
    layers: [terrain, toner]
}),
baseMaps = {
    "Terrian": terrain,
    "Toner": toner
},
infoLayers = {
    "Articles": articleLayer
};

var layerControl = L.control.layers(baseMaps, infoLayers).addTo(map);

map.on('moveend', function(event) {
    updateArticles();
});

updateArticles();