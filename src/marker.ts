import { ctxmenu } from "ctxmenu";
import { SlimeMap, Vector2D } from "./slimeMap";

export interface Marker {
    location: Vector2D;
    label?: string;
    color?: string;
}

export function attachContextMenu(sm: SlimeMap) {
    ctxmenu.attach("#" + sm.canvas.id, [], (cxm) => {
        const coord = sm.getMapCoord(sm.mousePos);
        if (coord === false) {
            return [];
        }

        const getLabelDesc = (marker: Marker) => marker.label ? `"${marker.label}"` : `at ${JSON.stringify(marker.location)}`;

        const closestMarker = findClosestMarker(coord, sm, 40 / sm.zoom); // increase search area the further zoomed out
        if (closestMarker) {
            const label = getLabelDesc(closestMarker);
            cxm = cxm.concat([
                {
                    text: `Marker ${label}:`
                },
                {
                    text: `Edit marker ${label}`,
                    action: () => {
                        showEditMarkerDialog(closestMarker, sm, (updatedMarker) => {
                            deleteMarker(closestMarker, sm);
                            addMarker(updatedMarker, sm);
                        });
                    }
                },
                {
                    text: `Delete marker ${label}`,
                    action: () => deleteMarker(closestMarker, sm)
                },
                { isDivider: true }
            ]);
        }

        if (sm.config.allowMarkers) {
            cxm = cxm.concat([
                {
                    text: "Add marker",
                    action: () => {
                        showEditMarkerDialog({
                            location: coord
                        }, sm, (marker) => {
                            addMarker(marker, sm);
                        });
                    }
                },
                {
                    text: "Delete all markers",
                    action: () => {
                        deleteAllMarkers(sm);
                    },
                    disabled: sm.markers.length === 0
                }
            ]);
        }
        cxm.push({
            text: "Go to marker",
            subMenu: sm.markers.map((marker) => ({
                text: getLabelDesc(marker),
                action: () => sm.gotoCoordinate(marker.location)
            })),
            disabled: sm.markers.length === 0
        }
        );
        return cxm;
    });


    const style = document.createElement("style");
    style.innerText = `
        .ctxmenu {
            background-color: ${sm.config.uiBackgroundColor};
            box-shadow: 3px 3px 15px;
        }

        .ctxmenu li.disabled {
            color: #999;
        }

        .dialog {
            font-family: 'Montserrat';
        }
    `;
    document.head.appendChild(style);
}

export function addMarker(marker: Marker, sm: SlimeMap) {
    sm.markers.push(marker);
    sm.redraw();
}

export function deleteAllMarkers(sm: SlimeMap) {
    sm.markers = [];
    sm.redraw();
}

export function deleteMarker(index: number, sm: SlimeMap): boolean;
export function deleteMarker(marker: Marker, sm: SlimeMap): boolean;
export function deleteMarker(arg0: number | Marker, sm: SlimeMap): boolean {
    if (typeof arg0 === "number") {
        if (arg0 < sm.markers.length) {
            sm.markers.splice(arg0, 1);
            sm.redraw();
            return true;
        }
    }
    else if (sm.markers.includes(arg0)) {
        sm.markers.splice(sm.markers.indexOf(arg0), 1);
        sm.redraw();
        return true;
    }
    return false;
}

export function findClosestMarker(searchPos: Vector2D, sm: SlimeMap, maxRadius: number = Infinity): Marker | undefined {
    if (sm.markers.length === 0) {
        return undefined;
    }
    let closestMarker: Marker | undefined;
    let closestDistance: number = Infinity;
    sm.markers.forEach(marker => {
        //Pythagoras
        const distance = Math.sqrt(
            Math.pow(marker.location.x - searchPos.x, 2) +
            Math.pow(marker.location.z - searchPos.z, 2)
        );
        if (distance < maxRadius && distance < closestDistance) {
            closestDistance = distance;
            closestMarker = marker;
        }
    });

    return closestMarker;
}

export function drawAllMarkers(sm: SlimeMap) {
    for (const marker of sm.markers) {
        sm.ctx.strokeStyle = sm.config.strokeColor;
        sm.ctx.fillStyle = marker.color || sm.config.markerDefaultColor;
        sm.ctx.lineWidth = 1;
        const coord = sm.getAbsCoord(marker.location, true);

        const { x, z } = coord;

        const size = 32;

        const height = size;
        const width = 2 * height / 3;

        sm.ctx.beginPath();
        sm.ctx.moveTo(x, z);
        sm.ctx.bezierCurveTo(x - width / 8, z - width / 16 * 9, x - width / 2, z - width / 16 * 9, x - width / 2, z - width);
        sm.ctx.arcTo(x - width / 2, z - height, x, z - height, width / 2);
        sm.ctx.arcTo(x + width / 2, z - height, x + width / 2, z - width, width / 2);
        sm.ctx.bezierCurveTo(x + width / 2, z - width / 16 * 9, x + width / 8, z - width / 16 * 9, x, z);
        sm.ctx.fill();
        sm.ctx.stroke();

        sm.ctx.fill();

        sm.ctx.stroke();
        sm.ctx.closePath();

        if (marker.label) {
            sm.ctx.font = "normal 15px 'Montserrat'";
            sm.ctx.textAlign = "center";
            const textWidth = sm.ctx.measureText(marker.label).width;
            sm.ctx.fillStyle = "rgba(206,212,222,0.7)";
            sm.ctx.fillRect(x - textWidth / 2 - 3, z - size - 30, textWidth + 6, 21);
            sm.ctx.fillStyle = sm.config.textColor;
            sm.ctx.fillText(marker.label, x, z - size - 15);
            sm.ctx.textAlign = "left";
        }
    }
}

/**
 *
 * @param marker the default marker properties
 * @param onSubmit callback when the dialog is submitted
 */
export function showEditMarkerDialog(marker: Marker, sm: SlimeMap, onSubmit: (marker: Marker) => void) {
    const parent = sm.canvas.parentElement;
    if (!parent) {
        throw new Error("Canvas has no parent");
    }

    const popup = document.createElement("div");
    popup.style.display = "grid";
    popup.style.gridTemplateColumns = "auto auto";
    popup.style.padding = "15px";
    popup.className = "dialog";

    const labelInput = document.createElement("input");
    const labelLabel = document.createElement("label");
    labelInput.value = marker.label || "New Marker";
    labelLabel.innerText = "Marker Label:";
    popup.appendChild(labelLabel);
    popup.appendChild(labelInput);

    const colorInput = document.createElement("input");
    const colorLabel = document.createElement("label");
    colorInput.type = "color";
    colorInput.value = marker.color || sm.config.markerDefaultColor;
    colorLabel.innerText = "Marker Color:";
    popup.appendChild(colorLabel);
    popup.appendChild(colorInput);

    const xposInput = document.createElement("input");
    const xPosLabel = document.createElement("label");
    xposInput.type = "number";
    xposInput.value = marker.location.x + "";
    xPosLabel.innerText = "Marker X Position:";
    popup.appendChild(xPosLabel);
    popup.appendChild(xposInput);

    const zposInput = document.createElement("input");
    const zPosLabel = document.createElement("label");
    zposInput.type = "number";
    zposInput.value = marker.location.z + "";
    zPosLabel.innerText = "Marker Z Position:";
    popup.appendChild(zPosLabel);
    popup.appendChild(zposInput);

    const cancelBtn = document.createElement("button");
    cancelBtn.innerText = "Cancel";
    popup.appendChild(cancelBtn);

    const submitBtn = document.createElement("button");
    submitBtn.innerText = "Submit";
    popup.appendChild(submitBtn);

    const bounding = getBounding(popup);

    Object.assign<CSSStyleDeclaration, Partial<CSSStyleDeclaration>>(popup.style, {
        position: "relative",
        margin: "auto",
        zIndex: "999",
        background: sm.config.uiBackgroundColor,
        top: ((-parent.offsetHeight - bounding.height) * 0.5) + "px",
        width: "300px",
        boxShadow: `${sm.config.strokeColor} 3px 3px 15px`,
        left: `${sm.borderleft - sm.borderright}px`
    });

    parent.appendChild(popup);

    submitBtn.onclick = () => {
        parent.removeChild(popup);
        marker = {
            label: labelInput.value,
            color: colorInput.value,
            location: {
                x: Number(xposInput.value),
                z: Number(zposInput.value)
            }
        }
        onSubmit(marker);
    }

    cancelBtn.onclick = () => {
        parent.removeChild(popup);
    }
}

export function getBounding(elem: HTMLElement): ClientRect | DOMRect {
    const container = elem.cloneNode(true) as HTMLElement;
    container.style.visibility = "hidden";
    document.body.appendChild(container);
    const result = container.getBoundingClientRect();
    document.body.removeChild(container);
    return result;
}
