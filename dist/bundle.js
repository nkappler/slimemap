!function(t){var i={};function e(s){if(i[s])return i[s].exports;var h=i[s]={i:s,l:!1,exports:{}};return t[s].call(h.exports,h,h.exports,e),h.l=!0,h.exports}e.m=t,e.c=i,e.d=function(t,i,s){e.o(t,i)||Object.defineProperty(t,i,{enumerable:!0,get:s})},e.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},e.t=function(t,i){if(1&i&&(t=e(t)),8&i)return t;if(4&i&&"object"==typeof t&&t&&t.__esModule)return t;var s=Object.create(null);if(e.r(s),Object.defineProperty(s,"default",{enumerable:!0,value:t}),2&i&&"string"!=typeof t)for(var h in t)e.d(s,h,function(i){return t[i]}.bind(null,h));return s},e.n=function(t){var i=t&&t.__esModule?function(){return t.default}:function(){return t};return e.d(i,"a",i),i},e.o=function(t,i){return Object.prototype.hasOwnProperty.call(t,i)},e.p="",e(e.s=1)}([function(t,i){t.exports=s;var e=null;try{e=new WebAssembly.Instance(new WebAssembly.Module(new Uint8Array([0,97,115,109,1,0,0,0,1,13,2,96,0,1,127,96,4,127,127,127,127,1,127,3,7,6,0,1,1,1,1,1,6,6,1,127,1,65,0,11,7,50,6,3,109,117,108,0,1,5,100,105,118,95,115,0,2,5,100,105,118,95,117,0,3,5,114,101,109,95,115,0,4,5,114,101,109,95,117,0,5,8,103,101,116,95,104,105,103,104,0,0,10,191,1,6,4,0,35,0,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,126,34,4,66,32,135,167,36,0,32,4,167,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,127,34,4,66,32,135,167,36,0,32,4,167,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,128,34,4,66,32,135,167,36,0,32,4,167,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,129,34,4,66,32,135,167,36,0,32,4,167,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,130,34,4,66,32,135,167,36,0,32,4,167,11])),{}).exports}catch(t){}function s(t,i,e){this.low=0|t,this.high=0|i,this.unsigned=!!e}function h(t){return!0===(t&&t.__isLong__)}s.prototype.__isLong__,Object.defineProperty(s.prototype,"__isLong__",{value:!0}),s.isLong=h;var r={},o={};function n(t,i){var e,s,h;return i?(h=0<=(t>>>=0)&&t<256)&&(s=o[t])?s:(e=a(t,(0|t)<0?-1:0,!0),h&&(o[t]=e),e):(h=-128<=(t|=0)&&t<128)&&(s=r[t])?s:(e=a(t,t<0?-1:0,!1),h&&(r[t]=e),e)}function u(t,i){if(isNaN(t))return i?y:p;if(i){if(t<0)return y;if(t>=g)return M}else{if(t<=-v)return P;if(t+1>=v)return S}return t<0?u(-t,i).neg():a(t%f|0,t/f|0,i)}function a(t,i,e){return new s(t,i,e)}s.fromInt=n,s.fromNumber=u,s.fromBits=a;var l=Math.pow;function c(t,i,e){if(0===t.length)throw Error("empty string");if("NaN"===t||"Infinity"===t||"+Infinity"===t||"-Infinity"===t)return p;if("number"==typeof i?(e=i,i=!1):i=!!i,(e=e||10)<2||36<e)throw RangeError("radix");var s;if((s=t.indexOf("-"))>0)throw Error("interior hyphen");if(0===s)return c(t.substring(1),i,e).neg();for(var h=u(l(e,8)),r=p,o=0;o<t.length;o+=8){var n=Math.min(8,t.length-o),a=parseInt(t.substring(o,o+n),e);if(n<8){var d=u(l(e,n));r=r.mul(d).add(u(a))}else r=(r=r.mul(h)).add(u(a))}return r.unsigned=i,r}function d(t,i){return"number"==typeof t?u(t,i):"string"==typeof t?c(t,i):a(t.low,t.high,"boolean"==typeof i?i:t.unsigned)}s.fromString=c,s.fromValue=d;var f=4294967296,g=f*f,v=g/2,x=n(1<<24),p=n(0);s.ZERO=p;var y=n(0,!0);s.UZERO=y;var m=n(1);s.ONE=m;var b=n(1,!0);s.UONE=b;var w=n(-1);s.NEG_ONE=w;var S=a(-1,2147483647,!1);s.MAX_VALUE=S;var M=a(-1,-1,!0);s.MAX_UNSIGNED_VALUE=M;var P=a(0,-2147483648,!1);s.MIN_VALUE=P;var _=s.prototype;_.toInt=function(){return this.unsigned?this.low>>>0:this.low},_.toNumber=function(){return this.unsigned?(this.high>>>0)*f+(this.low>>>0):this.high*f+(this.low>>>0)},_.toString=function(t){if((t=t||10)<2||36<t)throw RangeError("radix");if(this.isZero())return"0";if(this.isNegative()){if(this.eq(P)){var i=u(t),e=this.div(i),s=e.mul(i).sub(this);return e.toString(t)+s.toInt().toString(t)}return"-"+this.neg().toString(t)}for(var h=u(l(t,6),this.unsigned),r=this,o="";;){var n=r.div(h),a=(r.sub(n.mul(h)).toInt()>>>0).toString(t);if((r=n).isZero())return a+o;for(;a.length<6;)a="0"+a;o=""+a+o}},_.getHighBits=function(){return this.high},_.getHighBitsUnsigned=function(){return this.high>>>0},_.getLowBits=function(){return this.low},_.getLowBitsUnsigned=function(){return this.low>>>0},_.getNumBitsAbs=function(){if(this.isNegative())return this.eq(P)?64:this.neg().getNumBitsAbs();for(var t=0!=this.high?this.high:this.low,i=31;i>0&&0==(t&1<<i);i--);return 0!=this.high?i+33:i+1},_.isZero=function(){return 0===this.high&&0===this.low},_.eqz=_.isZero,_.isNegative=function(){return!this.unsigned&&this.high<0},_.isPositive=function(){return this.unsigned||this.high>=0},_.isOdd=function(){return 1==(1&this.low)},_.isEven=function(){return 0==(1&this.low)},_.equals=function(t){return h(t)||(t=d(t)),(this.unsigned===t.unsigned||this.high>>>31!=1||t.high>>>31!=1)&&(this.high===t.high&&this.low===t.low)},_.eq=_.equals,_.notEquals=function(t){return!this.eq(t)},_.neq=_.notEquals,_.ne=_.notEquals,_.lessThan=function(t){return this.comp(t)<0},_.lt=_.lessThan,_.lessThanOrEqual=function(t){return this.comp(t)<=0},_.lte=_.lessThanOrEqual,_.le=_.lessThanOrEqual,_.greaterThan=function(t){return this.comp(t)>0},_.gt=_.greaterThan,_.greaterThanOrEqual=function(t){return this.comp(t)>=0},_.gte=_.greaterThanOrEqual,_.ge=_.greaterThanOrEqual,_.compare=function(t){if(h(t)||(t=d(t)),this.eq(t))return 0;var i=this.isNegative(),e=t.isNegative();return i&&!e?-1:!i&&e?1:this.unsigned?t.high>>>0>this.high>>>0||t.high===this.high&&t.low>>>0>this.low>>>0?-1:1:this.sub(t).isNegative()?-1:1},_.comp=_.compare,_.negate=function(){return!this.unsigned&&this.eq(P)?P:this.not().add(m)},_.neg=_.negate,_.add=function(t){h(t)||(t=d(t));var i=this.high>>>16,e=65535&this.high,s=this.low>>>16,r=65535&this.low,o=t.high>>>16,n=65535&t.high,u=t.low>>>16,l=0,c=0,f=0,g=0;return f+=(g+=r+(65535&t.low))>>>16,c+=(f+=s+u)>>>16,l+=(c+=e+n)>>>16,l+=i+o,a((f&=65535)<<16|(g&=65535),(l&=65535)<<16|(c&=65535),this.unsigned)},_.subtract=function(t){return h(t)||(t=d(t)),this.add(t.neg())},_.sub=_.subtract,_.multiply=function(t){if(this.isZero())return p;if(h(t)||(t=d(t)),e)return a(e.mul(this.low,this.high,t.low,t.high),e.get_high(),this.unsigned);if(t.isZero())return p;if(this.eq(P))return t.isOdd()?P:p;if(t.eq(P))return this.isOdd()?P:p;if(this.isNegative())return t.isNegative()?this.neg().mul(t.neg()):this.neg().mul(t).neg();if(t.isNegative())return this.mul(t.neg()).neg();if(this.lt(x)&&t.lt(x))return u(this.toNumber()*t.toNumber(),this.unsigned);var i=this.high>>>16,s=65535&this.high,r=this.low>>>16,o=65535&this.low,n=t.high>>>16,l=65535&t.high,c=t.low>>>16,f=65535&t.low,g=0,v=0,y=0,m=0;return y+=(m+=o*f)>>>16,v+=(y+=r*f)>>>16,y&=65535,v+=(y+=o*c)>>>16,g+=(v+=s*f)>>>16,v&=65535,g+=(v+=r*c)>>>16,v&=65535,g+=(v+=o*l)>>>16,g+=i*f+s*c+r*l+o*n,a((y&=65535)<<16|(m&=65535),(g&=65535)<<16|(v&=65535),this.unsigned)},_.mul=_.multiply,_.divide=function(t){if(h(t)||(t=d(t)),t.isZero())throw Error("division by zero");var i,s,r;if(e)return this.unsigned||-2147483648!==this.high||-1!==t.low||-1!==t.high?a((this.unsigned?e.div_u:e.div_s)(this.low,this.high,t.low,t.high),e.get_high(),this.unsigned):this;if(this.isZero())return this.unsigned?y:p;if(this.unsigned){if(t.unsigned||(t=t.toUnsigned()),t.gt(this))return y;if(t.gt(this.shru(1)))return b;r=y}else{if(this.eq(P))return t.eq(m)||t.eq(w)?P:t.eq(P)?m:(i=this.shr(1).div(t).shl(1)).eq(p)?t.isNegative()?m:w:(s=this.sub(t.mul(i)),r=i.add(s.div(t)));else if(t.eq(P))return this.unsigned?y:p;if(this.isNegative())return t.isNegative()?this.neg().div(t.neg()):this.neg().div(t).neg();if(t.isNegative())return this.div(t.neg()).neg();r=p}for(s=this;s.gte(t);){i=Math.max(1,Math.floor(s.toNumber()/t.toNumber()));for(var o=Math.ceil(Math.log(i)/Math.LN2),n=o<=48?1:l(2,o-48),c=u(i),f=c.mul(t);f.isNegative()||f.gt(s);)f=(c=u(i-=n,this.unsigned)).mul(t);c.isZero()&&(c=m),r=r.add(c),s=s.sub(f)}return r},_.div=_.divide,_.modulo=function(t){return h(t)||(t=d(t)),e?a((this.unsigned?e.rem_u:e.rem_s)(this.low,this.high,t.low,t.high),e.get_high(),this.unsigned):this.sub(this.div(t).mul(t))},_.mod=_.modulo,_.rem=_.modulo,_.not=function(){return a(~this.low,~this.high,this.unsigned)},_.and=function(t){return h(t)||(t=d(t)),a(this.low&t.low,this.high&t.high,this.unsigned)},_.or=function(t){return h(t)||(t=d(t)),a(this.low|t.low,this.high|t.high,this.unsigned)},_.xor=function(t){return h(t)||(t=d(t)),a(this.low^t.low,this.high^t.high,this.unsigned)},_.shiftLeft=function(t){return h(t)&&(t=t.toInt()),0==(t&=63)?this:t<32?a(this.low<<t,this.high<<t|this.low>>>32-t,this.unsigned):a(0,this.low<<t-32,this.unsigned)},_.shl=_.shiftLeft,_.shiftRight=function(t){return h(t)&&(t=t.toInt()),0==(t&=63)?this:t<32?a(this.low>>>t|this.high<<32-t,this.high>>t,this.unsigned):a(this.high>>t-32,this.high>=0?0:-1,this.unsigned)},_.shr=_.shiftRight,_.shiftRightUnsigned=function(t){if(h(t)&&(t=t.toInt()),0===(t&=63))return this;var i=this.high;return t<32?a(this.low>>>t|i<<32-t,i>>>t,this.unsigned):a(32===t?i:i>>>t-32,0,this.unsigned)},_.shru=_.shiftRightUnsigned,_.shr_u=_.shiftRightUnsigned,_.toSigned=function(){return this.unsigned?a(this.low,this.high,!1):this},_.toUnsigned=function(){return this.unsigned?this:a(this.low,this.high,!0)},_.toBytes=function(t){return t?this.toBytesLE():this.toBytesBE()},_.toBytesLE=function(){var t=this.high,i=this.low;return[255&i,i>>>8&255,i>>>16&255,i>>>24,255&t,t>>>8&255,t>>>16&255,t>>>24]},_.toBytesBE=function(){var t=this.high,i=this.low;return[t>>>24,t>>>16&255,t>>>8&255,255&t,i>>>24,i>>>16&255,i>>>8&255,255&i]},s.fromBytes=function(t,i,e){return e?s.fromBytesLE(t,i):s.fromBytesBE(t,i)},s.fromBytesLE=function(t,i){return new s(t[0]|t[1]<<8|t[2]<<16|t[3]<<24,t[4]|t[5]<<8|t[6]<<16|t[7]<<24,i)},s.fromBytesBE=function(t,i){return new s(t[4]<<24|t[5]<<16|t[6]<<8|t[7],t[0]<<24|t[1]<<16|t[2]<<8|t[3],i)}},function(t,i,e){"use strict";var s=this&&this.__assign||function(){return(s=Object.assign||function(t){for(var i,e=1,s=arguments.length;e<s;e++)for(var h in i=arguments[e])Object.prototype.hasOwnProperty.call(i,h)&&(t[h]=i[h]);return t}).apply(this,arguments)},h=this&&this.__importStar||function(t){if(t&&t.__esModule)return t;var i={};if(null!=t)for(var e in t)Object.hasOwnProperty.call(t,e)&&(i[e]=t[e]);return i.default=t,i};Object.defineProperty(i,"__esModule",{value:!0});var r=h(e(0)),o=e(2),n={x:0,y:0},u=function(){function t(t,i){var e=this;this.height=0,this.width=0,this.xPos=0,this.yPos=0,this.mousePos=s({},n),this.zoom=2.5,this.minzoom=.7,this.maxzoom=5,this.chunkbuffer=0,this.borderleft=70,this.bordertop=50,this.borderbottom=20,this.borderright=20,this.grabbed=!1,this.grabbedCoord=s({},n);var h=document.getElementById(t);if(!h)throw new Error("no canvas");this.canvas=h,this.canvas.setAttribute("style","cursor: grab; cursor: -webkit-grab");var u=this.canvas.getContext("2d");this.ctx=u||new CanvasRenderingContext2D,this.assertEventHandlers(),this.seed=i?r.fromString(i):new r.default(Date.now()),this.SCH=new o.SlimeChunkHandler(this.seed),this.update(),this.drawStaticUI(),this.vp=this.viewport(),this.chunkvp=this.chunkviewport(),this.redraw(),this.canvas.onmousemove=function(t){e.mousePos={x:t.clientX,y:t.clientY},1===t.buttons?(e.xPos-=t.movementX,e.yPos-=t.movementY,e.redraw()):(e.clearfooter(),e.drawFooter())},this.canvas.onmousedown=function(t){var i=e.getMapCoord(e.mousePos);i&&(e.grabbed=!0,e.canvas.setAttribute("style","cursor: grabbing; cursor: -webkit-grabbing"),e.grabbedCoord=i)},this.canvas.onmouseup=function(t){e.canvas.setAttribute("style","cursor: grab; cursor: -webkit-grab"),e.grabbed=!1}}return t.prototype.gotoCoordinate=function(t){this.xPos=t.x*this.zoom,this.yPos=t.y*this.zoom,this.redraw()},t.prototype.assertEventHandlers=function(){var t=this,i=/Firefox/i.test(navigator.userAgent)?"DOMMouseScroll":"mousewheel",e=function(i){return t.onscroll(i)};this.canvas.attachEvent?this.canvas.attachEvent("on"+i,e):this.canvas.addEventListener&&this.canvas.addEventListener(i,e,!1)},t.prototype.onscroll=function(t){if(this.getMapCoord(this.mousePos)){t.preventDefault();var i=.2;this.zoom<2&&(i/=2),t.wheelDelta<0?i*=-1:t.detail<0&&(i*=-1),this.zoom+i>=this.minzoom&&this.zoom+i<=this.maxzoom&&(this.xPos+=this.xPos/this.zoom*i,this.yPos+=this.yPos/this.zoom*i,this.zoom+=i,this.redraw())}},t.prototype.chunkviewport=function(){return{x1:Math.floor(this.vp.x1/16)-this.chunkbuffer,y1:Math.floor(this.vp.y1/16)-this.chunkbuffer,x2:Math.ceil(this.vp.x2/16)+this.chunkbuffer,y2:Math.ceil(this.vp.y2/16)+this.chunkbuffer}},t.prototype.update=function(){this.vp=this.viewport(),this.width=this.canvas.width,this.height=this.canvas.height},t.prototype.drawFooter=function(){var t=this.getMapCoord(this.mousePos);if(t){this.ctx.font="15px MyriadPro sans-serif",this.ctx.fillStyle="#000000",this.ctx.fillText("X: "+t.x.toFixed(0)+"\t Z: "+t.y.toFixed(0),this.borderleft,this.height-this.borderbottom+15);var i=s({},n);i.x=Math.floor(t.x/16),i.y=Math.floor(t.y/16);var e=this.SCH.isSlimeChunk(i)?"ja":"nein";this.ctx.fillText("Slimes: "+e,this.borderleft+200,this.height-this.borderbottom+15);var h=s({},i);h.x*=16,h.y*=16;var r=s({},h);r.x+=15,r.y+=15,this.ctx.textAlign="end",this.ctx.fillText("Chunk: ( "+i.x+" / "+i.y+" )  im Bereich von: ( "+h.x+" / "+h.y+")  bis: ( "+r.x+" / "+r.y+" )",this.width-this.borderright,this.height-this.borderbottom+15),this.ctx.textAlign="start"}},t.prototype.clearfooter=function(){this.ctx.fillStyle="#CED4DE",this.ctx.fillRect(this.borderleft-1,this.height-this.borderbottom,this.width-this.borderleft,this.borderbottom)},t.prototype.redraw=function(){this.vp=this.viewport(),this.ctx.fillStyle="#e0e0e0";this.vp;var t=function(t){return{p1:{x:t.x1,y:t.y1},p2:{x:t.x2,y:t.y2}}}(this.vp),i=t.p1,e=t.p2;i=this.getAbsCoord(i,!0),e=this.getAbsCoord(e,!0),this.ctx.fillRect(i.x,i.y,e.x-i.x,e.y-i.y),this.updateSlimeVP(),this.drawSlimeChunks(),this.drawStaticUI(),this.drawUI(),this.drawGrid(),this.clearBorderRight(),this.clearfooter()},t.prototype.updateSlimeVP=function(){JSON.stringify(this.chunkvp)!==JSON.stringify(this.chunkviewport())&&(this.chunkvp=this.chunkviewport())},t.prototype.drawSlimeChunks=function(){this.ctx.fillStyle="#44dd55";for(var t=this.chunkvp.x1;t<this.chunkvp.x2;t++)for(var i=this.chunkvp.y1;i<this.chunkvp.y2;i++)if(this.SCH.isSlimeChunk({x:t,y:i})){var e={x:t,y:i};e.x*=16,e.y*=16;var s=this.getAbsCoord(e);s?this.ctx.fillRect(s.x+1,s.y+1,16*this.zoom-2,16*this.zoom-2):(s=this.getAbsCoord({x:e.x+16,y:e.y+16}))&&this.ctx.fillRect(s.x-16*this.zoom,s.y-16*this.zoom,16*this.zoom-2,16*this.zoom-2)}},t.prototype.drawUI=function(){var t=16;this.zoom<2&&(t*=2),this.zoom<.9&&(t*=2),this.ctx.font="12px MyriadPro",this.ctx.fillStyle="#000000";for(var i=Math.ceil(this.vp.x1/t);i<=Math.floor(this.vp.x2/t);i++){var e={x:s=i*t,y:this.vp.y1};e=this.getAbsCoord(e,!0),this.ctx.fillText(s+"",e.x-3*s.toString().length,this.bordertop-5)}for(i=Math.ceil(this.vp.y1/t);i<=Math.floor(this.vp.y2/t);i++){var s=i*t;e={x:this.vp.x1,y:s};e=this.getAbsCoord(e,!0),this.ctx.fillText(s+"",this.borderleft-30,e.y+4)}},t.prototype.drawStaticUI=function(){this.ctx.fillStyle="#CED4DE",this.ctx.fillRect(0,0,this.width,this.bordertop),this.ctx.fillRect(0,0,this.borderleft,this.height),this.ctx.lineWidth=1,this.ctx.beginPath(),this.ctx.fillStyle="#000000",this.ctx.strokeStyle="#000000",this.ctx.moveTo(this.width-this.borderright,this.bordertop-1),this.ctx.lineTo(this.borderleft-1,this.bordertop-1),this.ctx.lineTo(this.borderleft-1,this.height-this.borderbottom),this.ctx.stroke(),this.ctx.closePath(),this.ctx.strokeStyle="#333333",this.ctx.fillStyle="#333333",this.ctx.lineWidth=.7,this.ctx.beginPath(),this.ctx.moveTo(15,5),this.ctx.lineTo(5,30),this.ctx.lineTo(15,20),this.ctx.stroke(),this.ctx.closePath(),this.ctx.beginPath(),this.ctx.moveTo(15,20),this.ctx.lineTo(25,30),this.ctx.lineTo(15,5),this.ctx.fill(),this.ctx.stroke(),this.ctx.closePath(),this.ctx.font="15px MyriadPro sans-serif",this.ctx.fillText("N",10,40),this.ctx.fillText("Seed: "+this.seed.toString(),40,20),this.ctx.font="20px MyriadPro";var t=this.borderleft+(this.width-this.borderleft-this.borderright)/2;this.ctx.fillText("X",t-10,20),this.ctx.lineWidth=.4,this.ctx.beginPath(),this.ctx.moveTo(t+5,13),this.ctx.lineTo(t+17,13),this.ctx.lineTo(t+14,10),this.ctx.stroke(),this.ctx.moveTo(t+17,13),this.ctx.lineTo(t+14,16),this.ctx.stroke(),this.ctx.closePath();var i=this.bordertop+(this.height-this.bordertop-this.borderbottom)/2;this.ctx.fillText("Z",7.5,i-5),this.ctx.lineWidth=.4,this.ctx.beginPath(),this.ctx.moveTo(13,i),this.ctx.lineTo(13,i+12),this.ctx.lineTo(10,i+9),this.ctx.stroke(),this.ctx.moveTo(13,i+12),this.ctx.lineTo(16,i+9),this.ctx.stroke(),this.ctx.closePath()},t.prototype.drawGrid=function(){this.ctx.strokeStyle="#000000";for(var t=Math.ceil(this.vp.x1/16);t<=Math.floor(this.vp.x2/16);t++){this.ctx.lineWidth=0===t?.8:.5;var i={x:e=16*t,y:this.vp.y1};i=this.getAbsCoord(i,!0),this.ctx.beginPath(),this.ctx.moveTo(i.x,this.bordertop),this.ctx.lineTo(i.x,this.height-this.borderbottom),this.ctx.stroke(),this.ctx.closePath()}for(t=Math.ceil(this.vp.y1/16);t<=Math.floor(this.vp.y2/16);t++){this.ctx.lineWidth=0===t?.8:.5;var e=16*t;i={x:this.vp.x1,y:e};i=this.getAbsCoord(i,!0),this.ctx.beginPath(),this.ctx.moveTo(this.borderleft,i.y),this.ctx.lineTo(this.width-this.borderright,i.y),this.ctx.stroke(),this.ctx.closePath()}},t.prototype.clearBorderRight=function(){this.ctx.fillStyle="#CED4DE",this.ctx.fillRect(this.width-this.borderright,0,this.borderright,this.height)},t.prototype.isInVP=function(t){return t.x>=this.vp.x1&&t.x<=this.vp.x2&&t.y>=this.vp.y1&&t.y<=this.vp.y2},t.prototype.isOverMap=function(t){return t.x>=this.borderleft&&t.x<=this.width-this.borderright&&t.y>=this.bordertop&&t.y<=this.height-this.borderbottom},t.prototype.getAbsCoord=function(t,i){if(void 0===i&&(i=!1),this.isInVP(t)||i){var e=s({},n);return e.x=(Math.floor(t.x)-this.vp.x1)*this.zoom+this.borderleft,e.y=(Math.floor(t.y)-this.vp.y1)*this.zoom+this.bordertop,e}return!1},t.prototype.getMapCoord=function(t){if(this.isOverMap(t)){var i=s({},n);return i.x=Math.round((t.x-this.borderleft)/this.zoom),i.y=Math.round((t.y-this.bordertop)/this.zoom),i.x+=this.vp.x1,i.y+=this.vp.y1,i}return!1},t.prototype.viewport=function(){var t={},i=this.width-this.borderleft-this.borderright,e=this.height-this.bordertop-this.borderbottom;return t.x1=Math.ceil((this.xPos-i/2)/this.zoom),t.y1=Math.ceil((this.yPos-e/2)/this.zoom),t.x2=Math.floor((this.xPos+i/2)/this.zoom),t.y2=Math.floor((this.yPos+e/2)/this.zoom),t},t}();document.onreadystatechange=function(){"interactive"===document.readyState&&(window.sm=new u("slimemap-canvas"))}},function(t,i,e){"use strict";var s=this&&this.__importDefault||function(t){return t&&t.__esModule?t:{default:t}};Object.defineProperty(i,"__esModule",{value:!0});var h=s(e(0)),r=e(3),o=new h.default(4987142),n=new h.default(5947611),u=new h.default(4392871),a=new h.default(389711),l=new h.default(987234911),c=function(){function t(t){this.seed=t,this.cache={}}return t.prototype.isSlimeChunk=function(t){var i="["+t.x+","+t.y+"]";return void 0===this.cache[i]&&(this.cache[i]=d(t,this.seed)),this.cache[i]},t.prototype.updateSeed=function(t){this.seed=t,delete this.cache,this.cache={}},t}();function d(t,i){var e=t.x,s=t.y,h=o.multiply(e).multiply(e).add(n.multiply(e)).add(u.multiply(s).multiply(s)).add(a.multiply(s)).add(i).xor(l);return 0===new r.NSeededRandom(h).nextInt(10)}i.SlimeChunkHandler=c,i.isSlimeChunk=d},function(t,i,e){"use strict";var s=this&&this.__importStar||function(t){if(t&&t.__esModule)return t;var i={};if(null!=t)for(var e in t)Object.hasOwnProperty.call(t,e)&&(i[e]=t[e]);return i.default=t,i};Object.defineProperty(i,"__esModule",{value:!0});var h=s(e(0)),r=new h.default(3740067437,5),o=new h.default(11),n=new h.default(4294967295,65535),u=function(){function t(t){this.seed=this.initialScramble(t)}return t.prototype.initialScramble=function(t){return t.xor(r).and(n)},t.prototype.next=function(t){return this.seed=this.seed.multiply(r).add(o).and(n),this.seed.shiftRight(48-t)},t.prototype.nextInt=function(t){var i,e,s=new h.default(Math.abs(t));if(s.and(s.negate()).isZero())return s.multiply(this.next(31)).shiftRight(31).toInt();do{e=(i=this.next(31)).modulo(s)}while(i.sub(e).add(s.sub(h.ONE)).lessThan(h.ZERO));return e.toInt()},t}();i.NSeededRandom=u}]);