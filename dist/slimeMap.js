"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var long_1 = __importStar(require("long"));
var slimeChunk_1 = require("./slimeChunk");
var getV2fromAABB = function (aabb) {
    return {
        p1: { x: aabb.x1, y: aabb.y1 },
        p2: { x: aabb.x2, y: aabb.y2 }
    };
};
var origin = { x: 0, y: 0 };
var SlimeMap = /** @class */ (function () {
    function SlimeMap(id, seed) {
        var _this = this;
        this.height = 0;
        this.width = 0;
        this.xPos = 0;
        this.yPos = 0;
        this.mousePos = __assign({}, origin);
        this.zoom = 2.5;
        this.minzoom = 0.7;
        this.maxzoom = 5;
        this.chunkbuffer = 0; //current implementation does not benefit from chunk buffer.
        this.borderleft = 70;
        this.bordertop = 50;
        this.borderbottom = 20;
        this.borderright = 20;
        this.grabbed = false;
        this.grabbedCoord = __assign({}, origin);
        var canvas = document.getElementById(id);
        if (!canvas) {
            throw (new Error("no canvas"));
        }
        this.canvas = canvas;
        this.canvas.setAttribute("style", "cursor: grab; cursor: -webkit-grab");
        var ctx = this.canvas.getContext("2d");
        this.ctx = ctx ? ctx : new CanvasRenderingContext2D();
        this.assertEventHandlers();
        this.seed = !!seed ? long_1.fromString(seed) : new long_1.default(Date.now());
        this.SCH = new slimeChunk_1.SlimeChunkHandler(this.seed);
        this.update();
        this.drawStaticUI();
        this.vp = this.viewport();
        this.chunkvp = this.chunkviewport();
        this.redraw();
        this.canvas.onmousemove = function (event) {
            _this.mousePos = { x: event.clientX, y: event.clientY };
            if (event.buttons === 1) {
                _this.xPos -= event.movementX;
                _this.yPos -= event.movementY;
                _this.redraw();
            }
            else {
                _this.clearfooter();
                _this.drawFooter();
            }
        };
        this.canvas.onmousedown = function (_event) {
            var vec = _this.getMapCoord(_this.mousePos);
            if (vec) {
                _this.grabbed = true;
                _this.canvas.setAttribute("style", "cursor: grabbing; cursor: -webkit-grabbing");
                _this.grabbedCoord = vec;
            }
        };
        this.canvas.onmouseup = function (_event) {
            _this.canvas.setAttribute("style", "cursor: grab; cursor: -webkit-grab");
            _this.grabbed = false;
        };
    }
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
        if (this.getMapCoord(this.mousePos)) {
            event.preventDefault();
            var zoomfactor = 0.2;
            if (this.zoom < 2) {
                zoomfactor /= 2;
            }
            if (event.wheelDelta < 0) {
                zoomfactor *= -1;
            }
            else if (event.detail < 0) {
                zoomfactor *= -1;
            }
            if ((this.zoom + zoomfactor) >= this.minzoom && (this.zoom + zoomfactor) <= this.maxzoom) {
                this.zoom += zoomfactor;
                this.xPos += ((this.xPos) / this.zoom) * zoomfactor;
                this.yPos += ((this.yPos) / this.zoom) * zoomfactor;
                this.redraw();
            }
        }
    };
    SlimeMap.prototype.chunkviewport = function () {
        return {
            x1: Math.floor(this.vp.x1 / 16) - this.chunkbuffer,
            y1: Math.floor(this.vp.y1 / 16) - this.chunkbuffer,
            x2: Math.ceil(this.vp.x2 / 16) + this.chunkbuffer,
            y2: Math.ceil(this.vp.y2 / 16) + this.chunkbuffer
        };
    };
    SlimeMap.prototype.update = function () {
        this.vp = this.viewport();
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    };
    SlimeMap.prototype.drawFooter = function () {
        var vec = this.getMapCoord(this.mousePos);
        if (vec) {
            this.ctx.font = "15px MyriadPro sans-serif";
            this.ctx.fillStyle = "#000000";
            this.ctx.fillText("X: " + vec.x.toFixed(0) + "\t Z: " + vec.y.toFixed(0), this.borderleft, this.height - this.borderbottom + 15);
            var Chunk = __assign({}, origin);
            Chunk.x = Math.floor(vec.x / 16);
            Chunk.y = Math.floor(vec.y / 16);
            var Slimes = this.SCH.isSlimeChunk(Chunk) ? "ja" : "nein";
            this.ctx.fillText("Slimes: " + Slimes, this.borderleft + 200, this.height - this.borderbottom + 15);
            var From = __assign({}, Chunk);
            From.x *= 16;
            From.y *= 16;
            var To = __assign({}, From);
            To.x += 15;
            To.y += 15;
            this.ctx.textAlign = "end";
            this.ctx.fillText("Chunk: ( " + Chunk.x + " / " + Chunk.y + " )  im Bereich von: ( " +
                From.x + " / " + From.y + ")  bis: ( " +
                To.x + " / " + To.y + " )", this.width - this.borderright, this.height - this.borderbottom + 15);
            this.ctx.textAlign = "start";
        }
    };
    SlimeMap.prototype.clearfooter = function () {
        this.ctx.fillStyle = "#CED4DE";
        this.ctx.fillRect(this.borderleft - 1, this.height - this.borderbottom, this.width - this.borderleft, this.borderbottom);
    };
    SlimeMap.prototype.redraw = function () {
        this.vp = this.viewport();
        //fill map
        this.ctx.fillStyle = "#e0e0e0";
        var vp = this.vp;
        var _a = getV2fromAABB(this.vp), p1 = _a.p1, p2 = _a.p2;
        p1 = this.getAbsCoord(p1, true);
        p2 = this.getAbsCoord(p2, true);
        this.ctx.fillRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
        //UI
        this.updateSlimeVP();
        this.drawSlimeChunks();
        this.drawStaticUI();
        this.drawUI();
        this.drawGrid();
        this.clearBorderRight();
        this.clearfooter();
    };
    SlimeMap.prototype.updateSlimeVP = function () {
        if (JSON.stringify(this.chunkvp) !== JSON.stringify(this.chunkviewport())) {
            this.chunkvp = this.chunkviewport();
        }
    };
    SlimeMap.prototype.drawSlimeChunks = function () {
        this.ctx.fillStyle = "#44dd55";
        for (var x = this.chunkvp.x1; x < this.chunkvp.x2; x++) {
            for (var y = this.chunkvp.y1; y < this.chunkvp.y2; y++) {
                if (this.SCH.isSlimeChunk({ x: x, y: y })) {
                    var vec = { x: x, y: y };
                    vec.x *= 16;
                    vec.y *= 16;
                    var vec2 = this.getAbsCoord(vec);
                    if (vec2) {
                        this.ctx.fillRect(vec2.x + 1, vec2.y + 1, 16 * this.zoom - 2, 16 * this.zoom - 2);
                    }
                    else {
                        //slime chunk may be partially on map
                        vec2 = this.getAbsCoord({ x: vec.x + 16, y: vec.y + 16 });
                        if (vec2) {
                            this.ctx.fillRect(vec2.x - 16 * this.zoom, vec2.y - 16 * this.zoom, 16 * this.zoom - 2, 16 * this.zoom - 2);
                        }
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
        this.ctx.font = "12px MyriadPro";
        this.ctx.fillStyle = "#000000";
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
        this.ctx.fillStyle = "#CED4DE";
        this.ctx.fillRect(0, 0, this.width, this.bordertop);
        this.ctx.fillRect(0, 0, this.borderleft, this.height);
        //Border
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.fillStyle = "#000000";
        this.ctx.strokeStyle = "#000000";
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
        this.ctx.font = "15px MyriadPro sans-serif";
        this.ctx.fillText("N", 10, 40);
        this.ctx.fillText("Seed: " + this.seed.toString(), 40, 20);
        //Axisnames
        //X
        this.ctx.font = "20px MyriadPro";
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
        this.ctx.strokeStyle = "#000000";
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
        this.ctx.fillStyle = "#CED4DE";
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
    SlimeMap.prototype.viewport = function () {
        var v = {};
        var mapWidth = this.width - this.borderleft - this.borderright;
        var mapHeight = this.height - this.bordertop - this.borderbottom;
        v.x1 = Math.ceil((this.xPos - (mapWidth / 2)) / this.zoom);
        v.y1 = Math.ceil((this.yPos - (mapHeight / 2)) / this.zoom);
        v.x2 = Math.floor((this.xPos + (mapWidth / 2)) / this.zoom);
        v.y2 = Math.floor((this.yPos + (mapHeight / 2)) / this.zoom);
        return v;
    };
    return SlimeMap;
}());
function onload() {
    if (document.readyState === "interactive") {
        var sm = new SlimeMap("slimemap-canvas");
    }
}
document.onreadystatechange = onload;
