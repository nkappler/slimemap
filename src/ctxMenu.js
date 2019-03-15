"use strict";/*! ctxMenu v1.0 | (c) Nikolaj Kappler | https://github.com/nkappler/ctxmenu/blob/master/LICENSE !*/function _classCallCheck(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}var ContextMenu=function(){function a(){var b=this;_classCallCheck(this,a),this.cache={},this.dir="r",window.addEventListener("click",function(){return b.closeMenu()}),window.addEventListener("resize",function(){return b.closeMenu()}),window.addEventListener("scroll",function(){return b.closeMenu()})}return a.prototype.attach=function(a,b){var c=this,d=2<arguments.length&&void 0!==arguments[2]?arguments[2]:function(a){return a},e=document.querySelector(a);if(void 0!==this.cache[a])return void console.error("target element "+a+" already has a context menu assigned. Use ContextMenu.update() intstead.");if(!e)return void console.error("target element "+a+" not found");var f=function(a){a.stopImmediatePropagation(),c.closeMenu(),c.dir="r";var e=d([].concat(b),a);c.menu=c.generateDOM(e,a),document.body.appendChild(c.menu),a.preventDefault()};this.cache[a]={ctxmenu:b,handler:f},e.addEventListener("contextmenu",f)},a.prototype.update=function(a,b){var c=this.cache[a],d=document.querySelector(a);d&&d.removeEventListener("contextmenu",c&&c.handler),delete this.cache[a],this.attach(a,b)},a.prototype.delete=function(a){var b=this.cache[a];if(!b)return void console.error("no context menu for target element "+a+" found");var c=document.querySelector(a);return c?void(c.removeEventListener("contextmenu",b.handler),delete this.cache[a]):void console.error("target element "+a+" does not exist (anymore)")},a.prototype.closeMenu=function(){var a=0<arguments.length&&void 0!==arguments[0]?arguments[0]:this.menu;if(a){a===this.menu&&delete this.menu;var b=a.parentElement;b&&b.removeChild(a)}},a.prototype.debounce=function(a,b){var c;a.addEventListener("mouseenter",function(a){c=setTimeout(function(){return b(a)},150)}),a.addEventListener("mouseleave",function(){return clearTimeout(c)})},a.prototype.generateDOM=function(b,c){var d=this,e=document.createElement("ul");0===b.length&&(e.style.display="none"),b.forEach(function(b){var c=document.createElement("li");d.debounce(c,function(){var a=c.parentElement&&c.parentElement.querySelector("ul");a&&a.parentElement!==c&&d.closeMenu(a)}),a.itemIsDivider(b)?c.className="divider":(c.innerHTML="<span>"+b.text+"</span>",c.title=b.tooltip||"",a.itemIsInteractive(b)?b.disabled?(c.className="disabled",a.itemIsSubMenu(b)&&(c.className="disabled submenu")):(c.className="interactive",a.itemIsAction(b)?c.addEventListener("click",b.action):a.itemIsAnchor(b)?c.innerHTML="<a href=\""+b.href+"\" target=\""+(b.target||"")+"\">"+b.text+"</a>":0===b.subMenu.length?c.className="disabled submenu":(c.className="interactive submenu",d.debounce(c,function(a){var e=c.querySelector("ul");e||d.openSubMenu(a,b.subMenu,c)}))):(c.style.fontWeight="bold",c.style.marginLeft="-5px")),e.appendChild(c)}),e.style.position="fixed",e.className="ctxmenu";var f=a.getBounding(e),g={x:0,y:0};if(c instanceof Element){var h=c.getBoundingClientRect();g={x:"r"===this.dir?h.left+h.width:h.left-f.width,y:h.top-4},g.x!==this.getPosition(f,g).x&&(this.dir="r"===this.dir?"l":"r",g.x="r"===this.dir?h.left+h.width:h.left-f.width)}else g=this.getPosition(f,{x:c.clientX,y:c.clientY});return e.style.left=g.x+"px",e.style.top=g.y+"px",e.addEventListener("contextmenu",function(a){a.stopPropagation(),a.preventDefault()}),e.addEventListener("click",function(a){var b=a.target&&a.target.parentElement;b&&"interactive"!==b.className&&a.stopPropagation()}),e},a.prototype.openSubMenu=function(a,b,c){var d=c.parentElement&&c.parentElement.querySelector("li > ul");d&&d.parentElement!==c&&this.closeMenu(d),c.appendChild(this.generateDOM(b,c))},a.getBounding=function(a){var b=a.cloneNode(!0);b.style.visibility="hidden",document.body.appendChild(b);var c=b.getBoundingClientRect();return document.body.removeChild(b),c},a.prototype.getPosition=function(a,b){return{x:"r"===this.dir?b.x+a.width>window.innerWidth?window.innerWidth-a.width:b.x:0>b.x?0:b.x,y:b.y+a.height>window.innerHeight?window.innerHeight-a.height:b.y}},a.itemIsInteractive=function(a){return this.itemIsAction(a)||this.itemIsAnchor(a)||this.itemIsSubMenu(a)},a.itemIsAction=function(a){return a.hasOwnProperty("action")},a.itemIsAnchor=function(a){return a.hasOwnProperty("href")},a.itemIsDivider=function(a){return a.hasOwnProperty("isDivider")},a.itemIsSubMenu=function(a){return a.hasOwnProperty("subMenu")},a}();window.ContextMenu=new ContextMenu,document.addEventListener("readystatechange",function(){if("interactive"===document.readyState){var a=document.createElement("style");a.innerHTML=".ctxmenu{border:1px solid #999;padding:2px 0;box-shadow:3px 3px 3px #aaa;background:#fff;margin:0;font-size:15px;z-index:9999}.ctxmenu li{margin:1px 0;display:block;position:relative}.ctxmenu li span,.ctxmenu li a{display:block;padding:2px 20px;cursor:default}.ctxmenu li a{color:inherit;text-decoration:none}.ctxmenu li.disabled{color:#ccc}.ctxmenu li.divider{border-bottom:1px solid #aaa;margin:5px 0}.ctxmenu li.interactive:hover{background:rgba(0,0,0,0.1)}.ctxmenu li.submenu::after{content:'>';position:absolute;display:block;top:0;right:0.3em;font-family:monospace}",document.head.insertBefore(a,document.head.childNodes[0])}});