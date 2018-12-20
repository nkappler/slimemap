"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var long_1 = __importDefault(require("long"));
var slimeChunk_1 = require("./slimeChunk");
var getV2sfromAABB = function (aabb) {
    return {
        p1: { x: aabb.x1, y: aabb.y1 },
        p2: { x: aabb.x2, y: aabb.y2 }
    };
};
var getAABBfromV2s = function (p1, p2) {
    return {
        x1: p1.x,
        y1: p1.y,
        x2: p2.x,
        y2: p2.y
    };
};
var origin = { x: 0, y: 0 };
var SlimeMap = /** @class */ (function () {
    function SlimeMap(id, config) {
        var _this = this;
        /** canvas height */
        this.height = 0;
        /** canvas width */
        this.width = 0;
        /** x position on the map. (viewer/camera position) */
        this.xPos = 0;
        /** y position on the map. (viewer/camera position) */
        this.yPos = 0;
        /** the cursor Position (canvas coordinate system) */
        this.mousePos = __assign({}, origin);
        /** zoom factor. higher means larger area visible */
        this.zoom = 2.5;
        this.minzoom = 0.7;
        this.maxzoom = 5;
        /** the border on the left side between canvas and map edge. */
        this.borderleft = 70;
        /** the border on the top side between canvas and map edge. */
        this.bordertop = 50;
        /** the border on the bottom side between canvas and map edge. */
        this.borderbottom = 20;
        /** the border on the left bottom between canvas and map edge. */
        this.borderright = 20;
        this.markers = [];
        this.controls = undefined;
        this.config = __assign({ strokeColor: "#000000", textColor: "#000000", mapBackgroundColor: "#e0e0e0", uiBackgroundColor: "#CED4DE", slimeChunkColor: "#44dd55", markerDefaultColor: "#aa0000" }, config);
        this.canvas = this.createDOM(id);
        this.canvas.setAttribute("style", "cursor: grab; cursor: -webkit-grab");
        var ctx = this.canvas.getContext("2d");
        this.ctx = ctx ? ctx : new CanvasRenderingContext2D();
        this.assertEventHandlers();
        this.seed = !!this.config.seed ? long_1.fromString(this.config.seed) : new long_1.default(Date.now());
        this.SCH = new slimeChunk_1.SlimeChunkHandler(this.seed);
        this.updateSizes();
        // this.drawStaticUI();
        this.redraw();
        this.canvas.onmousemove = function (event) {
            _this.mousePos = { x: event.offsetX, y: event.offsetY };
            if (event.buttons === 1) {
                _this.xPos -= event.movementX / _this.zoom;
                _this.yPos -= event.movementY / _this.zoom;
                _this.redraw();
            }
            else {
                _this.drawFooter();
            }
        };
        this.canvas.onmousedown = function (_event) {
            var vec = _this.getMapCoord(_this.mousePos);
            if (vec) {
                _this.canvas.setAttribute("style", "cursor: grabbing; cursor: -webkit-grabbing");
            }
        };
        this.canvas.onmouseup = function (_event) {
            _this.canvas.setAttribute("style", "cursor: grab; cursor: -webkit-grab");
        };
    }
    SlimeMap.prototype.setSeed = function (seed) {
        this.seed = long_1.fromString(seed);
        this.SCH = new slimeChunk_1.SlimeChunkHandler(this.seed);
        this.redraw();
    };
    SlimeMap.prototype.gotoCoordinate = function (param1, y) {
        var coordinate = this.isVector2D(param1) ? param1 : { x: param1, y: y };
        this.xPos = coordinate.x;
        this.yPos = coordinate.y;
        this.redraw();
    };
    SlimeMap.prototype.addMarker = function (marker) {
        this.markers.push(marker);
    };
    SlimeMap.prototype.deleteAllMarkers = function () {
        this.markers = [];
    };
    SlimeMap.prototype.drawAllMarkers = function () {
        for (var _i = 0, _a = this.markers; _i < _a.length; _i++) {
            var marker = _a[_i];
            this.ctx.strokeStyle = this.config.strokeColor;
            this.ctx.fillStyle = marker.color || this.config.markerDefaultColor;
            this.ctx.lineWidth = 1;
            var coord = this.getAbsCoord(marker.location, true);
            var x = coord.x, y = coord.y;
            var size = 32;
            var height = size;
            var width = 2 * height / 3;
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.bezierCurveTo(x - width / 8, y - width / 16 * 9, x - width / 2, y - width / 16 * 9, x - width / 2, y - width);
            this.ctx.arcTo(x - width / 2, y - height, x, y - height, width / 2);
            this.ctx.arcTo(x + width / 2, y - height, x + width / 2, y - width, width / 2);
            this.ctx.bezierCurveTo(x + width / 2, y - width / 16 * 9, x + width / 8, y - width / 16 * 9, x, y);
            this.ctx.fill();
            this.ctx.stroke();
            this.ctx.fill();
            this.ctx.stroke();
            this.ctx.closePath();
            if (marker.label) {
                this.ctx.font = "normal 15px 'Montserrat'";
                this.ctx.textAlign = "center";
                var textWidth = this.ctx.measureText(marker.label).width;
                this.ctx.fillStyle = "rgba(206,212,222,0.7)";
                this.ctx.fillRect(x - textWidth / 2 - 3, y - size - 30, textWidth + 6, 21);
                this.ctx.fillStyle = this.config.textColor;
                this.ctx.fillText(marker.label, x, y - size - 15);
                this.ctx.textAlign = "left";
            }
        }
    };
    SlimeMap.prototype.loadFont = function () {
        var _this = this;
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = 'https://fonts.googleapis.com/css?family=Montserrat:300,400';
        document.head.appendChild(link);
        //rerender a few times for the first few seconds,
        var i = setInterval(function () {
            _this.drawStaticUI();
            _this.drawUI();
        }, 100);
        setTimeout(function () { return clearInterval(i); }, 2000);
    };
    SlimeMap.prototype.createDOM = function (id) {
        this.loadFont();
        var parent = document.getElementById(id);
        if (!parent) {
            throw (new Error("Element not found."));
        }
        var canvas = document.createElement("canvas");
        var container;
        if (parent.tagName === "CANVAS") {
            container = document.createElement("div");
            // tslint:disable-next-line:prefer-for-of
            for (var i = 0; i < parent.attributes.length; i++) {
                var attr = parent.attributes[i];
                if (attr.name === "width" || attr.name === "height") {
                    container.style[attr.name] = attr.value;
                }
                container.setAttribute(attr.name, attr.value);
            }
            container.appendChild(canvas);
            var pparent = parent.parentNode || document.body;
            pparent.replaceChild(container, parent);
        }
        else {
            container = parent;
            container.appendChild(canvas);
        }
        container.style.position = "relative";
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
        if (this.config.renderControls) {
            var height = this.renderControls(container, this.config.bottom);
            this.borderbottom += this.config.bottom ? height : 0;
            this.bordertop += this.config.bottom ? 0 : height;
        }
        return canvas;
    };
    SlimeMap.prototype.renderControls = function (container, bottom) {
        var _this = this;
        if (bottom === void 0) { bottom = false; }
        var controlsdDiv = document.createElement("div");
        var height = "28px";
        Object.assign(controlsdDiv.style, {
            display: "flex",
            width: "100%",
            justifyContent: "space-between",
            position: "absolute",
            bottom: bottom ? "0px" : "auto",
            top: bottom ? "auto" : height,
            paddingRight: this.borderright + "px",
            paddingLeft: this.borderleft + "px",
            boxSizing: "border-box",
            height: height,
            lineHeight: height
        });
        var seedDiv = document.createElement("div");
        var seedInput = document.createElement("input");
        seedInput.type = "text";
        seedInput.placeholder = "enter seed";
        var seedButton = document.createElement("button");
        seedButton.innerText = "Find Slimes";
        seedButton.addEventListener("click", function () {
            _this.setSeed(seedInput.value);
            seedInput.value = "";
        });
        seedDiv.appendChild(seedInput);
        seedDiv.appendChild(seedButton);
        var navDiv = document.createElement("div");
        var xInput = document.createElement("input");
        xInput.type = "text";
        xInput.placeholder = "X";
        xInput.style.width = "100px";
        var zInput = document.createElement("input");
        zInput.type = "text";
        zInput.placeholder = "Z";
        zInput.style.width = "100px";
        var navButton = document.createElement("button");
        navButton.innerText = "go to coordinates";
        navButton.addEventListener("click", function () {
            var coordinate = { x: Number(xInput.value), y: Number(zInput.value) };
            _this.deleteAllMarkers();
            _this.addMarker({ location: coordinate, label: "( X: " + coordinate.x + " / Z: " + coordinate.y + " )" });
            _this.gotoCoordinate(coordinate);
            xInput.value = "";
            zInput.value = "";
        });
        navDiv.appendChild(xInput);
        navDiv.appendChild(zInput);
        navDiv.appendChild(navButton);
        controlsdDiv.appendChild(seedDiv);
        controlsdDiv.appendChild(navDiv);
        container.appendChild(controlsdDiv);
        this.controls = {
            seedInput: seedInput,
            xInput: xInput,
            zInput: zInput
        };
        return controlsdDiv.offsetHeight;
    };
    SlimeMap.prototype.assertEventHandlers = function () {
        var _this = this;
        var mousewheelevt = (/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll" : "mousewheel"; //FF doesn't recognize mousewheel as of FF3.x
        var evt = function (e) { return _this.onscroll(e); };
        if (this.canvas.attachEvent) { //if IE (and Opera depending on user setting)
            this.canvas.attachEvent("on" + mousewheelevt, evt);
        }
        else if (this.canvas.addEventListener) { //WC3 browsers
            this.canvas.addEventListener(mousewheelevt, evt, false);
        }
    };
    SlimeMap.prototype.onscroll = function (event) {
        var pos = this.getMapCoord(this.mousePos);
        if (pos) {
            event.preventDefault();
            var zoomfactor = 0.2;
            if (this.zoom < 2) {
                zoomfactor /= 2;
            }
            var direction = event.wheelDelta > 0 ? 1 : -1;
            zoomfactor *= direction;
            if ((this.zoom + zoomfactor) >= this.minzoom && (this.zoom + zoomfactor) <= this.maxzoom) {
                // zoom should be based on cursor position, i.e. the map position under the cursor should not change
                // during scroll. this means we can calc the offset of the positions before and after scrolling and apply
                // it to the position.
                this.zoom += zoomfactor;
                this.updateSizes();
                var newPos = this.getMapCoord(this.mousePos);
                var offset = {
                    x: pos.x - newPos.x,
                    y: pos.y - newPos.y
                };
                this.xPos += offset.x;
                this.yPos += offset.y;
                this.redraw();
            }
        }
    };
    /**
     * calculates the visible map area in chunk representation.
     * Result is slightly oversized to account for partially visible chunks.
     */
    SlimeMap.prototype.calcChunkVP = function () {
        var v2s = getV2sfromAABB(this.vp);
        return getAABBfromV2s(this.doMath(v2s.p1, function (c) { return Math.floor(c / 16); }), this.doMath(v2s.p2, function (c) { return Math.ceil(c / 16); }));
    };
    SlimeMap.prototype.updateSizes = function () {
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.vp = this.calcViewport();
        this.chunkvp = this.calcChunkVP();
    };
    SlimeMap.prototype.drawFooter = function () {
        var vec = this.getMapCoord(this.mousePos);
        if (vec) {
            this.clearfooter();
            this.ctx.font = "normal 15px 'Montserrat'";
            this.ctx.fillStyle = this.config.textColor;
            this.ctx.fillText("X: " + vec.x.toFixed(0) + "\t Z: " + vec.y.toFixed(0), this.borderleft, this.height - this.borderbottom + 15);
            var Chunk = this.doMath(vec, function (c) { return Math.floor(c / 16); });
            var Slimes = this.SCH.isSlimeChunk(Chunk) ? "ja" : "nein";
            this.ctx.fillText("Slimes: " + Slimes, this.borderleft + 200, this.height - this.borderbottom + 15);
            var From = this.ChunkToCoord(Chunk);
            var To = this.doMath(From, function (c) { return c + 15; });
            this.ctx.textAlign = "end";
            this.ctx.fillText("Chunk: ( " + Chunk.x + " / " + Chunk.y + " )  im Bereich von: ( " +
                From.x + " / " + From.y + ")  bis: ( " +
                To.x + " / " + To.y + " )", this.width - this.borderright, this.height - this.borderbottom + 15);
            this.ctx.textAlign = "start";
        }
    };
    SlimeMap.prototype.clearfooter = function () {
        this.ctx.fillStyle = this.config.uiBackgroundColor;
        this.ctx.fillRect(this.borderleft - 1, this.height - this.borderbottom, this.width - this.borderleft, this.borderbottom);
    };
    SlimeMap.prototype.redraw = function () {
        this.vp = this.calcViewport();
        //fill map
        this.ctx.fillStyle = this.config.mapBackgroundColor;
        this.ctx.fillRect(this.borderleft, this.bordertop, this.width - this.borderleft - this.borderright, this.height - this.bordertop - this.borderbottom);
        //UI
        this.updateSlimeVP();
        this.drawSlimeChunks();
        this.drawGrid();
        this.drawAllMarkers();
        this.clearBorderRight();
        this.clearfooter();
        this.drawStaticUI();
        this.drawUI();
    };
    SlimeMap.prototype.updateSlimeVP = function () {
        if (JSON.stringify(this.chunkvp) !== JSON.stringify(this.calcChunkVP())) {
            this.chunkvp = this.calcChunkVP();
        }
    };
    SlimeMap.prototype.drawSlimeChunks = function () {
        this.ctx.fillStyle = this.config.slimeChunkColor;
        for (var x = this.chunkvp.x1; x < this.chunkvp.x2; x++) {
            for (var y = this.chunkvp.y1; y < this.chunkvp.y2; y++) {
                if (this.SCH.isSlimeChunk({ x: x, y: y })) {
                    var vec = this.ChunkToCoord({ x: x, y: y });
                    var vec2 = this.getAbsCoord(vec);
                    if (vec2) {
                        this.ctx.fillRect(vec2.x + 1, vec2.y + 1, 16 * this.zoom - 1, 16 * this.zoom - 1);
                        continue;
                    }
                    //slime chunk may be partially on map (overlap in x direction)
                    vec2 = this.getAbsCoord({ x: vec.x + 16, y: vec.y });
                    if (vec2) {
                        this.ctx.fillRect(vec2.x - 16 * this.zoom, vec2.y, 16 * this.zoom - 1, 16 * this.zoom - 1);
                        continue;
                    }
                    //slime chunk may be partially on map (overlap in y direction)
                    vec2 = this.getAbsCoord({ x: vec.x, y: vec.y + 16 });
                    if (vec2) {
                        this.ctx.fillRect(vec2.x, vec2.y - 16 * this.zoom, 16 * this.zoom - 1, 16 * this.zoom - 1);
                        continue;
                    }
                    //slime chunk may be partially on map (overlap in both directions)
                    vec2 = this.getAbsCoord({ x: vec.x + 16, y: vec.y + 16 });
                    if (vec2) {
                        this.ctx.fillRect(vec2.x - 16 * this.zoom, vec2.y - 16 * this.zoom, 16 * this.zoom - 1, 16 * this.zoom - 1);
                        continue;
                    }
                }
            }
        }
    };
    SlimeMap.prototype.drawUI = function () {
        var factor = 16;
        if (this.zoom < 2) {
            factor *= 2;
        }
        if (this.zoom < 0.9) {
            factor *= 2;
        }
        this.ctx.font = "normal 12px 'Montserrat'";
        this.ctx.fillStyle = this.config.textColor;
        //X
        for (var i = Math.ceil(this.vp.x1 / factor); i <= Math.floor(this.vp.x2 / factor); i++) {
            var mark = i * factor;
            var pos = { x: mark, y: this.vp.y1 };
            pos = this.getAbsCoord(pos, true);
            this.ctx.fillText(mark + "", pos.x - (mark.toString().length * 3), this.bordertop - 5);
        }
        //Z
        for (var i = Math.ceil(this.vp.y1 / factor); i <= Math.floor(this.vp.y2 / factor); i++) {
            var mark = i * factor;
            var pos = { x: this.vp.x1, y: mark };
            pos = this.getAbsCoord(pos, true);
            this.ctx.fillText(mark + "", this.borderleft - 30, pos.y + 4);
        }
    };
    SlimeMap.prototype.drawStaticUI = function () {
        //clear;
        this.ctx.font = "normal 12px 'Montserrat'";
        this.ctx.fillStyle = this.config.uiBackgroundColor;
        this.ctx.fillRect(0, 0, this.width, this.bordertop);
        this.ctx.fillRect(0, 0, this.borderleft, this.height);
        //Border
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.fillStyle = this.config.strokeColor;
        this.ctx.strokeStyle = this.config.strokeColor;
        this.ctx.moveTo(this.width - this.borderright, this.bordertop - 1);
        this.ctx.lineTo(this.borderleft - 1, this.bordertop - 1);
        this.ctx.lineTo(this.borderleft - 1, this.height - this.borderbottom);
        this.ctx.stroke();
        this.ctx.closePath();
        this.ctx.strokeStyle = "#333333";
        this.ctx.fillStyle = "#333333";
        //North
        this.ctx.lineWidth = 0.7;
        this.ctx.beginPath();
        this.ctx.moveTo(15, 5);
        this.ctx.lineTo(5, 30);
        this.ctx.lineTo(15, 20);
        this.ctx.stroke();
        this.ctx.closePath();
        this.ctx.beginPath();
        this.ctx.moveTo(15, 20);
        this.ctx.lineTo(25, 30);
        this.ctx.lineTo(15, 5);
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.closePath();
        this.ctx.fillText("N", 10, 40);
        this.ctx.font = "normal 15px 'Montserrat'";
        this.ctx.fillText("Seed: " + this.seed.toString(), this.borderleft, 20);
        //Axisnames
        //X
        this.ctx.font = "normal 20px 'Montserrat'";
        var mapwidthcenter = this.borderleft + ((this.width - this.borderleft - this.borderright) / 2);
        this.ctx.fillText("X", mapwidthcenter - 10, 20);
        this.ctx.lineWidth = 0.4;
        this.ctx.beginPath();
        this.ctx.moveTo(mapwidthcenter + 5, 13);
        this.ctx.lineTo(mapwidthcenter + 17, 13);
        this.ctx.lineTo(mapwidthcenter + 14, 10);
        this.ctx.stroke();
        this.ctx.moveTo(mapwidthcenter + 17, 13);
        this.ctx.lineTo(mapwidthcenter + 14, 16);
        this.ctx.stroke();
        this.ctx.closePath();
        //Z
        var mapheightcenter = this.bordertop + ((this.height - this.bordertop - this.borderbottom) / 2);
        this.ctx.fillText("Z", 7.5, mapheightcenter - 5);
        this.ctx.lineWidth = 0.4;
        this.ctx.beginPath();
        this.ctx.moveTo(13, mapheightcenter);
        this.ctx.lineTo(13, mapheightcenter + 12);
        this.ctx.lineTo(10, mapheightcenter + 9);
        this.ctx.stroke();
        this.ctx.moveTo(13, mapheightcenter + 12);
        this.ctx.lineTo(16, mapheightcenter + 9);
        this.ctx.stroke();
        this.ctx.closePath();
    };
    SlimeMap.prototype.drawGrid = function () {
        var factor = 16;
        this.ctx.strokeStyle = this.config.strokeColor;
        //X
        for (var i = Math.ceil(this.vp.x1 / factor); i <= Math.floor(this.vp.x2 / factor); i++) {
            this.ctx.lineWidth = (i === 0) ? 0.8 : 0.5;
            var mark = i * factor;
            var pos = { x: mark, y: this.vp.y1 };
            pos = this.getAbsCoord(pos, true);
            this.ctx.beginPath();
            this.ctx.moveTo(pos.x, this.bordertop);
            this.ctx.lineTo(pos.x, this.height - this.borderbottom);
            this.ctx.stroke();
            this.ctx.closePath();
        }
        //Z
        for (var i = Math.ceil(this.vp.y1 / factor); i <= Math.floor(this.vp.y2 / factor); i++) {
            this.ctx.lineWidth = (i === 0) ? 0.8 : 0.5;
            var mark = i * factor;
            var pos = { x: this.vp.x1, y: mark };
            pos = this.getAbsCoord(pos, true);
            this.ctx.beginPath();
            this.ctx.moveTo(this.borderleft, pos.y);
            this.ctx.lineTo(this.width - this.borderright, pos.y);
            this.ctx.stroke();
            this.ctx.closePath();
        }
    };
    SlimeMap.prototype.clearBorderRight = function () {
        this.ctx.fillStyle = this.config.uiBackgroundColor;
        this.ctx.fillRect(this.width - this.borderright, 0, this.borderright, this.height);
    };
    SlimeMap.prototype.isInVP = function (vec) {
        return (vec.x >= this.vp.x1 && vec.x <= this.vp.x2 &&
            vec.y >= this.vp.y1 && vec.y <= this.vp.y2);
    };
    SlimeMap.prototype.isOverMap = function (vec) {
        return (vec.x >= this.borderleft && vec.x <= (this.width - this.borderright) &&
            vec.y >= this.bordertop && vec.y <= (this.height - this.borderbottom));
    };
    SlimeMap.prototype.getAbsCoord = function (vec, ignoreBorder) {
        if (ignoreBorder === void 0) { ignoreBorder = false; }
        if (this.isInVP(vec) || ignoreBorder) {
            var vec2 = __assign({}, origin);
            vec2.x = ((Math.floor(vec.x) - this.vp.x1) * this.zoom) + this.borderleft;
            vec2.y = ((Math.floor(vec.y) - this.vp.y1) * this.zoom) + this.bordertop;
            return vec2;
        }
        return false;
    };
    SlimeMap.prototype.getMapCoord = function (vec) {
        if (this.isOverMap(vec)) {
            var vec2 = __assign({}, origin);
            vec2.x = Math.round((vec.x - this.borderleft) / this.zoom);
            vec2.y = Math.round((vec.y - this.bordertop) / this.zoom);
            vec2.x += this.vp.x1;
            vec2.y += this.vp.y1;
            return vec2;
        }
        return false;
    };
    SlimeMap.prototype.calcViewport = function () {
        var v = {};
        var mapWidth = this.width - this.borderleft - this.borderright;
        var mapHeight = this.height - this.bordertop - this.borderbottom;
        mapWidth /= this.zoom;
        mapHeight /= this.zoom;
        v.x1 = Math.floor((this.xPos - (mapWidth / 2)));
        v.y1 = Math.floor((this.yPos - (mapHeight / 2)));
        v.x2 = Math.ceil((this.xPos + (mapWidth / 2)));
        v.y2 = Math.ceil((this.yPos + (mapHeight / 2)));
        return v;
    };
    SlimeMap.prototype.doMath = function (arg, f) {
        if (this.isVector2D(arg)) {
            return {
                x: this.doMath(arg.x, f),
                y: this.doMath(arg.y, f)
            };
        }
        else if (this.isAABB(arg)) {
            var v2s = getV2sfromAABB(arg);
            return getAABBfromV2s(this.doMath(v2s.p1, f), this.doMath(v2s.p2, f));
        }
        return f(arg);
    };
    SlimeMap.prototype.ChunkToCoord = function (arg) {
        return this.doMath(arg, function (x) { return x * 16; });
    };
    SlimeMap.prototype.isVector2D = function (vec) {
        if (typeof vec !== "object") {
            return false;
        }
        var keys = Object.keys(vec);
        return keys.length === 2 && typeof vec.x === "number" && typeof vec.y === "number";
    };
    SlimeMap.prototype.isAABB = function (vec) {
        if (typeof vec !== "object") {
            return false;
        }
        var keys = Object.keys(vec);
        return keys.length === 4 && typeof vec.x1 === "number" && typeof vec.y1 === "number" && typeof vec.x2 === "number" && typeof vec.y2 === "number";
    };
    return SlimeMap;
}());
exports.SlimeMap = SlimeMap;
window.SlimeMap = SlimeMap;
