"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var big_integer_1 = __importDefault(require("../node_modules/big-integer"));
var seededRandom_1 = require("./seededRandom");
var SlimeMap = /** @class */ (function () {
    function SlimeMap(id) {
        var _this = this;
        this.seed = big_integer_1.default(1234);
        this.height = 0;
        this.width = 0;
        this.xPos = 0;
        this.yPos = 0;
        this.mousePos = new Array(2);
        this.zoom = 2.5;
        this.minzoom = 0.7;
        this.maxzoom = 5;
        this.chunkbuffer = 3;
        this.borderleft = 70;
        this.bordertop = 50;
        this.borderbottom = 20;
        this.borderright = 20;
        this.grabbed = false;
        this.grabbedCoord = new Array(2);
        this.ctx = null;
        this.canvas = document.getElementById(id);
        this.initCanvas(id);
        this.update();
        this.drawStaticUI();
        this.vp = this.viewport();
        this.chunkvp = this.chunkviewport();
        this.initSlimeChunks();
        this.redraw();
        this.canvas.onmousemove = function (event) {
            _this.mousePos[0] = event.layerX;
            _this.mousePos[1] = event.layerY;
            _this.onMouseMove();
        };
        this.canvas.onmousedown = function (event) {
            var vec = _this.getMapCoord(_this.mousePos);
            if (vec) {
                _this.grabbed = true;
                _this.canvas.setAttribute("style", "cursor: grabbing; cursor: -webkit-grabbing");
                _this.grabbedCoord = vec;
            }
        };
        this.canvas.onmouseup = function (event) {
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
        var v = new Array(4);
        v[0] = Math.ceil(this.vp[0] / 16) - this.chunkbuffer;
        v[1] = Math.ceil(this.vp[1] / 16) - this.chunkbuffer;
        v[2] = Math.ceil(this.vp[2] / 16) + this.chunkbuffer;
        v[3] = Math.ceil(this.vp[3] / 16) + this.chunkbuffer;
        return v;
    };
    SlimeMap.prototype.isSlimeChunk = function (vec) {
        var xPos = vec[0];
        var zPos = vec[1];
        var tempseed = big_integer_1.default("4987142").multiply(xPos).multiply(xPos);
        tempseed = tempseed.add(big_integer_1.default("5947611").multiply(xPos));
        tempseed = tempseed.add(big_integer_1.default("4392871").multiply(zPos).multiply(zPos));
        tempseed = tempseed.add(big_integer_1.default("389711").multiply(zPos));
        tempseed = this.seed.add(tempseed);
        tempseed = tempseed.xor(big_integer_1.default("987234911"));
        var rnd = new seededRandom_1.SeededRandom(tempseed.toString());
        return (rnd.nextInt(10) === 0);
        //see http://minecraft-de.gamepedia.com/Schleim?cookieSetup=true#Spawning_in_speziellen_Chunks
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
                var offsetX = this.grabbedCoord[0] - this.xPos;
                var offsetY = this.grabbedCoord[1] - this.yPos;
                this.xPos = vec[0] - offsetX;
                this.yPos = vec[1] - offsetY;
                this.redraw();
            }
            else if (this.ctx) {
                this.canvas.setAttribute("style", "cursor: grab; cursor: -webkit-grab");
                this.ctx.font = "15px MyriadPro";
                this.ctx.fillStyle = "#000000";
                this.ctx.fillText("X: " + vec[0].toFixed(1) + "    Z: " + vec[1].toFixed(1), this.borderleft, this.height - this.borderbottom + 15);
                var Chunk = new Array(2);
                Chunk[0] = Math.floor(vec[0] / 16);
                Chunk[1] = Math.floor(vec[1] / 16);
                var Slimes = (this.slimechunks["[" + Chunk[0] + "," + Chunk[1] + "]"]) ? "ja" : "nein";
                this.ctx.fillText("Slimes: " + Slimes, this.borderleft + 200, this.height - this.borderbottom + 15);
                var From = new Array(2);
                From[0] = Chunk[0] * 16;
                From[1] = Chunk[1] * 16;
                var To = new Array(2);
                To[0] = (Chunk[0] + 1) * 16 - 1;
                To[1] = (Chunk[1] + 1) * 16 - 1;
                this.ctx.textAlign = "end";
                this.ctx.fillText("Chunk: ( " + Chunk[0] + " / " + Chunk[1] + " )  im Bereich von: ( " +
                    From[0] + " / " + From[1] + ")  bis: ( " +
                    To[0] + " / " + To[1] + " )", this.width - this.borderright, this.height - this.borderbottom + 15);
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
        var p1 = new Array(2);
        var p2 = new Array(2);
        p1[0] = this.vp[0];
        p1[1] = this.vp[1];
        p2[0] = this.vp[2];
        p2[1] = this.vp[3];
        p1 = this.getAbsCoord(p1);
        p2 = this.getAbsCoord(p2);
        this.ctx.fillRect(p1[0], p1[1], p2[0] - p1[0], p2[1] - p1[1]);
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
            var top_1 = this.chunkvp[1] - newChunkvp[1];
            var bottom = newChunkvp[3] - this.chunkvp[3];
            var left = this.chunkvp[0] - newChunkvp[0];
            var right = newChunkvp[2] - this.chunkvp[2];
            if (top_1 > 0) {
                for (var i = 1; i <= top_1; i++) {
                    //addRow( chunkvp[1] - i );
                }
            }
            else {
                for (var i = 0; i > top_1; i--) {
                    this.removeRow(this.chunkvp[1] - i);
                }
            }
            if (bottom > 0) {
                for (var i = 1; i <= bottom; i++) {
                    //addRow( chunkvp[3] + i );
                }
            }
            else {
                for (var i = 0; i > bottom; i--) {
                    this.removeRow(this.chunkvp[3] + i);
                }
            }
            if (left > 0) {
                for (var i = 1; i <= left; i++) {
                    //addColumn( chunkvp[0] - i );
                }
            }
            else {
                for (var i = 0; i > left; i--) {
                    this.removeColumn(this.chunkvp[0] - i);
                }
            }
            if (right > 0) {
                for (var i = 1; i <= right; i++) {
                    //addColumn( chunkvp[2] + i );
                }
            }
            else {
                for (var i = 0; i > right; i--) {
                    this.removeColumn(this.chunkvp[2] + i);
                }
            }
            this.chunkvp = newChunkvp;
        }
    };
    SlimeMap.prototype.addRow = function (row) {
        var Cols = Math.abs(this.chunkvp[1]) + Math.abs(this.chunkvp[3]);
        for (var i = 0; i < Cols; i++) {
            var mapChunkPos = this.getMapChunkPos(new Array(i, 0));
            var isSC = this.isSlimeChunk(new Array(mapChunkPos[0], row));
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
        var Rows = Math.abs(this.chunkvp[0]) + Math.abs(this.chunkvp[2]);
        for (var i = 0; i < Rows; i++) {
            var mapChunkPos = this.getMapChunkPos(new Array(0, i));
            var isSC = this.isSlimeChunk(new Array(col, mapChunkPos[1]));
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
        var ChunksCountX = Math.abs(this.chunkvp[0]) + Math.abs(this.chunkvp[2]);
        var ChunksCountZ = Math.abs(this.chunkvp[1]) + Math.abs(this.chunkvp[3]);
        this.slimechunks = new Object({});
        for (var i = 0; i < ChunksCountX; i++) {
            for (var j = 0; j < ChunksCountZ; j++) {
                var mapChunkPos = this.getMapChunkPos(new Array(i, j));
                var isSC = this.isSlimeChunk(mapChunkPos);
                var hash = JSON.stringify(mapChunkPos);
                this.slimechunks[hash] = isSC;
            }
        }
    };
    SlimeMap.prototype.getMapChunkPos = function (vec) {
        vec[0] += this.chunkvp[0];
        vec[1] += this.chunkvp[1];
        return vec;
    };
    SlimeMap.prototype.drawSlimeChunks = function () {
        if (!this.ctx) {
            return;
        }
        this.ctx.fillStyle = "#44dd55";
        var ChunksCountX = Math.abs(this.chunkvp[0]) + Math.abs(this.chunkvp[2]);
        var ChunksCountZ = Math.abs(this.chunkvp[1]) + Math.abs(this.chunkvp[3]);
        for (var i = 0; i < ChunksCountX; i++) {
            for (var j = 0; j < ChunksCountZ; j++) {
                var mapChunkPos = this.getMapChunkPos(new Array(i, j));
                var key = JSON.stringify(mapChunkPos);
                if (this.slimechunks[key] === undefined) {
                    this.slimechunks[key] = this.isSlimeChunk(mapChunkPos);
                }
                if (this.slimechunks[key]) {
                    var vec = mapChunkPos;
                    vec[0] *= 16;
                    vec[1] *= 16;
                    var vec2 = this.getAbsCoord(vec);
                    if (vec2) {
                        this.ctx.fillRect(vec2[0] + 1, vec2[1] + 1, 16 * this.zoom - 2, 16 * this.zoom - 2);
                    }
                    else {
                        vec2 = this.getAbsCoord(vec, true);
                        var x = vec2[0] + 1;
                        var z = vec2[1] + 1;
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
        for (var i = Math.ceil(this.vp[0] / factor); i <= Math.floor(this.vp[2] / factor); i++) {
            var mark = i * factor;
            var pos = new Array(mark, this.vp[1]);
            pos = this.getAbsCoord(pos);
            this.ctx.fillText(mark, pos[0] - (mark.toString().length * 3), this.bordertop - 5);
        }
        //Z
        for (var i = Math.ceil(this.vp[1] / factor); i <= Math.floor(this.vp[3] / factor); i++) {
            var mark = i * factor;
            var pos = new Array(this.vp[0], mark);
            pos = this.getAbsCoord(pos);
            this.ctx.fillText(mark, this.borderleft - 30, pos[1] + 4);
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
        for (var i = Math.ceil(this.vp[0] / factor); i <= Math.floor(this.vp[2] / factor); i++) {
            // tslint:disable-next-line:prefer-conditional-expression
            if (i === 0) {
                this.ctx.lineWidth = 0.8;
            }
            else {
                this.ctx.lineWidth = 0.5;
            }
            var mark = i * factor;
            var pos = new Array(mark, this.vp[1]);
            pos = this.getAbsCoord(pos);
            this.ctx.beginPath();
            this.ctx.moveTo(pos[0], this.bordertop);
            this.ctx.lineTo(pos[0], this.height - this.borderbottom);
            this.ctx.stroke();
            this.ctx.closePath();
        }
        //Z
        for (var i = Math.ceil(this.vp[1] / factor); i <= Math.floor(this.vp[3] / factor); i++) {
            // tslint:disable-next-line:prefer-conditional-expression
            if (i === 0) {
                this.ctx.lineWidth = 0.8;
            }
            else {
                this.ctx.lineWidth = 0.5;
            }
            var mark = i * factor;
            var pos = new Array(this.vp[0], mark);
            pos = this.getAbsCoord(pos);
            this.ctx.beginPath();
            this.ctx.moveTo(this.borderleft, pos[1]);
            this.ctx.lineTo(this.width - this.borderright, pos[1]);
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
        return (vec[0] >= this.vp[0] && vec[0] <= this.vp[2] &&
            vec[1] >= this.vp[1] && vec[1] <= this.vp[3]);
    };
    SlimeMap.prototype.isOverMap = function (vec) {
        return (vec[0] >= this.borderleft && vec[0] <= (this.width - this.borderright) &&
            vec[1] >= this.bordertop && vec[1] <= (this.height - this.borderbottom));
    };
    SlimeMap.prototype.getAbsCoord = function (vec, ignoreBorder) {
        if (this.isInVP(vec) || ignoreBorder) {
            var vec2 = new Array(2);
            vec2[0] = ((Math.floor(vec[0]) - this.vp[0]) * this.zoom) + this.borderleft;
            vec2[1] = ((Math.floor(vec[1]) - this.vp[1]) * this.zoom) + this.bordertop;
            return vec2;
        }
        else {
            return false;
        }
    };
    SlimeMap.prototype.getMapCoord = function (vec) {
        if (this.isOverMap(vec)) {
            var vec2 = new Array(2);
            vec2[0] = (vec[0] - this.borderleft) / this.zoom;
            vec2[1] = (vec[1] - this.bordertop) / this.zoom;
            vec2[0] += this.vp[0];
            vec2[1] += this.vp[1];
            return vec2;
        }
        else {
            return false;
        }
    };
    SlimeMap.prototype.viewport = function () {
        var v = new Array(4);
        var totalwidth = (this.width - this.borderleft) - this.borderright;
        var totalheight = this.height - this.bordertop - this.borderbottom;
        v[0] = -(Math.ceil((this.xPos + (totalwidth / 2)) / this.zoom));
        v[1] = -(Math.ceil((this.yPos + (totalheight / 2)) / this.zoom));
        v[2] = -(Math.floor((this.xPos - (totalwidth / 2)) / this.zoom));
        v[3] = -(Math.floor((this.yPos - (totalheight / 2)) / this.zoom));
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
