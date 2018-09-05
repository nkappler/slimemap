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
        this.chunkbuffer = 3;
        this.slimechunks = {};
        this.borderleft = 70;
        this.bordertop = 50;
        this.borderbottom = 20;
        this.borderright = 20;
        this.grabbed = false;
        this.grabbedCoord = __assign({}, origin);
        this.ctx = null;
        this.canvas = document.getElementById(id);
        this.seed = !!seed ? long_1.fromString(seed) : new long_1.default(Date.now());
        this.initCanvas(id);
        this.update();
        this.drawStaticUI();
        this.vp = this.viewport();
        this.chunkvp = this.chunkviewport();
        this.initSlimeChunks();
        this.redraw();
        this.canvas.onmousemove = function (event) {
            _this.mousePos = { x: event.layerX, y: event.layerY };
            _this.onMouseMove();
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
    SlimeMap.prototype.initCanvas = function (id) {
        if (this.canvas.getContext) {
            this.ctx = this.canvas.getContext('2d');
        }
        else {
            alert("Dein Browser unterstützt diese Funktion noch nicht.\nBitte installiere die neueste Version von deinem Browser.");
        }
        this.assertEventHandlers();
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
                this.redraw();
            }
            this.onMouseMove();
        }
    };
    SlimeMap.prototype.chunkviewport = function () {
        var v = {};
        v.x1 = Math.ceil(this.vp.x1 / 16) - this.chunkbuffer;
        v.y1 = Math.ceil(this.vp.y1 / 16) - this.chunkbuffer;
        v.x2 = Math.ceil(this.vp.x2 / 16) + this.chunkbuffer;
        v.y2 = Math.ceil(this.vp.y2 / 16) + this.chunkbuffer;
        return v;
    };
    SlimeMap.prototype.update = function () {
        if (!this.ctx) {
            return;
        }
        this.vp = this.viewport();
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    };
    SlimeMap.prototype.onMouseMove = function () {
        this.clearfooter();
        var vec = this.getMapCoord(this.mousePos);
        if (vec) {
            if (this.grabbed) {
                this.canvas.setAttribute("style", "cursor: grabbing; cursor: -webkit-grabbing");
                var offsetX = this.grabbedCoord.x - this.xPos;
                var offsetY = this.grabbedCoord.y - this.yPos;
                this.xPos = vec.x - offsetX;
                this.yPos = vec.y - offsetY;
                this.redraw();
            }
            else if (this.ctx) {
                this.canvas.setAttribute("style", "cursor: grab; cursor: -webkit-grab");
                this.ctx.font = "15px MyriadPro";
                this.ctx.fillStyle = "#000000";
                this.ctx.fillText("X: " + vec.x.toFixed(1) + "    Z: " + vec.y.toFixed(1), this.borderleft, this.height - this.borderbottom + 15);
                var Chunk = __assign({}, origin);
                Chunk.x = Math.floor(vec.x / 16);
                Chunk.y = Math.floor(vec.y / 16);
                var Slimes = (this.slimechunks["[" + Chunk.x + "," + Chunk.y + "]"]) ? "ja" : "nein";
                this.ctx.fillText("Slimes: " + Slimes, this.borderleft + 200, this.height - this.borderbottom + 15);
                var From = __assign({}, origin);
                From.x = Chunk.x * 16;
                From.y = Chunk.y * 16;
                var To = __assign({}, origin);
                To.x = (Chunk.x + 1) * 16 - 1;
                To.y = (Chunk.y + 1) * 16 - 1;
                this.ctx.textAlign = "end";
                this.ctx.fillText("Chunk: ( " + Chunk.x + " / " + Chunk.y + " )  im Bereich von: ( " +
                    From.x + " / " + From.y + ")  bis: ( " +
                    To.x + " / " + To.y + " )", this.width - this.borderright, this.height - this.borderbottom + 15);
                this.ctx.textAlign = "start";
            }
        }
        else {
            this.canvas.setAttribute("style", "cursor: default");
        }
    };
    SlimeMap.prototype.clearfooter = function () {
        if (this.ctx) {
            this.ctx.fillStyle = "#CED4DE";
            this.ctx.fillRect(this.borderleft, this.height - this.borderbottom, this.width - this.borderleft, this.borderbottom);
        }
    };
    SlimeMap.prototype.redraw = function () {
        this.vp = this.viewport();
        if (!this.ctx) {
            return;
        }
        //fill map
        this.ctx.fillStyle = "#e0e0e0";
        var p1 = __assign({}, origin);
        var p2 = __assign({}, origin);
        p1.x = this.vp.x1;
        p1.y = this.vp.y1;
        p2.x = this.vp.x2;
        p2.y = this.vp.y2;
        p1 = this.getAbsCoord(p1, true);
        p2 = this.getAbsCoord(p2, true);
        this.ctx.fillRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
        //UI
        this.drawUI();
        this.drawAxes();
        this.drawSlimeChunks();
        this.clearBorderRight();
        this.clearfooter();
        this.recalcSlimeChunks();
    };
    SlimeMap.prototype.recalcSlimeChunks = function () {
        if (JSON.stringify(this.chunkvp) !== JSON.stringify(this.chunkviewport())) {
            var newChunkvp = this.chunkviewport();
            var top_1 = this.chunkvp.y1 - newChunkvp.y1;
            var bottom = newChunkvp.y2 - this.chunkvp.y2;
            var left = this.chunkvp.x1 - newChunkvp.x1;
            var right = newChunkvp.x2 - this.chunkvp.x2;
            if (top_1 > 0) {
                for (var i = 1; i <= top_1; i++) {
                    //addRow( chunkvp.y1 - i );
                }
            }
            else {
                for (var i = 0; i > top_1; i--) {
                    this.removeRow(this.chunkvp.y1 - i);
                }
            }
            if (bottom > 0) {
                for (var i = 1; i <= bottom; i++) {
                    //addRow( chunkvp.y2 + i );
                }
            }
            else {
                for (var i = 0; i > bottom; i--) {
                    this.removeRow(this.chunkvp.y2 + i);
                }
            }
            if (left > 0) {
                for (var i = 1; i <= left; i++) {
                    //addColumn( chunkvp.x1 - i );
                }
            }
            else {
                for (var i = 0; i > left; i--) {
                    this.removeColumn(this.chunkvp.x1 - i);
                }
            }
            if (right > 0) {
                for (var i = 1; i <= right; i++) {
                    //addColumn( chunkvp.x2 + i );
                }
            }
            else {
                for (var i = 0; i > right; i--) {
                    this.removeColumn(this.chunkvp.x2 + i);
                }
            }
            this.chunkvp = newChunkvp;
        }
    };
    SlimeMap.prototype.addRow = function (row) {
        var Cols = Math.abs(this.chunkvp.y1) + Math.abs(this.chunkvp.y2);
        for (var i = 0; i < Cols; i++) {
            var mapChunkPos = this.getMapChunkPos({ x: i, y: 0 });
            var isSC = slimeChunk_1.isSlimeChunk({ x: mapChunkPos.x, y: row }, this.seed);
            var hash = JSON.stringify(mapChunkPos);
            this.slimechunks[hash] = isSC;
        }
    };
    SlimeMap.prototype.removeRow = function (row) {
        var keys = Object.keys(this.slimechunks);
        // tslint:disable-next-line:prefer-for-of
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (key.indexOf("," + row + "]") !== -1) {
                delete this.slimechunks[key];
            }
        }
    };
    SlimeMap.prototype.addColumn = function (col) {
        var Rows = Math.abs(this.chunkvp.x1) + Math.abs(this.chunkvp.x2);
        for (var i = 0; i < Rows; i++) {
            var mapChunkPos = this.getMapChunkPos({ x: 0, y: i });
            var isSC = slimeChunk_1.isSlimeChunk({ x: col, y: mapChunkPos.y }, this.seed);
            var hash = JSON.stringify(mapChunkPos);
            this.slimechunks[hash] = isSC;
        }
    };
    SlimeMap.prototype.removeColumn = function (col) {
        var keys = Object.keys(this.slimechunks);
        // tslint:disable-next-line:prefer-for-of
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (key.indexOf("[" + col + ",") !== -1) {
                delete this.slimechunks[key];
            }
        }
    };
    SlimeMap.prototype.initSlimeChunks = function () {
        var ChunksCountX = Math.abs(this.chunkvp.x1) + Math.abs(this.chunkvp.x2);
        var ChunksCountZ = Math.abs(this.chunkvp.y1) + Math.abs(this.chunkvp.y2);
        this.slimechunks = {};
        for (var i = 0; i < ChunksCountX; i++) {
            for (var j = 0; j < ChunksCountZ; j++) {
                var mapChunkPos = this.getMapChunkPos({ x: i, y: j });
                var isSC = slimeChunk_1.isSlimeChunk({ x: mapChunkPos.x, y: mapChunkPos.y }, this.seed);
                var key = JSON.stringify(mapChunkPos);
                this.slimechunks[key] = isSC;
            }
        }
    };
    SlimeMap.prototype.getMapChunkPos = function (vec) {
        return {
            x: vec.x += this.chunkvp.x1,
            y: vec.y += this.chunkvp.y1
        };
    };
    SlimeMap.prototype.drawSlimeChunks = function () {
        if (!this.ctx) {
            return;
        }
        this.ctx.fillStyle = "#44dd55";
        var ChunksCountX = Math.abs(this.chunkvp.x1) + Math.abs(this.chunkvp.x2);
        var ChunksCountZ = Math.abs(this.chunkvp.y1) + Math.abs(this.chunkvp.y2);
        for (var i = 0; i < ChunksCountX; i++) {
            for (var j = 0; j < ChunksCountZ; j++) {
                var mapChunkPos = this.getMapChunkPos({ x: i, y: j });
                var key = JSON.stringify(mapChunkPos);
                if (this.slimechunks[key] === undefined) {
                    this.slimechunks[key] = slimeChunk_1.isSlimeChunk({ x: mapChunkPos.x, y: mapChunkPos.y }, this.seed);
                }
                if (this.slimechunks[key]) {
                    var vec = mapChunkPos;
                    vec.x *= 16;
                    vec.y *= 16;
                    var vec2 = this.getAbsCoord(vec);
                    if (vec2) {
                        this.ctx.fillRect(vec2.x + 1, vec2.y + 1, 16 * this.zoom - 2, 16 * this.zoom - 2);
                    }
                    else {
                        vec2 = this.getAbsCoord(vec, true);
                        var x = vec2.x + 1;
                        var z = vec2.y + 1;
                        var width = (16 * this.zoom) - 2;
                        var height = (16 * this.zoom) - 2;
                        var paint = false;
                        if (x < this.borderleft && x + width >= this.borderleft) {
                            width += x - this.borderleft;
                            x = this.borderleft;
                            paint = true;
                        }
                        if (z < this.bordertop && z + height >= this.bordertop) {
                            height += z - this.bordertop;
                            z = this.bordertop;
                            paint = true;
                        }
                        if (x + width < this.borderleft || z + height < this.bordertop) {
                            paint = false;
                        }
                        if (paint) {
                            this.ctx.fillRect(x, z, width, height);
                        }
                    }
                }
            }
        }
    };
    SlimeMap.prototype.drawUI = function () {
        if (!this.ctx) {
            return;
        }
        this.clearAxes();
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
        if (!this.ctx) {
            return;
        }
        //clear;
        this.ctx.fillStyle = "#CED4DE";
        this.ctx.fillRect(0, 0, this.width, this.height);
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
        this.ctx.moveTo(15, 5);
        this.ctx.lineTo(5, 30);
        this.ctx.lineTo(15, 20);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(15, 20);
        this.ctx.lineTo(25, 30);
        this.ctx.lineTo(15, 5);
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.closePath();
        this.ctx.font = "15px MyriadPro";
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
    SlimeMap.prototype.drawAxes = function () {
        if (!this.ctx) {
            return;
        }
        var factor = 16;
        this.ctx.strokeStyle = "#000000";
        //X
        for (var i = Math.ceil(this.vp.x1 / factor); i <= Math.floor(this.vp.x2 / factor); i++) {
            // tslint:disable-next-line:prefer-conditional-expression
            if (i === 0) {
                this.ctx.lineWidth = 0.8;
            }
            else {
                this.ctx.lineWidth = 0.5;
            }
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
            // tslint:disable-next-line:prefer-conditional-expression
            if (i === 0) {
                this.ctx.lineWidth = 0.8;
            }
            else {
                this.ctx.lineWidth = 0.5;
            }
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
    SlimeMap.prototype.clearAxes = function () {
        if (!this.ctx) {
            return;
        }
        this.ctx.fillStyle = "#CED4DE";
        this.ctx.fillRect(30, this.bordertop - 22, this.width - 30, 20);
        this.ctx.fillRect(this.borderleft - 32, 40, 30, this.height - 40);
    };
    SlimeMap.prototype.clearBorderRight = function () {
        if (!this.ctx) {
            return;
        }
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
        var totalwidth = (this.width - this.borderleft) - this.borderright;
        var totalheight = this.height - this.bordertop - this.borderbottom;
        v.x1 = -(Math.ceil((this.xPos + (totalwidth / 2)) / this.zoom));
        v.y1 = -(Math.ceil((this.yPos + (totalheight / 2)) / this.zoom));
        v.x2 = -(Math.floor((this.xPos - (totalwidth / 2)) / this.zoom));
        v.y2 = -(Math.floor((this.yPos - (totalheight / 2)) / this.zoom));
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
