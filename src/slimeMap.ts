import Long, { fromString } from "long";
import { isSlimeChunk } from "./slimeChunk";

export interface Vector2D {
    x: number;
    y: number;
    [index: number]: never;
}

export interface AABB {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

const origin: Vector2D = { x: 0, y: 0 };

class SlimeMap {
    private seed: Long;
    private height = 0;
    private width = 0;
    private xPos = 0;
    private yPos = 0;
    private mousePos: Vector2D = { ...origin };
    private zoom = 2.5;
    private minzoom = 0.7;
    private maxzoom = 5;
    private vp: AABB;
    private chunkbuffer = 3;
    private chunkvp: AABB;
    private slimechunks: {
        [key: string]: boolean;
    } = {};
    private borderleft = 70;
    private bordertop = 50;
    private borderbottom = 20;
    private borderright = 20;
    private grabbed = false;
    private grabbedCoord: Vector2D = { ...origin };
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D | null = null;

    public constructor(id: string, seed?: string) {
        this.canvas = document.getElementById(id) as HTMLCanvasElement;
        this.seed = !!seed ? fromString(seed) : new Long(Date.now());
        this.initCanvas(id);
        this.update();
        this.drawStaticUI();
        this.vp = this.viewport();
        this.chunkvp = this.chunkviewport();
        this.initSlimeChunks();
        this.redraw();

        this.canvas.onmousemove = (event: MouseEvent) => {
            this.mousePos = { x: event.layerX, y: event.layerY };
            this.onMouseMove();
        };

        this.canvas.onmousedown = (_event: MouseEvent) => {
            const vec = this.getMapCoord(this.mousePos);
            if (vec) {
                this.grabbed = true;
                this.canvas.setAttribute("style", "cursor: grabbing; cursor: -webkit-grabbing");
                this.grabbedCoord = vec;
            }
        };

        this.canvas.onmouseup = (_event: MouseEvent) => {
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

    private onscroll(event: WheelEvent) {
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

    private chunkviewport(): AABB {
        const v: Partial<AABB> = {};
        v.x1 = Math.ceil(this.vp.x1 / 16) - this.chunkbuffer;
        v.y1 = Math.ceil(this.vp.y1 / 16) - this.chunkbuffer;
        v.x2 = Math.ceil(this.vp.x2 / 16) + this.chunkbuffer;
        v.y2 = Math.ceil(this.vp.y2 / 16) + this.chunkbuffer;
        return v as AABB;
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
                const offsetX = this.grabbedCoord.x - this.xPos;
                const offsetY = this.grabbedCoord.y - this.yPos;
                this.xPos = vec.x - offsetX;
                this.yPos = vec.y - offsetY;
                this.redraw();
            } else if (this.ctx) {
                this.canvas.setAttribute("style", "cursor: grab; cursor: -webkit-grab");
                this.ctx.font = "15px MyriadPro";
                this.ctx.fillStyle = "#000000";
                this.ctx.fillText("X: " + vec.x.toFixed(1) + "    Z: " + vec.y.toFixed(1), this.borderleft, this.height - this.borderbottom + 15);

                const Chunk = { ...origin };
                Chunk.x = Math.floor(vec.x / 16);
                Chunk.y = Math.floor(vec.y / 16);
                const Slimes = (this.slimechunks["[" + Chunk.x + "," + Chunk.y + "]"]) ? "ja" : "nein";
                this.ctx.fillText("Slimes: " + Slimes, this.borderleft + 200, this.height - this.borderbottom + 15);

                const From = { ...origin };
                From.x = Chunk.x * 16;
                From.y = Chunk.y * 16;
                const To = { ...origin };
                To.x = (Chunk.x + 1) * 16 - 1;
                To.y = (Chunk.y + 1) * 16 - 1;

                this.ctx.textAlign = "end";
                this.ctx.fillText("Chunk: ( " + Chunk.x + " / " + Chunk.y + " )  im Bereich von: ( " +
                    From.x + " / " + From.y + ")  bis: ( " +
                    To.x + " / " + To.y + " )", this.width - this.borderright, this.height - this.borderbottom + 15);
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
        let p1: Vector2D = { ...origin };
        let p2: Vector2D = { ...origin };
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
    }

    private recalcSlimeChunks() {
        if (JSON.stringify(this.chunkvp) !== JSON.stringify(this.chunkviewport())) {
            const newChunkvp = this.chunkviewport();
            const top = this.chunkvp.y1 - newChunkvp.y1;
            const bottom = newChunkvp.y2 - this.chunkvp.y2;
            const left = this.chunkvp.x1 - newChunkvp.x1;
            const right = newChunkvp.x2 - this.chunkvp.x2;

            if (top > 0) {
                for (let i = 1; i <= top; i++) {
                    //addRow( chunkvp.y1 - i );
                }
            } else {
                for (let i = 0; i > top; i--) {
                    this.removeRow(this.chunkvp.y1 - i);
                }
            }

            if (bottom > 0) {
                for (let i = 1; i <= bottom; i++) {
                    //addRow( chunkvp.y2 + i );
                }
            } else {
                for (let i = 0; i > bottom; i--) {
                    this.removeRow(this.chunkvp.y2 + i);
                }
            }

            if (left > 0) {
                for (let i = 1; i <= left; i++) {
                    //addColumn( chunkvp.x1 - i );
                }
            } else {
                for (let i = 0; i > left; i--) {
                    this.removeColumn(this.chunkvp.x1 - i);
                }
            }

            if (right > 0) {
                for (let i = 1; i <= right; i++) {
                    //addColumn( chunkvp.x2 + i );
                }
            } else {
                for (let i = 0; i > right; i--) {
                    this.removeColumn(this.chunkvp.x2 + i);
                }
            }

            this.chunkvp = newChunkvp;
        }
    }

    private addRow(row: number) {
        const Cols = Math.abs(this.chunkvp.y1) + Math.abs(this.chunkvp.y2);
        for (let i = 0; i < Cols; i++) {
            const mapChunkPos = this.getMapChunkPos({ x: i, y: 0 });
            const isSC = isSlimeChunk({ x: mapChunkPos.x, y: row }, this.seed);
            const hash = JSON.stringify(mapChunkPos);
            this.slimechunks[hash] = isSC;
        }
    }

    private removeRow(row: number) {
        const keys = Object.keys(this.slimechunks);
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (key.indexOf("," + row + "]") !== -1) { delete this.slimechunks[key]; }
        }
    }

    private addColumn(col: number) {
        const Rows = Math.abs(this.chunkvp.x1) + Math.abs(this.chunkvp.x2);
        for (let i = 0; i < Rows; i++) {
            const mapChunkPos = this.getMapChunkPos({ x: 0, y: i });
            const isSC = isSlimeChunk({ x: col, y: mapChunkPos.y }, this.seed);
            const hash = JSON.stringify(mapChunkPos);
            this.slimechunks[hash] = isSC;
        }
    }

    private removeColumn(col: number) {
        const keys = Object.keys(this.slimechunks);
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (key.indexOf("[" + col + ",") !== -1) { delete this.slimechunks[key]; }
        }
    }

    private initSlimeChunks() {
        const ChunksCountX = Math.abs(this.chunkvp.x1) + Math.abs(this.chunkvp.x2);
        const ChunksCountZ = Math.abs(this.chunkvp.y1) + Math.abs(this.chunkvp.y2);

        this.slimechunks = {};

        for (let i = 0; i < ChunksCountX; i++) {
            for (let j = 0; j < ChunksCountZ; j++) {
                const mapChunkPos = this.getMapChunkPos({ x: i, y: j });
                const isSC = isSlimeChunk({ x: mapChunkPos.x, y: mapChunkPos.y }, this.seed);
                const key = JSON.stringify(mapChunkPos);

                this.slimechunks[key] = isSC;
            }
        }
    }

    private getMapChunkPos(vec: Vector2D): Vector2D {
        return {
            x: vec.x += this.chunkvp.x1,
            y: vec.y += this.chunkvp.y1
        };
    }

    private drawSlimeChunks() {
        if (!this.ctx) {
            return;
        }
        this.ctx.fillStyle = "#44dd55";

        const ChunksCountX = Math.abs(this.chunkvp.x1) + Math.abs(this.chunkvp.x2);
        const ChunksCountZ = Math.abs(this.chunkvp.y1) + Math.abs(this.chunkvp.y2);

        for (let i = 0; i < ChunksCountX; i++) {
            for (let j = 0; j < ChunksCountZ; j++) {
                const mapChunkPos = this.getMapChunkPos({ x: i, y: j });
                const key = JSON.stringify(mapChunkPos);
                if (this.slimechunks[key] === undefined) { this.slimechunks[key] = isSlimeChunk({ x: mapChunkPos.x, y: mapChunkPos.y }, this.seed); }
                if (this.slimechunks[key]) {
                    const vec = mapChunkPos;
                    vec.x *= 16;
                    vec.y *= 16;

                    let vec2 = this.getAbsCoord(vec);
                    if (vec2) {
                        this.ctx.fillRect(vec2.x + 1, vec2.y + 1, 16 * this.zoom - 2, 16 * this.zoom - 2);
                    }
                    else {
                        vec2 = this.getAbsCoord(vec, true);
                        let x = vec2.x + 1;
                        let z = vec2.y + 1;
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
        for (let i = Math.ceil(this.vp.x1 / factor); i <= Math.floor(this.vp.x2 / factor); i++) {
            const mark = i * factor;
            let pos: Vector2D = { x: mark, y: this.vp.y1 };
            pos = this.getAbsCoord(pos, true);
            this.ctx.fillText(mark + "", pos.x - (mark.toString().length * 3), this.bordertop - 5);
        }
        //Z
        for (let i = Math.ceil(this.vp.y1 / factor); i <= Math.floor(this.vp.y2 / factor); i++) {
            const mark = i * factor;
            let pos: Vector2D = { x: this.vp.x1, y: mark };
            pos = this.getAbsCoord(pos, true);
            this.ctx.fillText(mark + "", this.borderleft - 30, pos.y + 4);
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
        for (let i = Math.ceil(this.vp.x1 / factor); i <= Math.floor(this.vp.x2 / factor); i++) {
            // tslint:disable-next-line:prefer-conditional-expression
            if (i === 0) { this.ctx.lineWidth = 0.8; }
            else { this.ctx.lineWidth = 0.5; }
            const mark = i * factor;
            let pos: Vector2D = { x: mark, y: this.vp.y1 };
            pos = this.getAbsCoord(pos, true);
            this.ctx.beginPath();
            this.ctx.moveTo(pos.x, this.bordertop);
            this.ctx.lineTo(pos.x, this.height - this.borderbottom);
            this.ctx.stroke();
            this.ctx.closePath();
        }
        //Z
        for (let i = Math.ceil(this.vp.y1 / factor); i <= Math.floor(this.vp.y2 / factor); i++) {
            // tslint:disable-next-line:prefer-conditional-expression
            if (i === 0) { this.ctx.lineWidth = 0.8; }
            else { this.ctx.lineWidth = 0.5; }
            const mark = i * factor;
            let pos: Vector2D = { x: this.vp.x1, y: mark };
            pos = this.getAbsCoord(pos, true);
            this.ctx.beginPath();
            this.ctx.moveTo(this.borderleft, pos.y);
            this.ctx.lineTo(this.width - this.borderright, pos.y);
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

    private isInVP(vec: Vector2D): boolean {
        return (vec.x >= this.vp.x1 && vec.x <= this.vp.x2 &&
            vec.y >= this.vp.y1 && vec.y <= this.vp.y2);
    }

    private isOverMap(vec: Vector2D): boolean {
        return (
            vec.x >= this.borderleft && vec.x <= (this.width - this.borderright) &&
            vec.y >= this.bordertop && vec.y <= (this.height - this.borderbottom));
    }

    private getAbsCoord(vec: Vector2D): false | Vector2D;
    private getAbsCoord(vec: Vector2D, ignoreBorder: true): Vector2D;
    private getAbsCoord(vec: Vector2D, ignoreBorder: boolean = false): false | Vector2D {
        if (this.isInVP(vec) || ignoreBorder) {
            const vec2 = { ...origin };
            vec2.x = ((Math.floor(vec.x) - this.vp.x1) * this.zoom) + this.borderleft;
            vec2.y = ((Math.floor(vec.y) - this.vp.y1) * this.zoom) + this.bordertop;
            return vec2;
        }
        return false;
    }

    private getMapCoord(vec: Vector2D): false | Vector2D {
        if (this.isOverMap(vec)) {
            const vec2: Vector2D = { ...origin };
            vec2.x = Math.round((vec.x - this.borderleft) / this.zoom);
            vec2.y = Math.round((vec.y - this.bordertop) / this.zoom);
            vec2.x += this.vp.x1;
            vec2.y += this.vp.y1;
            return vec2;
        }
        return false;
    }

    private viewport(): AABB {
        const v: Partial<AABB> = {};
        const totalwidth = (this.width - this.borderleft) - this.borderright;
        const totalheight = this.height - this.bordertop - this.borderbottom;
        v.x1 = -(Math.ceil((this.xPos + (totalwidth / 2)) / this.zoom));
        v.y1 = -(Math.ceil((this.yPos + (totalheight / 2)) / this.zoom));
        v.x2 = -(Math.floor((this.xPos - (totalwidth / 2)) / this.zoom));
        v.y2 = -(Math.floor((this.yPos - (totalheight / 2)) / this.zoom));
        return v as AABB;
    }

}

function onload() {
    if (document.readyState === "interactive") {
        const sm = new SlimeMap("slimemap-canvas");
    }
}

document.onreadystatechange = onload;
