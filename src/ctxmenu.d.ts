/*! ctxMenu v1.0 | (c) Nikolaj Kappler | https://github.com/nkappler/ctxmenu/blob/master/LICENSE !*/
declare const css: any;
interface CTXMDivider {
    isDivider: true;
}
interface CTXMHeading {
    text: string;
    tooltip?: string;
}
interface CTXMInteractive extends CTXMHeading {
    disabled?: boolean;
}
interface CTXMAction extends CTXMInteractive {
    action: (ev: MouseEvent) => void;
}
interface CTXMAnchor extends CTXMInteractive {
    href: string;
    target?: string;
}
interface CTXMSubMenu extends CTXMInteractive {
    subMenu: CTXMenu;
}
declare type CTXMItem = CTXMAnchor | CTXMAction | CTXMHeading | CTXMDivider | CTXMSubMenu;
declare type CTXMenu = CTXMItem[];
interface CTXCache {
    [key: string]: {
        ctxmenu: CTXMenu;
        handler: Function;
    } | undefined;
}
interface Window {
    ContextMenu: ContextMenu;
}
interface Pos {
    x: number;
    y: number;
}
declare class ContextMenu {
    private menu;
    private cache;
    private dir;
    constructor();
    attach(target: string, ctxmenu: CTXMenu, beforeRender?: (menu: CTXMenu, e: MouseEvent) => CTXMenu): void;
    update(target: string, ctxmenu: CTXMenu): void;
    delete(target: string): void;
    private closeMenu(menu?);
    private debounce(target, action);
    private generateDOM(ctxMenu, event);
    private generateDOM(ctxMenu, parentElement);
    private openSubMenu(e, ctxMenu, listElement);
    private static getBounding(elem);
    private getPosition(rect, pos);
    private static itemIsInteractive(item);
    private static itemIsAction(item);
    private static itemIsAnchor(item);
    private static itemIsDivider(item);
    private static itemIsSubMenu(item);
}
