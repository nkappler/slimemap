import Long, { fromString } from "long";
import { SlimeChunkHandler } from "./slimeChunk";

export interface Vector2D {
    x: number;
    y: number;
}

export interface AABB {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

const getV2fromAABB = (aabb: AABB): { p1: Vector2D, p2: Vector2D } => {
    return {
        p1: { x: aabb.x1, y: aabb.y1 },
        p2: { x: aabb.x2, y: aabb.y2 }
    };
};

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
    private chunkbuffer = 0; //current implementation does not benefit from chunk buffer.
    private chunkvp: AABB;
    private borderleft = 70;
    private bordertop = 50;
    private borderbottom = 20;
    private borderright = 20;
    private grabbed = false;
    private grabbedCoord: Vector2D = { ...origin };
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private SCH: SlimeChunkHandler;

    public constructor(id: string, seed?: string) {
        const canvas = document.getElementById(id);
        if (!canvas) {
            throw (new Error("no canvas"));
        }
        this.canvas = canvas as HTMLCanvasElement;
        this.canvas.setAttribute("style", "cursor: grab; cursor: -webkit-grab");
        const ctx = this.canvas.getContext("2d");
        this.ctx = ctx ? ctx : new CanvasRenderingContext2D();
        this.assertEventHandlers();

        this.seed = !!seed ? fromString(seed) : new Long(Date.now());
        this.SCH = new SlimeChunkHandler(this.seed);
        this.update();
        this.drawStaticUI();
        this.vp = this.viewport();
        this.chunkvp = this.chunkviewport();
        this.redraw();

        this.canvas.onmousemove = (event: MouseEvent) => {
            this.mousePos = { x: event.clientX, y: event.clientY };
            if (event.buttons === 1) {
                this.xPos -= event.movementX;
                this.yPos -= event.movementY;
                this.redraw();
            } else {
                this.clearfooter();
                this.drawFooter();
            }
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
                this.xPos += ((this.xPos) / this.zoom) * zoomfactor;
                this.yPos += ((this.yPos) / this.zoom) * zoomfactor;
                this.redraw();
            }
        }
    }

    private chunkviewport(): AABB {
        return {
            x1: Math.floor(this.vp.x1 / 16) - this.chunkbuffer,
            y1: Math.floor(this.vp.y1 / 16) - this.chunkbuffer,
            x2: Math.ceil(this.vp.x2 / 16) + this.chunkbuffer,
            y2: Math.ceil(this.vp.y2 / 16) + this.chunkbuffer
        };
    }

    private update() {
        this.vp = this.viewport();
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }

    private drawFooter() {
        const vec = this.getMapCoord(this.mousePos);
        if (vec) {
            this.ctx.font = "15px MyriadPro sans-serif";
            this.ctx.fillStyle = "#000000";
            this.ctx.fillText("X: " + vec.x.toFixed(0) + "\t Z: " + vec.y.toFixed(0), this.borderleft, this.height - this.borderbottom + 15);

            const Chunk = { ...origin };
            Chunk.x = Math.floor(vec.x / 16);
            Chunk.y = Math.floor(vec.y / 16);
            const Slimes = this.SCH.isSlimeChunk(Chunk) ? "ja" : "nein";
            this.ctx.fillText("Slimes: " + Slimes, this.borderleft + 200, this.height - this.borderbottom + 15);

            const From = { ...Chunk };
            From.x *= 16;
            From.y *= 16;
            const To = { ...From };
            To.x += 15;
            To.y += 15;

            this.ctx.textAlign = "end";
            this.ctx.fillText("Chunk: ( " + Chunk.x + " / " + Chunk.y + " )  im Bereich von: ( " +
                From.x + " / " + From.y + ")  bis: ( " +
                To.x + " / " + To.y + " )", this.width - this.borderright, this.height - this.borderbottom + 15);
            this.ctx.textAlign = "start";
        }
    }

    private clearfooter() {
        this.ctx.fillStyle = "#CED4DE";
        this.ctx.fillRect(this.borderleft - 1, this.height - this.borderbottom, this.width - this.borderleft, this.borderbottom);
    }

    private redraw() {
        this.vp = this.viewport();

        //fill map
        this.ctx.fillStyle = "#e0e0e0";
        const vp = this.vp;
        let { p1, p2 } = getV2fromAABB(this.vp);
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
    }

    private updateSlimeVP() {
        if (JSON.stringify(this.chunkvp) !== JSON.stringify(this.chunkviewport())) {
            this.chunkvp = this.chunkviewport();
        }
    }

    private drawSlimeChunks() {
        this.ctx.fillStyle = "#44dd55";

        for (let x = this.chunkvp.x1; x < this.chunkvp.x2; x++) {
            for (let y = this.chunkvp.y1; y < this.chunkvp.y2; y++) {
                if (this.SCH.isSlimeChunk({ x, y })) {
                    const vec = { x, y };
                    vec.x *= 16;
                    vec.y *= 16;

                    let vec2 = this.getAbsCoord(vec);
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
    }

    private drawUI() {
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

    private drawGrid() {
        const factor = 16;
        this.ctx.strokeStyle = "#000000";
        //X
        for (let i = Math.ceil(this.vp.x1 / factor); i <= Math.floor(this.vp.x2 / factor); i++) {
            this.ctx.lineWidth = (i === 0) ? 0.8 : 0.5;
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
            this.ctx.lineWidth = (i === 0) ? 0.8 : 0.5;
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

    private clearBorderRight() {
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
        const mapWidth = this.width - this.borderleft - this.borderright;
        const mapHeight = this.height - this.bordertop - this.borderbottom;
        v.x1 = Math.ceil((this.xPos - (mapWidth / 2)) / this.zoom);
        v.y1 = Math.ceil((this.yPos - (mapHeight / 2)) / this.zoom);
        v.x2 = Math.floor((this.xPos + (mapWidth / 2)) / this.zoom);
        v.y2 = Math.floor((this.yPos + (mapHeight / 2)) / this.zoom);
        return v as AABB;
    }

}

function onload() {
    if (document.readyState === "interactive") {
        const sm = new SlimeMap("slimemap-canvas");
    }
}

document.onreadystatechange = onload;
