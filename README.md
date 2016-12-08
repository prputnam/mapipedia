# mapipedia

A simple application that allows users to browse a map that is populated with pins representing geocoded [Wikipedia](https://www.wikipedia.org/) articles. It was created as a final project for Introduction to Geospatial Technologies taught by [Dr. Brian Tomaszewski](https://people.rit.edu/bmtski/) at [Rochester Institute of Technology](http://www.rit.edu/).

## Data

The geocoded articles and their locations are gathered via an API provided by [GeoNames](http://www.geonames.org/), with further details about the articles being gathered directly from [Wikipedia's API](https://en.wikipedia.org/w/api.php).

## Map

The mapping library used in this project is [Leaflet.js](http://leafletjs.com/). In addition, a few plugins are being used:
* [GeoSearch](https://github.com/smeijer/L.GeoSearch) to allow the user to search for locations
* [Sidebar](https://github.com/Turbo87/leaflet-sidebar) with some tweaks to display information on left-side of the map
* [PruneCluster](https://github.com/SINTEF-9012/PruneCluster) to handle the clustering of pins on the map
* [Leaflet.loading](https://github.com/ebrelsford/Leaflet.loading) to display a loading indicator

The maps tiles are provided by [OpenStreetMap](https://www.openstreetmap.org/), [Stamen](http://maps.stamen.com), and [CartoDB](https://carto.com/location-data-services/basemaps/).
