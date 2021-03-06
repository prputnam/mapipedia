//
// Declarations
//

var
updatingArticles = false,
ignoreMotion = false,
apiRequest = null,
articleLayer = new PruneClusterForLeaflet(),
articleZoomBound = 12,
zoomWarningDisplayed = false;

// Map Layers
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
baseMaps = {
    "CartoDB": carto,
    "OpenStreetMap": osm,
    "Terrian": terrain,
    "Toner": toner
};

// Map itself and controls
var
map = L.map('map', {
    center: [43.0861056, -77.672703],
    zoom: 12,
    minZoom: 6,
    maxZoom: 15,
    zoomControl: false,
    layers: [carto]
}),
zoomControl = L.control.zoom({
    position: 'topright'
}),
sidebar = L.control.sidebar('article', {
    position: 'left'
}),
search = new L.Control.GeoSearch({
    provider: new L.GeoSearch.Provider.Google(),
    position: 'topleft',
    showMarker: false
}),
loadingControl = L.Control.loading({
    position: 'topleft'
}),
header = L.control.header('header'),
layerControl = L.control.layers(baseMaps);

//
// Event handlers
//

map.on('moveend', function(event) {
    if(!ignoreMotion) {
        updateArticles();
    }
});

map.on('click', function(event) {
    if(belowArticleZoomBound(map)) {
        sidebar.hide();
    }
});

sidebar.on('show', function(event) {
    ignoreMotion = true;
});

sidebar.on('shown', function(event) {
    setTimeout(function() {
        ignoreMotion = false;
    }, 250);
});

sidebar.on('hide', function(event) {
    ignoreMotion = true;
});

sidebar.on('hidden', function(event) {
    setTimeout(function() {
        ignoreMotion = false;
    }, 250);
});

//
// Functions
//

function init() {
    layerControl.addTo(map);
    articleLayer.addTo(map);

    map.addControl(zoomControl);

    map.addControl(sidebar);

    search.addTo(map);

    map.addControl(loadingControl);

    header.addTo(map);

    sidebar.setContent(buildWelcomeSidebarContent());
    sidebar.show();
    // sidebar doesn't fire shown on load, so do it manually
    sidebar.fireEvent('shown');

    updateArticles();
}

function belowArticleZoomBound(map) {
    return map.getZoom() >= articleZoomBound;
}

function getFirstProperty(object) {
    for(var property in object) return object[property];
}

function buildWelcomeSidebarContent() {
    var html = `
    <p>The pins on the map represent Wikipedia articles, click on them to view the article details. The circles denote a cluster of articles. Clicking on these will zoom the map in so individual pins can be selected.</p>
    <p>Pan about the map or use the search in the top-right corner to search for a location on the map.</p>
    <p>The menu in the top-left corner offers multiple basemaps to use.</p>
    <p>Clicking anywhere on the map will dismiss this panel.</p>
    <hr>
    <p class="italic">Thanks to both <a href="http://www.geonames.org">GeoNames</a> and <a href="http://www.www.wikipedia.org">Wikipedia</a> for providing the services and content.`

    return html;
}

function buildZoomWarningSidebarContent(levelChangeNeeded) {
    var html = `
    <h3>Articles will not be drawn until you have zoomed back in ` + levelChangeNeeded + ` level` + (levelChangeNeeded > 1 ? 's' : '') + `.</h3>
   <p>You may continue to browse the map at any zoom level, but articles will not be displayed.</p>`

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
    articleData = getFirstProperty(data.query.pages),
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

    if(belowArticleZoomBound(map)) {

        if(zoomWarningDisplayed) {
            sidebar.hide();
            sidebar.showCloseButton();
            zoomWarningDisplayed = false;
        }

        if(apiRequest) apiRequest.abort();

        apiRequest = $.getJSON(
            'http://api.geonames.org/wikipediaBoundingBoxJSON',
            getRequestParameters()
        );

        apiRequest.done(function(data) {
            articleLayer.RemoveMarkers();
            addArticlesToMap(data);
        });
    } else {
        var levelChangeNeeded = articleZoomBound - map.getZoom();
        sidebar.setContent(buildZoomWarningSidebarContent(levelChangeNeeded));
        sidebar.hideCloseButton();

        articleLayer.RemoveMarkers();
        articleLayer.ProcessView();

        sidebar.show();
        zoomWarningDisplayed = true;
        map.fireEvent("dataload");
    }
}

//
// Extensions
//

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

sidebar.hideCloseButton = function() {
    $('a.close').hide();
};

sidebar.showCloseButton = function() {
    $('a.close').show();
};

//
// Start the wheels turning
//

init();