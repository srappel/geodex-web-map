/**
*  This top section written by Stephen Appel for the Geodex Web Map at the AGS Library
*  It's a dirty DD to DMS converter that really only works for this specific plugin
*  but could be adopted.  srappel@uwm.edu
*  Changed items can be found by searching for "//SRA"
*                                      
*         *** Adds function to convert DD to DMS for prettier labels on the graticule image overlay ***
*/

//Should we convert DD to DMS?
 var convert = true; //This actually changes stuff in the plugin source code
                        //effectively disables my section of the code


function convertDD2DMS(deg, //a string version of the coordinage
                        axis) { //lat or long?
    
    //***Many calculations done in this var algebra***
    var dd = parseFloat(deg), // The float version of the input coordinate
        d = Math.floor(dd), //The floor of dd, The degree minus all the decimals
        mm = (dd - d) * 60, //The fractional remains after finding the floor of dd, x 60
        m = Math.floor(mm), //The floor of mm, the minutes minus decimals
        ss = (mm - m) * 60, //The fractional remains from the minutes calculation
        s = Math.floor(ss), //Effectively rounds the seconds to an integer
        dir = deg.slice(-1), //The "deg" input actually has a N, S, E, or W calculated by the plugin.  This grabs it.
        DMS = 'error', //This can probably be eliminted eventually.  It's just for debugging.
        eqpm = '', //This variable gets used below for special lines (PM, Equator, and 180) (Can probably be refactored out)
        showMin = true,//Sets the default for this switch
        showSec = false, //Same as above
        currentZoom = theMap.getZoom(); //Gets the current map zoom level for determining formatting
    
    //Here you can adjust the zoom level to include or exclude *Minutes* in the label
    if (currentZoom < 9) {
        showMin = false;
    } else if (currentZoom >= 9) {
        showMin = true;
    }
    
    //Here you can adjust the zoom level to include or exclude *Seconds* in the label
    if (currentZoom >= 16) {
        showSec = true;
    } else {
        showSec = false;
    }
    
    //Dealing with an annoying rounding bug
    if ( s >= 59 ) {
        s = 0;
        m += 1;
    };
    
    if ( m >= 59 ) {
        m = 0;
        d += 1;
    };
    
    if ( s == 29 ) {
        s = 30;
    };
    
    
    //This is just a fail safe for debugging
    if ( convert === false ) {
        return deg
    };
    
    //These are for the special cases (PM, EQ, and 180deg {Special Char for degree is \xB0})
    if (axis === 'lat') { //Assigns Equator label
        if (dd == 0) {
            eqpm = 'Equator';
            return eqpm;
        }; 
        
    } else if (axis === 'lng') { //Assigns Prime Meridian Label
        if (dd == 0) {
            eqpm = 'PM';
            return eqpm; 
        } else if (dd == 180) { //Assigns 180th Meridian Label (No cardinal direction)
            eqpm = '180\xB0';
            return eqpm;
        };
    } else { //Probably unecessary, but a good fail safe for debugging
        console.log('The convertDD2DMS function does not know the axis')
    };      
    
    //finally we build the string for the label
    if (showSec === true) {
        DMS = d + '\xB0 ' + m + '" ' + s + "' " + dir;
    } else if (showMin === false) {
        DMS = d + '\xB0 ' + dir;
    } else {
        DMS = d + '\xB0 ' + m + '" ' + dir;
    };
    
    return DMS;
}

/**
*  Create a Canvas as ImageOverlay to draw the Lat/Lon Graticule,
*  and show the axis tick label on the edge of the map.
*  Author: lanwei@cloudybay.com.tw
*
*  Some edits by Stephen Appel to make the code below jive with my converter above
*  And also some edits to turn off right and bottom labels
*/

L.LatLngGraticule = L.Layer.extend({
    options: {
        showLabel: true,
        opacity: 1,
        weight: 0.8,
        color: '#aaa',
        font: '12px Verdana',
        lngLineCurved: 0,
        latLineCurved: 0,
        zoomInterval: [
            {start: 2, end: 2, interval: 40},
            {start: 3, end: 3, interval: 20},
            {start: 4, end: 4, interval: 10},
            {start: 5, end: 7, interval: 5},
            {start: 8, end: 20, interval: 1}
        ]
    },

    initialize: function (options) {
        L.setOptions(this, options);

        var defaultFontName = 'Verdana';
        var _ff = this.options.font.split(' ');
        if (_ff.length < 2) {
            this.options.font += ' ' + defaultFontName;
        }

        if (!this.options.fontColor) {
            this.options.fontColor = this.options.color;
        }

        if (this.options.zoomInterval) {
            if (this.options.zoomInterval.latitude) {
                this.options.latInterval = this.options.zoomInterval.latitude;
                if (!this.options.zoomInterval.longitude) {
                    this.options.lngInterval = this.options.zoomInterval.latitude;
                }
            }
            if (this.options.zoomInterval.longitude) {
                this.options.lngInterval = this.options.zoomInterval.longitude;
                if (!this.options.zoomInterval.latitude) {
                    this.options.latInterval = this.options.zoomInterval.longitude;
                }
            }
            if (!this.options.latInterval) {
                this.options.latInterval = this.options.zoomInterval;
            }
            if (!this.options.lngInterval) {
                this.options.lngInterval = this.options.zoomInterval;
            }
        }
    },

    onAdd: function (map) {
        this._map = map;

        if (!this._container) {
            this._initCanvas();
        }

        map._panes.overlayPane.appendChild(this._container);

        map.on('viewreset', this._reset, this);
        map.on('move', this._reset, this);
        map.on('moveend', this._reset, this);

// 		if (map.options.zoomAnimation && L.Browser.any3d) {
// 			map.on('zoom', this._animateZoom, this);
// 		}

        this._reset();
    },

    onRemove: function (map) {
        map.getPanes().overlayPane.removeChild(this._container);

        map.off('viewreset', this._reset, this);
        map.off('move', this._reset, this);
        map.off('moveend', this._reset, this);

// 		if (map.options.zoomAnimation) {
// 			map.off('zoom', this._animateZoom, this);
// 		}
    },

    addTo: function (map) {
        map.addLayer(this);
        return this;
    },

    setOpacity: function (opacity) {
        this.options.opacity = opacity;
        this._updateOpacity();
        return this;
    },

    bringToFront: function () {
        if (this._canvas) {
            this._map._panes.overlayPane.appendChild(this._canvas);
        }
        return this;
    },

    bringToBack: function () {
        var pane = this._map._panes.overlayPane;
        if (this._canvas) {
            pane.insertBefore(this._canvas, pane.firstChild);
        }
        return this;
    },

    getAttribution: function () {
        return this.options.attribution;
    },

    _initCanvas: function () {
        this._container = L.DomUtil.create('div', 'leaflet-image-layer');

        this._canvas = L.DomUtil.create('canvas', '');

        if (this._map.options.zoomAnimation && L.Browser.any3d) {
            L.DomUtil.addClass(this._canvas, 'leaflet-zoom-animated');
        } else {
            L.DomUtil.addClass(this._canvas, 'leaflet-zoom-hide');
        }

        this._updateOpacity();

        this._container.appendChild(this._canvas);

        L.extend(this._canvas, {
            onselectstart: L.Util.falseFn,
            onmousemove: L.Util.falseFn,
            onload: L.bind(this._onCanvasLoad, this)
        });
    },

// 	_animateZoom: function (e) {
// 		var map = this._map,
// 			container = this._container,
// 			canvas = this._canvas,
// 			zoom = map.getZoom(),
// 			center = map.getCenter(),
// 			scale = map.getZoomScale(zoom),
// 			nw = map.containerPointToLatLng([0, 0]),
// 			se = map.containerPointToLatLng([canvas.width, canvas.height]),
//
// 			topLeft = map._latLngToNewLayerPoint(nw, zoom, center),
// 			size = map._latLngToNewLayerPoint(se, zoom, center)._subtract(topLeft),
// 			origin = topLeft._add(size._multiplyBy((1 / 2) * (1 - 1 / scale)));
//
// 		L.DomUtil.setTransform(container, origin, scale);
// 	},

    _reset: function () {
        var container = this._container,
            canvas = this._canvas,
            size = this._map.getSize(),
            lt = this._map.containerPointToLayerPoint([0, 0]);

        L.DomUtil.setPosition(container, lt);

        container.style.width = size.x + 'px';
        container.style.height = size.y + 'px';

        canvas.width  = size.x;
        canvas.height = size.y;
        canvas.style.width  = size.x + 'px';
        canvas.style.height = size.y + 'px';

        this.__calcInterval();

        this.__draw(true);
    },

    _onCanvasLoad: function () {
        this.fire('load');
    },

    _updateOpacity: function () {
        L.DomUtil.setOpacity(this._canvas, this.options.opacity);
    },

    __format_lat: function(lat) {
        if (this.options.latFormatTickLabel) {
            return this.options.latFormatTickLabel(lat);
        }

        // todo: format type of float
        if (lat < 0) {
            return '' + (lat*-1) + 'S';
        }
        else if (lat > 0) {
            return '' + lat + 'N';
        }
        return '' + lat;
    },

    __format_lng: function(lng) {
        if (this.options.lngFormatTickLabel) {
            return this.options.lngFormatTickLabel(lng);
        }

        // todo: format type of float
        if (lng > 180) {
            return '' + (360 - lng) + 'W';
        }
        else if (lng > 0 && lng < 180) {
            return '' + lng + 'E';
        }
        else if (lng < 0 && lng > -180) {
            return '' + (lng*-1) + 'W';
        }
        else if (lng == -180) {
            return '' + (lng*-1);
        }
        else if (lng < -180) {
            return '' + (360 + lng) + 'E';//SRA (fixed the bug by changing W to E here)
        }
        return '' + lng;
    },

    __calcInterval: function() {
        var zoom = this._map.getZoom();
        if (this._currZoom != zoom) {
            this._currLngInterval = 0;
            this._currLatInterval = 0;
            this._currZoom = zoom;
        }

        var interv;

        if (!this._currLngInterval) {
            try {
                for (var idx in this.options.lngInterval) {
                    var dict = this.options.lngInterval[idx];
                    if (dict.start <= zoom) {
                        if (dict.end && dict.end >= zoom) {
                            this._currLngInterval = dict.interval;
                            break;
                        }
                    }
                }
            }
            catch(e) {
                this._currLngInterval = 0;
            }
        }

        if (!this._currLatInterval) {
            try {
                for (var idx in this.options.latInterval) {
                    var dict = this.options.latInterval[idx];
                    if (dict.start <= zoom) {
                        if (dict.end && dict.end >= zoom) {
                            this._currLatInterval = dict.interval;
                            break;
                        }
                    }
                }
            }
            catch(e) {
                this._currLatInterval = 0;
            }
        }
    },

    __draw: function(label) {
        function _parse_px_to_int(txt) {
            if (txt.length > 2) {
                if (txt.charAt(txt.length-2) == 'p') {
                    txt = txt.substr(0, txt.length-2);
                }
            }
            try {
                return parseInt(txt, 10);
            }
            catch(e) {}
            return 0;
        };

        var canvas = this._canvas,
            map = this._map,
            curvedLon = this.options.lngLineCurved,
            curvedLat = this.options.latLineCurved;

        if (L.Browser.canvas && map) {
            if (!this._currLngInterval || !this._currLatInterval) {
                this.__calcInterval();
            }

            var latInterval = this._currLatInterval,
                lngInterval = this._currLngInterval;

            var ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.lineWidth = this.options.weight;
            ctx.strokeStyle = this.options.color;
            ctx.fillStyle = this.options.fontColor;

            if (this.options.font) {
                ctx.font = this.options.font;
            }
            var txtWidth = ctx.measureText('0').width;
            var txtHeight = 12;
            try {
                var _font_size = ctx.font.split(' ')[0];
                txtHeight = _parse_px_to_int(_font_size);
            }
            catch(e) {}

            var ww = canvas.width,
                hh = canvas.height;

            var lt = map.containerPointToLatLng(L.point(0, 0));
            var rt = map.containerPointToLatLng(L.point(ww, 0));
            var rb = map.containerPointToLatLng(L.point(ww, hh));

            var _lat_b = rb.lat,
                _lat_t = lt.lat;
            var _lon_l = lt.lng,
                _lon_r = rt.lng;

            var _point_per_lat = (_lat_t - _lat_b) / (hh * 0.2);
            if (_point_per_lat < 1) { _point_per_lat = 1; }
            if (_lat_b < -90) {
                _lat_b = -90;
            }
            else {
                _lat_b = parseInt(_lat_b - _point_per_lat, 10);
            }

            if (_lat_t > 90) {
                _lat_t = 90;
            }
            else {
                _lat_t = parseInt(_lat_t + _point_per_lat, 10);
            }

            var _point_per_lon = (_lon_r - _lon_l) / (ww * 0.2);
            if (_point_per_lon < 1) { _point_per_lon = 1; }
            if (_lon_l > 0 && _lon_r < 0) {
                _lon_r += 360;
            }
            _lon_r = parseInt(_lon_r + _point_per_lon, 10);
            _lon_l = parseInt(_lon_l - _point_per_lon, 10);

            var ll, latstr, lngstr, _lon_delta = 0.5;
            function __draw_lat_line(self, lat_tick) {
                ll = map.latLngToContainerPoint(L.latLng(lat_tick, _lon_l));
                latstr = self.__format_lat(lat_tick);
                txtWidth = ctx.measureText(latstr).width;

                if (curvedLat) {
                    if (typeof(curvedLat) == 'number') {
                        _lon_delta = curvedLat;
                    }

                    var __lon_left = _lon_l, __lon_right = _lon_r;
                    if (ll.x > 0) {
                        var __lon_left = map.containerPointToLatLng(L.point(0, ll.y));
                        __lon_left = __lon_left.lng - _point_per_lon;
                        ll.x = 0;
                    }
                    var rr = map.latLngToContainerPoint(L.latLng(lat_tick, __lon_right));
                    if (rr.x < ww) {
                        __lon_right = map.containerPointToLatLng(L.point(ww, rr.y));
                        __lon_right = __lon_right.lng + _point_per_lon;
                        if (__lon_left > 0 && __lon_right < 0) {
                            __lon_right += 360;
                        }
                    }

                    ctx.beginPath();
                    ctx.moveTo(ll.x, ll.y);
                    var _prev_p = null;
                    for (var j=__lon_left; j<=__lon_right; j+=_lon_delta) {
                        rr = map.latLngToContainerPoint(L.latLng(lat_tick, j));
                        ctx.lineTo(rr.x, rr.y);

                        if (self.options.showLabel && label && _prev_p != null) {
                            if (_prev_p.x < 0 && rr.x >= 0) {
                                var _s = (rr.x - 0) / (rr.x - _prev_p.x);
                                var _y = rr.y - ((rr.y - _prev_p.y) * _s);
                                ctx.fillText(convertDD2DMS(latstr, 'lat'), 0, _y + (txtHeight/2));//SRA
                            }
                            else if (_prev_p.x <= (ww-txtWidth) && rr.x > (ww-txtWidth)) {
                                var _s = (rr.x - ww) / (rr.x - _prev_p.x);
                                var _y = rr.y - ((rr.y - _prev_p.y) * _s);
                                ctx.fillText(convertDD2DMS(latstr, 'lat'), ww-txtWidth, _y + (txtHeight/2)-2);//SRA
                            }
                        }

                        _prev_p = {x:rr.x, y:rr.y, lon:j, lat:i};
                    }
                    ctx.stroke();
                }
                else {
                    var __lon_right = _lon_r;
                    var rr = map.latLngToContainerPoint(L.latLng(lat_tick, __lon_right));
                    if (curvedLon) {
                        __lon_right = map.containerPointToLatLng(L.point(0, rr.y));
                        __lon_right = __lon_right.lng;
                        rr = map.latLngToContainerPoint(L.latLng(lat_tick, __lon_right));

                        var __lon_left = map.containerPointToLatLng(L.point(ww, rr.y));
                        __lon_left = __lon_left.lng;
                        ll = map.latLngToContainerPoint(L.latLng(lat_tick, __lon_left));
                    }

                    ctx.beginPath();
                    ctx.moveTo(ll.x+1, ll.y);
                    ctx.lineTo(rr.x-1, rr.y);
                    ctx.stroke();
                    if (self.options.showLabel && label) {
                        var _yy = ll.y + (txtHeight/2)-2;
                        ctx.fillText(convertDD2DMS(latstr, 'lat'), 0, _yy);//SRA
                        //Uncomment to include the right graticule labels
                        //ctx.fillText(convertDD2DMS(latstr, 'lat'), ww-txtWidth, _yy);
                    }
                }
            };

            if (latInterval > 0) {
                for (var i=latInterval; i<=_lat_t; i+=latInterval) {
                    if (i >= _lat_b) {
                        __draw_lat_line(this, i);
                    }
                }
                for (var i=0; i>=_lat_b; i-=latInterval) {
                    if (i <= _lat_t) {
                        __draw_lat_line(this, i);
                    }
                }
            }

            function __draw_lon_line(self, lon_tick) {
                lngstr = self.__format_lng(lon_tick);
                txtWidth = ctx.measureText(lngstr).width;
                var bb = map.latLngToContainerPoint(L.latLng(_lat_b, lon_tick));

                if (curvedLon) {
                    if (typeof(curvedLon) == 'number') {
                        _lat_delta = curvedLon;
                    }

                    ctx.beginPath();
                    ctx.moveTo(bb.x, bb.y);
                    var _prev_p = null;
                    for (var j=_lat_b; j<_lat_t; j+=_lat_delta) {
                        var tt = map.latLngToContainerPoint(L.latLng(j, lon_tick));
                        ctx.lineTo(tt.x, tt.y);

                        if (self.options.showLabel && label && _prev_p != null) {
                            if (_prev_p.y > 8 && tt.y <= 8) {
                                ctx.fillText(convertDD2DMS(lngstr, 'lng'), tt.x - (txtWidth/2), txtHeight);//SRA
                            }
                            else if (_prev_p.y >= hh && tt.y < hh) {
                                ctx.fillText(convertDD2DMS(lngstr, 'lng'), tt.x - (txtWidth/2), hh-2);//SRA
                            }
                        }

                        _prev_p = {x:tt.x, y:tt.y, lon:lon_tick, lat:j};
                    }
                    ctx.stroke();
                }
                else {
                    var __lat_top = _lat_t;
                    var tt = map.latLngToContainerPoint(L.latLng(__lat_top, lon_tick));
                    if (curvedLat) {
                        __lat_top = map.containerPointToLatLng(L.point(tt.x, 0));
                        __lat_top = __lat_top.lat;
                        if (__lat_top > 90) { __lat_top = 90; }
                        tt = map.latLngToContainerPoint(L.latLng(__lat_top, lon_tick));

                        var __lat_bottom = map.containerPointToLatLng(L.point(bb.x, hh));
                        __lat_bottom = __lat_bottom.lat;
                        if (__lat_bottom < -90) { __lat_bottom = -90; }
                        bb = map.latLngToContainerPoint(L.latLng(__lat_bottom, lon_tick));
                    }

                    ctx.beginPath();
                    ctx.moveTo(tt.x, tt.y+1);
                    ctx.lineTo(bb.x, bb.y-1);
                    ctx.stroke();

                    if (self.options.showLabel && label) {
                        ctx.fillText(convertDD2DMS(lngstr, 'lng'), tt.x - (txtWidth/2), txtHeight+1);//SRA
                        //Uncomment to include the bottom graticule labels
                        //ctx.fillText(convertDD2DMS(lngstr, 'lng'), bb.x - (txtWidth/2), hh-3);
                    }
                }
            };

            if (lngInterval > 0) {
                for (var i=lngInterval; i<=_lon_r; i+=lngInterval) {
                    if (i >= _lon_l) {
                        __draw_lon_line(this, i);
                    }
                }
                for (var i=0; i>=_lon_l; i-=lngInterval) {
                    if (i <= _lon_r) {
                        __draw_lon_line(this, i);
                    }
                }
            }
        }
    }

});

L.latlngGraticule = function (options) {
    return new L.LatLngGraticule(options);
};
