import Long, { fromString } from "long";
import { addMarker, attachContextMenu, deleteMarker, drawAllMarkers, Marker } from "./marker";
import { SlimeChunkHandler } from "./slimeChunk";

export interface Vector2D {
    x: number;
    z: number;
}

export interface AABB {
    x1: number;
    z1: number;
    x2: number;
    z2: number;
}

const getV2sfromAABB = (aabb: AABB): { p1: Vector2D, p2: Vector2D } => {
    return {
        p1: { x: aabb.x1, z: aabb.z1 },
        p2: { x: aabb.x2, z: aabb.z2 }
    };
};

const getAABBfromV2s = (p1: Vector2D, p2: Vector2D): AABB => {
    return {
        x1: p1.x,
        z1: p1.z,
        x2: p2.x,
        z2: p2.z
    };
};

const origin: Vector2D = { x: 0, z: 0 };

interface Config {
    seed?: string;
    renderControls?: boolean;
    bottom?: boolean;
    allowMarkers: boolean;
    mapBackgroundColor: string;
    uiBackgroundColor: string;
    slimeChunkColor: string;
    strokeColor: string;
    textColor: string;
    markerDefaultColor: string;
}

interface Controls {
    seedInput: HTMLInputElement;
    xInput: HTMLInputElement;
    zInput: HTMLInputElement;
}

export class SlimeMap {
    /** The maps seed */
    private seed: Long;
    /** canvas height */
    private height = 0;
    /** canvas width */
    private width = 0;
    /** x position on the map. (viewer/camera position) */
    private xPos = 0;
    /** y position on the map. (viewer/camera position) */
    private zPos = 0;
    /** the cursor Position (canvas coordinate system) */
    public mousePos: Vector2D = { ...origin };
    /** zoom factor. higher means larger area visible */
    public zoom = 2.5;
    private minzoom = 0.7;
    private maxzoom = 5;
    /** viewport: visible area on the map in coordinates (not px). slightly oversized to compensate for partly visible chunks. */
    private vp!: AABB;
    /** visible area on map in chunks. */
    private chunkvp!: AABB;
    /** the border on the left side between canvas and map edge. */
    public borderleft = 70;
    /** the border on the top side between canvas and map edge. */
    public bordertop = 50;
    /** the border on the bottom side between canvas and map edge. */
    private borderbottom = 20;
    /** the border on the left bottom between canvas and map edge. */
    public borderright = 20;
    public markers: Marker[] = [];
    public canvas: HTMLCanvasElement;
    public ctx: CanvasRenderingContext2D;
    private SCH: SlimeChunkHandler;
    public config: Config;
    private controls: Controls = undefined as any;
    /** Reference to marker automatically placed by gotoCoordinates. */
    private jumpMarker: Marker | undefined;

    public constructor(id: string, config?: Partial<Config>) {
        this.config = {
            strokeColor: "#000000",
            textColor: "#000000",
            mapBackgroundColor: "#e0e0e0",
            uiBackgroundColor: "#CED4DE",
            slimeChunkColor: "#44dd55",
            markerDefaultColor: "#aa0000",
            allowMarkers: true,
            ...config
        };


        this.canvas = this.createDOM(id);

        attachContextMenu(this);

        this.canvas.setAttribute("style", "cursor: grab; cursor: -webkit-grab");
        const ctx = this.canvas.getContext("2d");
        this.ctx = ctx ? ctx : new CanvasRenderingContext2D();
        this.assertEventHandlers();

        this.seed = !!this.config.seed ? fromString(this.config.seed) : new Long(Date.now());
        this.SCH = new SlimeChunkHandler(this.seed);
        this.updateSizes();
        // this.drawStaticUI();
        this.redraw();

        this.canvas.onmousemove = (event: MouseEvent) => {
            this.mousePos = { x: event.offsetX, z: event.offsetY };
            if (event.buttons === 1) {
                this.xPos -= event.movementX / this.zoom;
                this.zPos -= event.movementY / this.zoom;
                this.redraw();
            } else {
                this.drawFooter();
            }
        };

        this.canvas.onmousedown = (_event: MouseEvent) => {
            const vec = this.getMapCoord(this.mousePos);
            if (vec) {
                this.canvas.setAttribute("style", "cursor: grabbing; cursor: -webkit-grabbing");
            }
        };

        this.canvas.onmouseup = (_event: MouseEvent) => {
            this.canvas.setAttribute("style", "cursor: grab; cursor: -webkit-grab");
        };

        const style = document.createElement("style");
        style.innerText = `
            .ctxmenu {
                background-color: ${this.config.uiBackgroundColor};
                box-shadow: 3px 3px 15px;
            }

            .ctxmenu li.disabled {
                color: #999;
            }

            .dialog {
                font-familz: 'Montserrat';
            }
        `;
        document.head.appendChild(style);
    }

    public setSeed(seed: string) {
        this.seed = fromString(seed);
        this.SCH = new SlimeChunkHandler(this.seed);
        this.redraw();
    }

    public gotoCoordinate(x: number, z: number);
    public gotoCoordinate(coordinate: Vector2D);
    public gotoCoordinate(param1: number | Vector2D, y?: number) {
        const coordinate = this.isVector2D(param1) ? param1 : { x: param1, z: y as number };
        this.xPos = coordinate.x;
        this.zPos = coordinate.z;
        this.redraw();
    }

    private loadFont() {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = 'https://fonts.googleapis.com/css?family=Montserrat:300,400';
        document.head.appendChild(link);

        //rerender a few times for the first few seconds,
        const i = setInterval(() => {
            this.drawStaticUI();
            this.drawUI();
        }, 100);
        setTimeout(() => clearInterval(i), 2000);
    }

    private createDOM(id: string): HTMLCanvasElement {
        this.loadFont();

        const parent = document.getElementById(id);
        if (!parent) {
            throw (new Error("Element not found."));
        }
        const canvas: HTMLCanvasElement = document.createElement("canvas");

        let container: HTMLElement;
        if (parent.tagName === "CANVAS") {
            container = document.createElement("div");
            // tslint:disable-next-line:prefer-for-of
            for (let i = 0; i < parent.attributes.length; i++) {
                const attr = parent.attributes[i];
                if (attr.name === "width" || attr.name === "height") {
                    container.style[attr.name] = attr.value;
                }
                container.setAttribute(attr.name, attr.value);
            }
            container.appendChild(canvas);

            const pparent = parent.parentNode || document.body;
            pparent.replaceChild(container, parent);
        } else {
            container = parent;
            container.appendChild(canvas);
        }

        container.style.position = "relative";
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
        canvas.id = parent.id ? parent.id + "canvas" : "slimemap-canvas";

        if (this.config.renderControls) {
            const height = this.renderControls(container, this.config.bottom);
            this.borderbottom += this.config.bottom ? height : 0;
            this.bordertop += this.config.bottom ? 0 : height;
        }

        return canvas as HTMLCanvasElement;
    }

    private renderControls(container: HTMLElement, bottom: boolean = false) {
        const controlsdDiv = document.createElement("div");
        const height = "28px";
        Object.assign<CSSStyleDeclaration, Partial<CSSStyleDeclaration>>(controlsdDiv.style, {
            display: "flex",
            width: "100%",
            justifyContent: "space-between",
            position: "absolute",
            bottom: bottom ? "0px" : "auto",
            top: bottom ? "auto" : height,
            paddingRight: this.borderright + "px",
            paddingLeft: this.borderleft + "px",
            boxSizing: "border-box",
            height,
            lineHeight: height
        });

        const seedDiv = document.createElement("div");
        const seedInput: HTMLInputElement = document.createElement("input");
        seedInput.type = "text";
        seedInput.placeholder = "enter seed";
        const seedButton = document.createElement("button");
        seedButton.innerText = "Find Slimes";
        seedButton.addEventListener("click", () => {
            this.setSeed(seedInput.value);
            seedInput.value = "";
        });
        seedDiv.appendChild(seedInput);
        seedDiv.appendChild(seedButton);

        const navDiv = document.createElement("div");
        const xInput: HTMLInputElement = document.createElement("input");
        xInput.type = "text";
        xInput.placeholder = "X";
        xInput.style.width = "100px";
        const zInput: HTMLInputElement = document.createElement("input");
        zInput.type = "text";
        zInput.placeholder = "Z";
        zInput.style.width = "100px";
        const navButton = document.createElement("button");
        navButton.innerText = "go to coordinates";
        navButton.addEventListener("click", () => {
            const coordinate: Vector2D = { x: Number(xInput.value), z: Number(zInput.value) };
            if (this.jumpMarker) {
                deleteMarker(this.jumpMarker, this);
            }
            this.jumpMarker = { location: coordinate, label: `( X: ${coordinate.x} / Z: ${coordinate.z} )` };
            addMarker(this.jumpMarker, this);
            this.gotoCoordinate(coordinate);
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
            seedInput,
            xInput,
            zInput
        };

        return controlsdDiv.offsetHeight;
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
        const pos = this.getMapCoord(this.mousePos);
        if (pos) {
            event.preventDefault();
            let zoomfactor = 0.2;
            if (this.zoom < 2) {
                zoomfactor /= 2;
            }
            const direction = event.detail > 0 ? -1 : 1;
            zoomfactor *= direction;

            if ((this.zoom + zoomfactor) >= this.minzoom && (this.zoom + zoomfactor) <= this.maxzoom) {
                // zoom should be based on cursor position, i.e. the map position under the cursor should not change
                // during scroll. this means we can calc the offset of the positions before and after scrolling and apply
                // it to the position.
                this.zoom += zoomfactor;
                this.updateSizes();
                const newPos = this.getMapCoord(this.mousePos) as Vector2D;
                const offset = {
                    x: pos.x - newPos.x,
                    z: pos.z - newPos.z
                };
                this.xPos += offset.x;
                this.zPos += offset.z;

                this.redraw();
            }
        }
    }

    /**
     * calculates the visible map area in chunk representation.
     * Result is slightly oversized to account for partially visible chunks.
     */
    private calcChunkVP(): AABB {
        const v2s = getV2sfromAABB(this.vp);
        return getAABBfromV2s(
            this.doMath(v2s.p1, c => Math.floor(c / 16)),
            this.doMath(v2s.p2, c => Math.ceil(c / 16))
        );
    }

    private updateSizes() {
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.vp = this.calcViewport();
        this.chunkvp = this.calcChunkVP();
    }

    private drawFooter() {
        const vec = this.getMapCoord(this.mousePos);
        if (vec) {
            this.clearfooter();
            this.ctx.font = "normal 15px 'Montserrat'";
            this.ctx.fillStyle = this.config.textColor;
            this.ctx.fillText("X: " + vec.x.toFixed(0) + "\t Z: " + vec.z.toFixed(0), this.borderleft, this.height - this.borderbottom + 15);

            const Chunk = this.doMath(vec, c => Math.floor(c / 16));
            const Slimes = this.SCH.isSlimeChunk(Chunk) ? "ja" : "nein";
            this.ctx.fillText("Slimes: " + Slimes, this.borderleft + 200, this.height - this.borderbottom + 15);

            const From = this.ChunkToCoord(Chunk);
            const To = this.doMath(From, c => c + 15);

            this.ctx.textAlign = "end";
            this.ctx.fillText("Chunk: ( " + Chunk.x + " / " + Chunk.z + " )  im Bereich von: ( " +
                From.x + " / " + From.z + ")  bis: ( " +
                To.x + " / " + To.z + " )", this.width - this.borderright, this.height - this.borderbottom + 15);
            this.ctx.textAlign = "start";
        }
    }

    private clearfooter() {
        this.ctx.fillStyle = this.config.uiBackgroundColor;
        this.ctx.fillRect(this.borderleft - 1, this.height - this.borderbottom, this.width - this.borderleft, this.borderbottom);
    }

    public redraw() {
        this.vp = this.calcViewport();

        //fill map
        this.ctx.fillStyle = this.config.mapBackgroundColor;
        this.ctx.fillRect(this.borderleft, this.bordertop, this.width - this.borderleft - this.borderright, this.height - this.bordertop - this.borderbottom);

        //UI
        this.updateSlimeVP();
        this.drawSlimeChunks();
        this.drawGrid();
        drawAllMarkers(this);

        this.clearBorderRight();
        this.clearfooter();
        this.drawStaticUI();
        this.drawUI();
    }

    private updateSlimeVP() {
        if (JSON.stringify(this.chunkvp) !== JSON.stringify(this.calcChunkVP())) {
            this.chunkvp = this.calcChunkVP();
        }
    }

    private drawSlimeChunks() {
        this.ctx.fillStyle = this.config.slimeChunkColor;

        for (let x = this.chunkvp.x1; x < this.chunkvp.x2; x++) {
            for (let z = this.chunkvp.z1; z < this.chunkvp.z2; z++) {
                if (this.SCH.isSlimeChunk({ x, z })) {
                    const vec = this.ChunkToCoord({ x, z });

                    let vec2 = this.getAbsCoord(vec);
                    if (vec2) {
                        this.ctx.fillRect(vec2.x + 1, vec2.z + 1, 16 * this.zoom - 1, 16 * this.zoom - 1);
                        continue;
                    }
                    //slime chunk may be partially on map (overlap in x direction)
                    vec2 = this.getAbsCoord({ x: vec.x + 16, z: vec.z });
                    if (vec2) {
                        this.ctx.fillRect(vec2.x - 16 * this.zoom, vec2.z, 16 * this.zoom - 1, 16 * this.zoom - 1);
                        continue;
                    }
                    //slime chunk may be partially on map (overlap in y direction)
                    vec2 = this.getAbsCoord({ x: vec.x, z: vec.z + 16 });
                    if (vec2) {
                        this.ctx.fillRect(vec2.x, vec2.z - 16 * this.zoom, 16 * this.zoom - 1, 16 * this.zoom - 1);
                        continue;
                    }
                    //slime chunk may be partially on map (overlap in both directions)
                    vec2 = this.getAbsCoord({ x: vec.x + 16, z: vec.z + 16 });
                    if (vec2) {
                        this.ctx.fillRect(vec2.x - 16 * this.zoom, vec2.z - 16 * this.zoom, 16 * this.zoom - 1, 16 * this.zoom - 1);
                        continue;
                    }
                }
            }
        }
    }

    private drawUI() {
        let factor = 16;
        if (this.zoom < 2) { factor *= 2; }
        if (this.zoom < 0.9) { factor *= 2; }
        this.ctx.font = "normal 12px 'Montserrat'";
        this.ctx.fillStyle = this.config.textColor;
        //X
        for (let i = Math.ceil(this.vp.x1 / factor); i <= Math.floor(this.vp.x2 / factor); i++) {
            const mark = i * factor;
            let pos: Vector2D = { x: mark, z: this.vp.z1 };
            pos = this.getAbsCoord(pos, true);
            this.ctx.fillText(mark + "", pos.x - (mark.toString().length * 3), this.bordertop - 5);
        }
        //Z
        for (let i = Math.ceil(this.vp.z1 / factor); i <= Math.floor(this.vp.z2 / factor); i++) {
            const mark = i * factor;
            let pos: Vector2D = { x: this.vp.x1, z: mark };
            pos = this.getAbsCoord(pos, true);
            this.ctx.fillText(mark + "", this.borderleft - 30, pos.z + 4);
        }
    }

    private drawStaticUI() {
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
        this.ctx.strokeStyle = this.config.strokeColor;
        //X
        for (let i = Math.ceil(this.vp.x1 / factor); i <= Math.floor(this.vp.x2 / factor); i++) {
            this.ctx.lineWidth = (i === 0) ? 0.8 : 0.5;
            const mark = i * factor;
            let pos: Vector2D = { x: mark, z: this.vp.z1 };
            pos = this.getAbsCoord(pos, true);
            this.ctx.beginPath();
            this.ctx.moveTo(pos.x, this.bordertop);
            this.ctx.lineTo(pos.x, this.height - this.borderbottom);
            this.ctx.stroke();
            this.ctx.closePath();
        }
        //Z
        for (let i = Math.ceil(this.vp.z1 / factor); i <= Math.floor(this.vp.z2 / factor); i++) {
            this.ctx.lineWidth = (i === 0) ? 0.8 : 0.5;
            const mark = i * factor;
            let pos: Vector2D = { x: this.vp.x1, z: mark };
            pos = this.getAbsCoord(pos, true);
            this.ctx.beginPath();
            this.ctx.moveTo(this.borderleft, pos.z);
            this.ctx.lineTo(this.width - this.borderright, pos.z);
            this.ctx.stroke();
            this.ctx.closePath();
        }
    }

    private clearBorderRight() {
        this.ctx.fillStyle = this.config.uiBackgroundColor;
        this.ctx.fillRect(this.width - this.borderright, 0, this.borderright, this.height);
    }

    private isInVP(vec: Vector2D): boolean {
        return (vec.x >= this.vp.x1 && vec.x <= this.vp.x2 &&
            vec.z >= this.vp.z1 && vec.z <= this.vp.z2);
    }

    private isOverMap(vec: Vector2D): boolean {
        return (
            vec.x >= this.borderleft && vec.x <= (this.width - this.borderright) &&
            vec.z >= this.bordertop && vec.z <= (this.height - this.borderbottom));
    }

    public getAbsCoord(vec: Vector2D): false | Vector2D;
    public getAbsCoord(vec: Vector2D, ignoreBorder: true): Vector2D;
    public getAbsCoord(vec: Vector2D, ignoreBorder: boolean = false): false | Vector2D {
        if (this.isInVP(vec) || ignoreBorder) {
            const vec2 = { ...origin };
            vec2.x = ((Math.floor(vec.x) - this.vp.x1) * this.zoom) + this.borderleft;
            vec2.z = ((Math.floor(vec.z) - this.vp.z1) * this.zoom) + this.bordertop;
            return vec2;
        }
        return false;
    }

    public getMapCoord(vec: Vector2D): false | Vector2D {
        if (this.isOverMap(vec)) {
            const vec2: Vector2D = { ...origin };
            vec2.x = Math.round((vec.x - this.borderleft) / this.zoom);
            vec2.z = Math.round((vec.z - this.bordertop) / this.zoom);
            vec2.x += this.vp.x1;
            vec2.z += this.vp.z1;
            return vec2;
        }
        return false;
    }

    private calcViewport(): AABB {
        const v: Partial<AABB> = {};
        let mapWidth = this.width - this.borderleft - this.borderright;
        let mapHeight = this.height - this.bordertop - this.borderbottom;
        mapWidth /= this.zoom;
        mapHeight /= this.zoom;
        v.x1 = Math.floor((this.xPos - (mapWidth / 2)));
        v.z1 = Math.floor((this.zPos - (mapHeight / 2)));
        v.x2 = Math.ceil((this.xPos + (mapWidth / 2)));
        v.z2 = Math.ceil((this.zPos + (mapHeight / 2)));
        return v as AABB;
    }

    /**
     * takes a number, vector or area and applies the given (arithmetic) function to each value.
     */
    private doMath(number: number, f: (x: number) => number): number;
    private doMath(vec: Vector2D, f: (x: number) => number): Vector2D;
    private doMath(area: AABB, f: (x: number) => number): AABB;
    private doMath(arg: number | Vector2D | AABB, f: (x: number) => number): number | Vector2D | AABB;
    private doMath(arg: number | Vector2D | AABB, f: (x: number) => number): number | Vector2D | AABB {
        if (this.isVector2D(arg)) {
            return {
                x: this.doMath(arg.x, f),
                z: this.doMath(arg.z, f)
            };
        }
        else if (this.isAABB(arg)) {
            const v2s = getV2sfromAABB(arg);
            return getAABBfromV2s(this.doMath(v2s.p1, f), this.doMath(v2s.p2, f));
        }
        return f(arg);
    }

    public ChunkToCoord(number: number): number;
    public ChunkToCoord(vec: Vector2D): Vector2D;
    public ChunkToCoord(area: AABB): AABB;
    public ChunkToCoord(arg: number | Vector2D | AABB): number | Vector2D | AABB {
        return this.doMath(arg, x => x * 16);
    }

    private isVector2D(vec: any): vec is Vector2D {
        if (typeof vec !== "object") {
            return false;
        }
        const keys = Object.keys(vec);
        return keys.length === 2 && typeof vec.x === "number" && typeof vec.z === "number";
    }

    private isAABB(vec: any): vec is AABB {
        if (typeof vec !== "object") {
            return false;
        }
        const keys = Object.keys(vec);
        return keys.length === 4 && typeof vec.x1 === "number" && typeof vec.z1 === "number" && typeof vec.x2 === "number" && typeof vec.z2 === "number";
    }

}

(window as any).SlimeMap = SlimeMap;
