import * as bigInt from "./BigInteger";
import { SeededRandom } from "./seededRandom";

export class SlimeM {
    private seed: SeededRandom;

    public constructor() {
        this.seed = new SeededRandom();
    }

}

export class SlimeMap {
    private seed: number = 0;
    private height = 0;
    private width = 0;
    private xPos = 0;
    private yPos = 0;
    private mousePos: number[] = new Array(2);
    private zoom = 2.5;
    private minzoom = 0.7;
    private maxzoom = 5;
    private vp: number[];
    private chunkbuffer = 3;
    private chunkvp: number[];
    private slimechunks: any;
    private borderleft = 70;
    private bordertop = 50;
    private borderbottom = 20;
    private borderright = 20;
    private grabbed = false;
    private grabbedCoord = new Array(2);
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D | null = null;

    public constructor(id) {
        this.canvas = document.getElementById(id) as HTMLCanvasElement;
        this.initCanvas(id);
        this.update();
        this.drawStaticUI();
        this.vp = this.viewport();
        this.chunkvp = this.chunkviewport();
        this.initSlimeChunks();
        this.redraw();

        this.canvas.onmousemove = (event) => {
            this.mousePos[0] = event.layerX;
            this.mousePos[1] = event.layerY;
            this.onMouseMove();
        };

        this.canvas.onmousedown = (event) => {
            const vec = this.getMapCoord(this.mousePos);
            if (vec) {
                this.grabbed = true;
                this.canvas.setAttribute("style", "cursor: grabbing; cursor: -webkit-grabbing");
                this.grabbedCoord = vec;
            }
        };

        this.canvas.onmouseup = (event) => {
            this.canvas.setAttribute("style", "cursor: grab; cursor: -webkit-grab");
            this.grabbed = false;
        };
    }

    private initCanvas(id) {
        if (this.canvas.getContext) {
            this.ctx = this.canvas.getContext('2d');
        } else {
            alert("Dein Browser unterstützt diese Funktion noch nicht.\nBitte installiere die neueste Version von deinem Browser.");
        }
        this.assertEventHandlers();
    }

    private assertEventHandlers() {
        const mousewheelevt = (/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll" : "mousewheel"; //FF doesn't recognize mousewheel as of FF3.x
        const evt = (e) => this.onscroll(e);

        if ((this.canvas as any).attachEvent) {//if IE (and Opera depending on user setting)
            (this.canvas as any).attachEvent("on" + mousewheelevt, evt);
        }
        else if (this.canvas.addEventListener) {//WC3 browsers
            this.canvas.addEventListener(mousewheelevt, evt, false);
        }
    }

    private onscroll(event) {
        if (this.getMapCoord(this.mousePos)) {
            event.preventDefault();
            let zoomfactor = 0.2;
            if (this.zoom < 2) {
                zoomfactor /= 2;
            }
            if (event.wheelDelta < 0) {
                zoomfactor *= - 1;
            }
            else if (event.detail < 0) {
                zoomfactor *= - 1;
            }
            if ((this.zoom + zoomfactor) >= this.minzoom && (this.zoom + zoomfactor) <= this.maxzoom) {
                this.zoom += zoomfactor;
                this.redraw();
            }
            this.onMouseMove();
        }
    }

    private chunkviewport() {
        const v = new Array(4);
        v[0] = Math.ceil(this.vp[0] / 16) - this.chunkbuffer;
        v[1] = Math.ceil(this.vp[1] / 16) - this.chunkbuffer;
        v[2] = Math.ceil(this.vp[2] / 16) + this.chunkbuffer;
        v[3] = Math.ceil(this.vp[3] / 16) + this.chunkbuffer;
        return v;
    }

    private isSlimeChunk(vec) {
        const xPos = vec[0];
        const zPos = vec[1];
        let tempseed = new bigInt("4987142").multiply(xPos).multiply(xPos);
        tempseed = tempseed.add(new bigInt("5947611").multiply(xPos));
        tempseed = tempseed.add(new bigInt("4392871").multiply(zPos).multiply(zPos));
        tempseed = tempseed.add(new bigInt("389711").multiply(zPos));
        tempseed = (this.seed as any).add(tempseed);
        tempseed = tempseed.TwosCompXor(new bigInt("987234911"));

        const rnd = new SeededRandom(tempseed.toString());
        return (rnd.nextInt(10) === 0);
        //see http://minecraft-de.gamepedia.com/Schleim?cookieSetup=true#Spawning_in_speziellen_Chunks
    }

    private update() {
        if (!this.ctx) {
            return;
        }
        this.vp = this.viewport();
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }

    private onMouseMove() {
        this.clearfooter();
        const vec = this.getMapCoord(this.mousePos);
        if (vec) {
            if (this.grabbed) {
                this.canvas.setAttribute("style", "cursor: grabbing; cursor: -webkit-grabbing");
                const offsetX = this.grabbedCoord[0] - this.xPos;
                const offsetY = this.grabbedCoord[1] - this.yPos;
                this.xPos = vec[0] - offsetX;
                this.yPos = vec[1] - offsetY;
                this.redraw();
            } else if (this.ctx) {
                this.canvas.setAttribute("style", "cursor: grab; cursor: -webkit-grab");
                this.ctx.font = "15px MyriadPro";
                this.ctx.fillStyle = "#000000";
                this.ctx.fillText("X: " + vec[0].toFixed(1) + "    Z: " + vec[1].toFixed(1), this.borderleft, this.height - this.borderbottom + 15);

                const Chunk = new Array(2);
                Chunk[0] = Math.floor(vec[0] / 16);
                Chunk[1] = Math.floor(vec[1] / 16);
                const Slimes = (this.slimechunks["[" + Chunk[0] + "," + Chunk[1] + "]"]) ? "ja" : "nein";
                this.ctx.fillText("Slimes: " + Slimes, this.borderleft + 200, this.height - this.borderbottom + 15);

                const From = new Array(2);
                From[0] = Chunk[0] * 16;
                From[1] = Chunk[1] * 16;
                const To = new Array(2);
                To[0] = (Chunk[0] + 1) * 16 - 1;
                To[1] = (Chunk[1] + 1) * 16 - 1;

                this.ctx.textAlign = "end";
                this.ctx.fillText("Chunk: ( " + Chunk[0] + " / " + Chunk[1] + " )  im Bereich von: ( " +
                    From[0] + " / " + From[1] + ")  bis: ( " +
                    To[0] + " / " + To[1] + " )", this.width - this.borderright, this.height - this.borderbottom + 15);
                this.ctx.textAlign = "start";
            }
        } else {
            this.canvas.setAttribute("style", "cursor: default");
        }
    }

    private clearfooter() {
        if (this.ctx) {
            this.ctx.fillStyle = "#CED4DE";
            this.ctx.fillRect(this.borderleft, this.height - this.borderbottom, this.width - this.borderleft, this.borderbottom);
        }
    }

    private redraw() {
        this.vp = this.viewport();
        if (!this.ctx) {
            return;
        }

        //fill map
        this.ctx.fillStyle = "#e0e0e0";
        let p1: any = new Array(2);
        let p2: any = new Array(2);
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
    }

    private recalcSlimeChunks() {
        if (JSON.stringify(this.chunkvp) !== JSON.stringify(this.chunkviewport())) {
            const newChunkvp = this.chunkviewport();
            const top = this.chunkvp[1] - newChunkvp[1];
            const bottom = newChunkvp[3] - this.chunkvp[3];
            const left = this.chunkvp[0] - newChunkvp[0];
            const right = newChunkvp[2] - this.chunkvp[2];

            if (top > 0) {
                for (let i = 1; i <= top; i++) {
                    //addRow( chunkvp[1] - i );
                }
            } else {
                for (let i = 0; i > top; i--) {
                    this.removeRow(this.chunkvp[1] - i);
                }
            }

            if (bottom > 0) {
                for (let i = 1; i <= bottom; i++) {
                    //addRow( chunkvp[3] + i );
                }
            } else {
                for (let i = 0; i > bottom; i--) {
                    this.removeRow(this.chunkvp[3] + i);
                }
            }

            if (left > 0) {
                for (let i = 1; i <= left; i++) {
                    //addColumn( chunkvp[0] - i );
                }
            } else {
                for (let i = 0; i > left; i--) {
                    this.removeColumn(this.chunkvp[0] - i);
                }
            }

            if (right > 0) {
                for (let i = 1; i <= right; i++) {
                    //addColumn( chunkvp[2] + i );
                }
            } else {
                for (let i = 0; i > right; i--) {
                    this.removeColumn(this.chunkvp[2] + i);
                }
            }

            this.chunkvp = newChunkvp;
        }
    }

    private addRow(row) {
        const Cols = Math.abs(this.chunkvp[1]) + Math.abs(this.chunkvp[3]);
        for (let i = 0; i < Cols; i++) {
            const mapChunkPos = this.getMapChunkPos(new Array(i, 0));
            const isSC = this.isSlimeChunk(new Array(mapChunkPos[0], row));
            const hash = JSON.stringify(mapChunkPos);
            this.slimechunks[hash] = isSC;
        }
    }

    private removeRow(row) {
        const keys = Object.keys(this.slimechunks);
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (key.indexOf("," + row + "]") !== -1) { delete this.slimechunks[key]; }
        }
    }

    private addColumn(col) {
        const Rows = Math.abs(this.chunkvp[0]) + Math.abs(this.chunkvp[2]);
        for (let i = 0; i < Rows; i++) {
            const mapChunkPos = this.getMapChunkPos(new Array(0, i));
            const isSC = this.isSlimeChunk(new Array(col, mapChunkPos[1]));
            const hash = JSON.stringify(mapChunkPos);
            this.slimechunks[hash] = isSC;
        }
    }

    private removeColumn(col) {
        const keys = Object.keys(this.slimechunks);
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (key.indexOf("[" + col + ",") !== -1) { delete this.slimechunks[key]; }
        }
    }

    private initSlimeChunks() {
        const ChunksCountX = Math.abs(this.chunkvp[0]) + Math.abs(this.chunkvp[2]);
        const ChunksCountZ = Math.abs(this.chunkvp[1]) + Math.abs(this.chunkvp[3]);

        this.slimechunks = new Object({});

        for (let i = 0; i < ChunksCountX; i++) {
            for (let j = 0; j < ChunksCountZ; j++) {
                const mapChunkPos = this.getMapChunkPos(new Array(i, j));
                const isSC = this.isSlimeChunk(mapChunkPos);
                const hash = JSON.stringify(mapChunkPos);

                this.slimechunks[hash] = isSC;
            }
        }
    }

    private getMapChunkPos(vec) {
        vec[0] += this.chunkvp[0];
        vec[1] += this.chunkvp[1];
        return vec;
    }

    private drawSlimeChunks() {
        if (!this.ctx) {
            return;
        }
        this.ctx.fillStyle = "#44dd55";

        const ChunksCountX = Math.abs(this.chunkvp[0]) + Math.abs(this.chunkvp[2]);
        const ChunksCountZ = Math.abs(this.chunkvp[1]) + Math.abs(this.chunkvp[3]);

        for (let i = 0; i < ChunksCountX; i++) {
            for (let j = 0; j < ChunksCountZ; j++) {
                const mapChunkPos = this.getMapChunkPos(new Array(i, j));
                const key = JSON.stringify(mapChunkPos);
                if (this.slimechunks[key] === undefined) { this.slimechunks[key] = this.isSlimeChunk(mapChunkPos); }
                if (this.slimechunks[key]) {
                    const vec = mapChunkPos;
                    vec[0] *= 16;
                    vec[1] *= 16;

                    let vec2 = this.getAbsCoord(vec);
                    if (vec2) {
                        this.ctx.fillRect(vec2[0] + 1, vec2[1] + 1, 16 * this.zoom - 2, 16 * this.zoom - 2);
                    }
                    else {
                        vec2 = this.getAbsCoord(vec, true);
                        let x = vec2[0] + 1;
                        let z = vec2[1] + 1;
                        let width = (16 * this.zoom) - 2;
                        let height = (16 * this.zoom) - 2;
                        let paint = false;

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

                        if (x + width < this.borderleft || z + height < this.bordertop) { paint = false; }

                        if (paint) { this.ctx.fillRect(x, z, width, height); }
                    }

                }
            }
        }
    }

    private drawUI() {
        if (!this.ctx) {
            return;
        }
        this.clearAxes();
        let factor = 16;
        if (this.zoom < 2) { factor *= 2; }
        if (this.zoom < 0.9) { factor *= 2; }
        this.ctx.font = "12px MyriadPro";
        this.ctx.fillStyle = "#000000";
        //X
        for (let i = Math.ceil(this.vp[0] / factor); i <= Math.floor(this.vp[2] / factor); i++) {
            const mark: any = i * factor;
            let pos: any = new Array(mark, this.vp[1]);
            pos = this.getAbsCoord(pos);
            this.ctx.fillText(mark, pos[0] - (mark.toString().length * 3), this.bordertop - 5);
        }
        //Z
        for (let i = Math.ceil(this.vp[1] / factor); i <= Math.floor(this.vp[3] / factor); i++) {
            const mark: any = i * factor;
            let pos: any = new Array(this.vp[0], mark);
            pos = this.getAbsCoord(pos);
            this.ctx.fillText(mark, this.borderleft - 30, pos[1] + 4);
        }
    }

    private drawStaticUI() {
        if (!this.ctx) { return; }
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
        const mapwidthcenter = this.borderleft + ((this.width - this.borderleft - this.borderright) / 2);
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
        const mapheightcenter = this.bordertop + ((this.height - this.bordertop - this.borderbottom) / 2);
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
    }

    private drawAxes() {
        if (!this.ctx) {
            return;
        }
        const factor = 16;
        this.ctx.strokeStyle = "#000000";
        //X
        for (let i = Math.ceil(this.vp[0] / factor); i <= Math.floor(this.vp[2] / factor); i++) {
            // tslint:disable-next-line:prefer-conditional-expression
            if (i === 0) { this.ctx.lineWidth = 0.8; }
            else { this.ctx.lineWidth = 0.5; }
            const mark = i * factor;
            let pos: any = new Array(mark, this.vp[1]);
            pos = this.getAbsCoord(pos);
            this.ctx.beginPath();
            this.ctx.moveTo(pos[0], this.bordertop);
            this.ctx.lineTo(pos[0], this.height - this.borderbottom);
            this.ctx.stroke();
            this.ctx.closePath();
        }
        //Z
        for (let i = Math.ceil(this.vp[1] / factor); i <= Math.floor(this.vp[3] / factor); i++) {
            // tslint:disable-next-line:prefer-conditional-expression
            if (i === 0) { this.ctx.lineWidth = 0.8; }
            else { this.ctx.lineWidth = 0.5; }
            const mark = i * factor;
            let pos: any = new Array(this.vp[0], mark);
            pos = this.getAbsCoord(pos);
            this.ctx.beginPath();
            this.ctx.moveTo(this.borderleft, pos[1]);
            this.ctx.lineTo(this.width - this.borderright, pos[1]);
            this.ctx.stroke();
            this.ctx.closePath();
        }
    }

    private clearAxes() {
        if (!this.ctx) {
            return;
        }
        this.ctx.fillStyle = "#CED4DE";
        this.ctx.fillRect(30, this.bordertop - 22, this.width - 30, 20);
        this.ctx.fillRect(this.borderleft - 32, 40, 30, this.height - 40);
    }

    private clearBorderRight() {
        if (!this.ctx) {
            return;
        }
        this.ctx.fillStyle = "#CED4DE";
        this.ctx.fillRect(this.width - this.borderright, 0, this.borderright, this.height);
    }

    private isInVP(vec) {
        return (vec[0] >= this.vp[0] && vec[0] <= this.vp[2] &&
            vec[1] >= this.vp[1] && vec[1] <= this.vp[3]);
    }

    private isOverMap(vec) {
        return (vec[0] >= this.borderleft && vec[0] <= (this.width - this.borderright) &&
            vec[1] >= this.bordertop && vec[1] <= (this.height - this.borderbottom));
    }

    private getAbsCoord(vec, ignoreBorder?) {
        if (this.isInVP(vec) || ignoreBorder) {
            const vec2 = new Array(2);
            vec2[0] = ((Math.floor(vec[0]) - this.vp[0]) * this.zoom) + this.borderleft;
            vec2[1] = ((Math.floor(vec[1]) - this.vp[1]) * this.zoom) + this.bordertop;
            return vec2;
        } else { return false; }
    }

    private getMapCoord(vec) {
        if (this.isOverMap(vec)) {
            const vec2 = new Array(2);
            vec2[0] = (vec[0] - this.borderleft) / this.zoom;
            vec2[1] = (vec[1] - this.bordertop) / this.zoom;
            vec2[0] += this.vp[0];
            vec2[1] += this.vp[1];
            return vec2;
        } else { return false; }
    }

    private viewport() {
        const v = new Array(4);
        const totalwidth = (this.width - this.borderleft) - this.borderright;
        const totalheight = this.height - this.bordertop - this.borderbottom;
        v[0] = -(Math.ceil((this.xPos + (totalwidth / 2)) / this.zoom));
        v[1] = -(Math.ceil((this.yPos + (totalheight / 2)) / this.zoom));
        v[2] = -(Math.floor((this.xPos - (totalwidth / 2)) / this.zoom));
        v[3] = -(Math.floor((this.yPos - (totalheight / 2)) / this.zoom));
        return v;
    }

}

function onload() {
    if (document.readyState === "interactive") {
        const sm = new SlimeMap("slimemap-canvas");
    }
}

document.onreadystatechange = onload;
