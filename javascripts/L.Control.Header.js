L.Control.Header = L.Control.extend({

    initialize: function(template) {
        var
        content = this._content = L.DomUtil.get(template),
        container = this._container = L.DomUtil.create('div', 'leaflet-header');

        content.parentNode.removeChild(content);
        L.DomUtil.addClass(content, 'leaflet-control');

        container.appendChild(content);
    },

    addTo: function(map) {
        var
        container = this._container,
        content = this._content;

        var controlContainer = map._controlContainer;
        controlContainer.insertBefore(container, controlContainer.firstChild);

        this._map = map;

        return this;
    }

});

L.control.header = function(template) {
    return new L.Control.Header(template);
}