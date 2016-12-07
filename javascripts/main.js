var
updatingArticles = false,
apiRequest = null,
articleLayer = new PruneClusterForLeaflet(),
maxArticleZoomLevel = 12,
zoomWarningDisplayed = false;

articleLayer.PrepareLeafletMarker = function(leafletMarker, markerData) {
    leafletMarker.on('click', function(){
        var params = {
            action: "query",
            format: "json",
            titles: markerData.title,
            prop: "pageimages|extracts|info",
            pithumbsize: 300,
            exintro: true,
            inprop: 'url',
            origin: '*'
        };

        var req = $.getJSON(
            'https://en.wikipedia.org/w/api.php',
            params
        );

        req.done(function(data) {
            var content = buildSidebarContent(data);
            sidebar.setContent(content);
            sidebar.show();
        });
    });
};

function buildWelcomeSidebarContent() {
    var html = '';

    html += '<h1>mapipedia</h1>';
    html += '<hr>';
    html += '<p>The pins on the map represent Wikipedia articles, click on them to view the article details. The circles denote a cluster of articles. Clicking on these will zoom the map in so individual pins can be selected.</p>';
    html += '<p>Pan about the map or use the search in the top-right corner to search for a location on the map.</p>';
    html += '<p>The menu in the top-left corner offers multiple basemaps to use.</p>'
    html += '<p>Clicking anywhere on the map will dismiss this panel.</p>';
    html += '<hr>';
    html += '<p class="italic">Thanks to both <a href="http://www.geonames.org">GeoNames</a> and <a href="http://www.www.wikipedia.org">Wikipedia</a> for providing the services and content.';

    return html;
}

function buildZoomWarningSidebarContent(levelChangeNeeded) {
    var html = "";

    html += '<h3>Articles will not be drawn until you have zoomed back in ' + levelChangeNeeded + ' level' + (levelChangeNeeded > 1 ? 's' : '') + '.</h3>';
    html += '<p>You may continue to browse the map at any zoom level, but articles will not be displayed.</p>';

    return html;
}

function buildSidebarContent(data) {
    var
    content = extractContentFromWikiResponse(data),
    html = '';

    html += '<h1>' + content.title + '</h1>';
    html += '<hr>';

    if(content.image)
        html += '<img src=' + content.image + ' />';

    html += content.summary;
    html += '<hr>';
    html += '<p>View the <a href="' + content.url + '">full article</a> on <a href="https://www.wikipedia.org/">Wikipedia</a>.</p>';

    return html;
}

function extractContentFromWikiResponse(data) {
    var
    articleData = Object.values(data.query.pages)[0],
    content = {
        title: articleData.title,
        summary: articleData.extract,
        url: articleData.fullurl
    };

    if(articleData.thumbnail) {
        content.image = articleData.thumbnail.source;
    }

    return content;
}

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

    for (var i = 0; i < data.geonames.length; i++) {
        var
        article = data.geonames[i],
        marker = new PruneCluster.Marker(article.lat, article.lng);
        marker.data.title = article.title;
        marker.data.sidebarContent = '<h1>' + article.title + '</h1> <p>' + article.summary + '</p>';

        articleLayer.RegisterMarker(marker);
    }

    articleLayer.ProcessView();
    map.fireEvent("dataload");
}

function updateArticles() {
    map.fireEvent("dataloading");
    articleLayer.RemoveMarkers();
    articleLayer.ProcessView();

    if(map.getZoom() >= maxArticleZoomLevel) {

        if(zoomWarningDisplayed) {
            sidebar.hide();
            zoomWarningDisplayed = false;
        }

        if(apiRequest) apiRequest.abort();

        apiRequest = $.getJSON(
            'http://api.geonames.org/wikipediaBoundingBoxJSON',
            getRequestParameters()
        );

        apiRequest.done(function(data) {
            addArticlesToMap(data);
        });
    } else {
        var levelChangeNeeded = maxArticleZoomLevel - map.getZoom();
        sidebar.setContent(buildZoomWarningSidebarContent(levelChangeNeeded));

        articleLayer.ma

        sidebar.show();
        zoomWarningDisplayed = true;
        map.fireEvent("dataload");
    }
}

var
carto = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
    subdomains: 'abcd',
    maxZoom: 19
}),
terrain =  L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.{ext}', {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    ext: 'png'
}),
toner =  L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.{ext}', {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    ext: 'png'
}),
osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
}),
map = L.map('map', {
    center: [43.0861056, -77.672703],
    zoom: 12,
    minZoom: 8,
    maxZoom: 15,
    zoomControl: false,
    layers: [carto]
}),
baseMaps = {
    "CartoDB": carto,
    "OpenStreetMap": osm,
    "Terrian": terrain,
    "Toner": toner
};

L.control.layers(baseMaps).addTo(map);
articleLayer.addTo(map);

var zoomControl = L.control.zoom({
    position: 'topright'
});

map.addControl(zoomControl);

var sidebar = L.control.sidebar('sidebar', {
    position: 'left'
});

map.addControl(sidebar);

new L.Control.GeoSearch({
    provider: new L.GeoSearch.Provider.Google(),
    position: 'topleft',
    showMarker: false
}).addTo(map);

var loadingControl = L.Control.loading({
    position: 'topleft'
});

map.addControl(loadingControl);

sidebar.setContent(buildWelcomeSidebarContent());
sidebar.show();


map.on('moveend', function(event) {
    updateArticles();
});

map.on('click', function(event) {
    if(map.getZoom() >= maxArticleZoomLevel) {
        sidebar.hide();
    }
})

updateArticles();