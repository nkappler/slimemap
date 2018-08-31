var SlimeMap = function () {
	var that = this;
	var height = 0;
	var width = 0;
	var xPos = 0;
	var yPos = 0;
	var mousePos = new Array(2);
	var zoom = 2.5;
	var minzoom = 0.7;
	var maxzoom = 5;
	var vp;
	var chunkbuffer = 3;
	var chunkvp;
	var slimechunks;
	var borderleft = 70;
	var bordertop = 50;
	var borderbottom = 20;
	var borderright = 20;
	var grabbed = false;
	var grabbedCoord = new Array(2);
	var canvas;
	var ctx = false;

	this.init = function (id) {
		initCanvas(id);
		update();
		drawStaticUI();
		vp = viewport();
		chunkvp = chunkviewport();
		initSlimeChunks();
		redraw();
	};

	function initCanvas(id) {
		canvas = document.getElementById(id);
		if (canvas.getContext) {
			ctx = canvas.getContext('2d');
		} else {
			alert("Dein Browser unterstützt diese Funktion noch nicht.\nBitte installiere die neueste Version von deinem Browser.");
		}
		assertEventHandlers();
	}

	function assertEventHandlers() {
		var mousewheelevt = (/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll" : "mousewheel"; //FF doesn't recognize mousewheel as of FF3.x

		if (canvas.attachEvent) //if IE (and Opera depending on user setting)
			canvas.attachEvent("on" + mousewheelevt, function (e) { onscroll(e); });
		else if (canvas.addEventListener) //WC3 browsers
			canvas.addEventListener(mousewheelevt, function (e) { onscroll(e); }, false);

		function onscroll(event) {
			if (getMapCoord(mousePos)) {
				event.preventDefault();
				var zoomfactor = 0.2;
				if (zoom < 2) zoomfactor /= 2;
				if (event.wheelDelta < 0) {
					zoomfactor *= - 1;
				}
				else if (event.detail < 0) {
					zoomfactor *= - 1;
				}
				if ((zoom + zoomfactor) >= minzoom && (zoom + zoomfactor) <= maxzoom) {
					zoom += zoomfactor;
					redraw();
				}
				onMouseMove();
			}
		}

		canvas.onmousemove = function (event) {
			mousePos[0] = event.layerX;
			mousePos[1] = event.layerY;
			onMouseMove();
		};

		canvas.onmousedown = function (event) {
			var vec = getMapCoord(mousePos);
			if (vec) {
				grabbed = true;
				canvas.setAttribute("style", "cursor: grabbing; cursor: -webkit-grabbing");
				grabbedCoord = vec;
			}
		};

		canvas.onmouseup = function (event) {
			canvas.setAttribute("style", "cursor: grab; cursor: -webkit-grab");
			grabbed = false;
		};
	}

	function chunkviewport() {
		var v = new Array(4);
		v[0] = Math.ceil(vp[0] / 16) - chunkbuffer;
		v[1] = Math.ceil(vp[1] / 16) - chunkbuffer;
		v[2] = Math.ceil(vp[2] / 16) + chunkbuffer;
		v[3] = Math.ceil(vp[3] / 16) + chunkbuffer;
		return v;
	}

	function isSlimeChunk(vec) {
		var xPos = vec[0];
		var zPos = vec[1];
		var tempseed = new bigInt("4987142").multiply(xPos).multiply(xPos);
		tempseed = tempseed.add(new bigInt("5947611").multiply(xPos));
		tempseed = tempseed.add(new bigInt("4392871").multiply(zPos).multiply(zPos));
		tempseed = tempseed.add(new bigInt("389711").multiply(zPos));
		tempseed = seed.add(tempseed);
		tempseed = tempseed.TwosCompXor(new bigInt("987234911"));

		var rnd = new seededRandom(tempseed.toString());
		return (rnd.nextInt(10) === 0);
		//see http://minecraft-de.gamepedia.com/Schleim?cookieSetup=true#Spawning_in_speziellen_Chunks
	}

	function update() {
		if (!ctx) return;
		vp = viewport();
		width = canvas.width;
		height = canvas.height;
	}

	function onMouseMove() {
		clearfooter();
		var vec = getMapCoord(mousePos);
		if (vec) {
			if (grabbed) {
				canvas.setAttribute("style", "cursor: grabbing; cursor: -webkit-grabbing");
				var offsetX = grabbedCoord[0] - xPos;
				var offsetY = grabbedCoord[1] - yPos;
				xPos = vec[0] - offsetX;
				yPos = vec[1] - offsetY;
				redraw();
			} else {
				canvas.setAttribute("style", "cursor: grab; cursor: -webkit-grab");
				ctx.font = "15px MyriadPro";
				ctx.fillStyle = "#000000";
				ctx.fillText("X: " + vec[0].toFixed(1) + "    Z: " + vec[1].toFixed(1), borderleft, height - borderbottom + 15);

				var Chunk = new Array(2);
				Chunk[0] = Math.floor(vec[0] / 16);
				Chunk[1] = Math.floor(vec[1] / 16);
				var Slimes = (slimechunks["[" + Chunk[0] + "," + Chunk[1] + "]"]) ? "ja" : "nein";
				ctx.fillText("Slimes: " + Slimes, borderleft + 200, height - borderbottom + 15);

				var From = new Array(2);
				From[0] = Chunk[0] * 16;
				From[1] = Chunk[1] * 16;
				var To = new Array(2);
				To[0] = (Chunk[0] + 1) * 16 - 1;
				To[1] = (Chunk[1] + 1) * 16 - 1;

				ctx.textAlign = "end";
				ctx.fillText("Chunk: ( " + Chunk[0] + " / " + Chunk[1] + " )  im Bereich von: ( " +
					From[0] + " / " + From[1] + ")  bis: ( " +
					To[0] + " / " + To[1] + " )", width - borderright, height - borderbottom + 15);
				ctx.textAlign = "start";
			}
		} else {
			canvas.setAttribute("style", "cursor: default");
		}
	}

	function clearfooter() {
		ctx.fillStyle = "#CED4DE";
		ctx.fillRect(borderleft, height - borderbottom, width - borderleft, borderbottom);
	}

	function redraw() {
		vp = viewport();


		//fill map
		ctx.fillStyle = "#e0e0e0";
		var p1 = new Array(2);
		var p2 = new Array(2);
		p1[0] = vp[0];
		p1[1] = vp[1];
		p2[0] = vp[2];
		p2[1] = vp[3];
		p1 = getAbsCoord(p1);
		p2 = getAbsCoord(p2);
		ctx.fillRect(p1[0], p1[1], p2[0] - p1[0], p2[1] - p1[1]);

		//UI
		drawUI();
		drawAxes();
		drawSlimeChunks();
		clearBorderRight();
		clearfooter();
		recalcSlimeChunks();
	}

	function recalcSlimeChunks() {
		if (JSON.stringify(chunkvp) != JSON.stringify(chunkviewport())) {
			var newChunkvp = chunkviewport();
			var top = chunkvp[1] - newChunkvp[1];
			var bottom = newChunkvp[3] - chunkvp[3];
			var left = chunkvp[0] - newChunkvp[0];
			var right = newChunkvp[2] - chunkvp[2];

			if (top > 0) {
				for (var i = 1; i <= top; i++) {
					//addRow( chunkvp[1] - i );
				}
			} else {
				for (var i = 0; i > top; i--) {
					removeRow(chunkvp[1] - i);
				}
			}

			if (bottom > 0) {
				for (var i = 1; i <= bottom; i++) {
					//addRow( chunkvp[3] + i );
				}
			} else {
				for (var i = 0; i > bottom; i--) {
					removeRow(chunkvp[3] + i);
				}
			}

			if (left > 0) {
				for (var i = 1; i <= left; i++) {
					//addColumn( chunkvp[0] - i );
				}
			} else {
				for (var i = 0; i > left; i--) {
					removeColumn(chunkvp[0] - i);
				}
			}

			if (right > 0) {
				for (var i = 1; i <= right; i++) {
					//addColumn( chunkvp[2] + i );
				}
			} else {
				for (var i = 0; i > right; i--) {
					removeColumn(chunkvp[2] + i);
				}
			}

			chunkvp = newChunkvp;
		}
	}

	function addRow(row) {
		var Cols = Math.abs(chunkvp[1]) + Math.abs(chunkvp[3]);
		for (var i = 0; i < Cols; i++) {
			var mapChunkPos = getMapChunkPos(new Array(i, 0));
			var isSC = isSlimeChunk(new Array(mapChunkPos[0], row));
			var hash = JSON.stringify(mapChunkPos);
			slimechunks[hash] = isSC;
		}
	}

	function removeRow(row) {
		var keys = Object.keys(slimechunks);
		for (i = 0; i < keys.length; i++) {
			var key = keys[i];
			if (key.indexOf("," + row + "]") != -1) delete slimechunks[key];
		}
	}

	function addColumn(col) {
		var Rows = Math.abs(chunkvp[0]) + Math.abs(chunkvp[2]);
		for (var i = 0; i < Rows; i++) {
			var mapChunkPos = getMapChunkPos(new Array(0, i));
			var isSC = isSlimeChunk(new Array(col, mapChunkPos[1]));
			var hash = JSON.stringify(mapChunkPos);
			slimechunks[hash] = isSC;
		}
	}

	function removeColumn(col) {
		var keys = Object.keys(slimechunks);
		for (i = 0; i < keys.length; i++) {
			var key = keys[i];
			if (key.indexOf("[" + col + ",") != -1) delete slimechunks[key];
		}
	}

	function initSlimeChunks() {
		var ChunksCountX = Math.abs(chunkvp[0]) + Math.abs(chunkvp[2]);
		var ChunksCountZ = Math.abs(chunkvp[1]) + Math.abs(chunkvp[3]);

		slimechunks = new Object({});

		for (var i = 0; i < ChunksCountX; i++) {
			for (var j = 0; j < ChunksCountZ; j++) {
				var mapChunkPos = getMapChunkPos(new Array(i, j));
				var isSC = isSlimeChunk(mapChunkPos);
				var hash = JSON.stringify(mapChunkPos);

				slimechunks[hash] = isSC;
			}
		}
	}

	function getMapChunkPos(vec) {
		vec[0] += chunkvp[0];
		vec[1] += chunkvp[1];
		return vec;
	}

	function drawSlimeChunks() {
		ctx.fillStyle = "#44dd55";

		var ChunksCountX = Math.abs(chunkvp[0]) + Math.abs(chunkvp[2]);
		var ChunksCountZ = Math.abs(chunkvp[1]) + Math.abs(chunkvp[3]);

		for (var i = 0; i < ChunksCountX; i++) {
			for (var j = 0; j < ChunksCountZ; j++) {
				var mapChunkPos = getMapChunkPos(new Array(i, j));
				var key = JSON.stringify(mapChunkPos);
				if (slimechunks[key] === undefined) slimechunks[key] = isSlimeChunk(mapChunkPos);
				if (slimechunks[key]) {
					var vec = mapChunkPos;
					vec[0] *= 16;
					vec[1] *= 16;

					var vec2 = getAbsCoord(vec);
					if (vec2)
						ctx.fillRect(vec2[0] + 1, vec2[1] + 1, 16 * zoom - 2, 16 * zoom - 2);
					else {
						vec2 = getAbsCoord(vec, true);
						var x = vec2[0] + 1;
						var z = vec2[1] + 1;
						var width = (16 * zoom) - 2;
						var height = (16 * zoom) - 2;
						var paint = false;

						if (x < borderleft && x + width >= borderleft) {
							width += x - borderleft;
							x = borderleft;
							paint = true;
						}
						if (z < bordertop && z + height >= bordertop) {
							height += z - bordertop;
							z = bordertop;
							paint = true;
						}

						if (x + width < borderleft || z + height < bordertop) paint = false;

						if (paint) ctx.fillRect(x, z, width, height);
					}

				}
			}
		}
	}

	function drawUI() {
		clearAxes();
		var factor = 16;
		if (zoom < 2) factor *= 2;
		if (zoom < 0.9) factor *= 2;
		ctx.font = "12px MyriadPro";
		ctx.fillStyle = "#000000";
		//X
		for (var i = Math.ceil(vp[0] / factor); i <= Math.floor(vp[2] / factor); i++) {
			var mark = i * factor;
			var pos = new Array(mark, vp[1]);
			pos = getAbsCoord(pos);
			ctx.fillText(mark, pos[0] - (mark.toString().length * 3), bordertop - 5);
		}
		//Z
		for (i = Math.ceil(vp[1] / factor); i <= Math.floor(vp[3] / factor); i++) {
			var mark = i * factor;
			var pos = new Array(vp[0], mark);
			pos = getAbsCoord(pos);
			ctx.fillText(mark, borderleft - 30, pos[1] + 4);
		}
	}

	function drawStaticUI() {
		if (!ctx) return;
		//clear;
		ctx.fillStyle = "#CED4DE";
		ctx.fillRect(0, 0, width, height);


		//Border
		ctx.lineWidth = 1.0;
		ctx.beginPath();
		ctx.fillStyle = "#000000";
		ctx.strokeStyle = "#000000";
		ctx.moveTo(width - borderright, bordertop - 1);
		ctx.lineTo(borderleft - 1, bordertop - 1);
		ctx.lineTo(borderleft - 1, height - borderbottom);
		ctx.stroke();
		ctx.closePath();

		ctx.strokeStyle = "#333333";
		ctx.fillStyle = "#333333";
		//North
		ctx.lineWidth = 0.7;
		ctx.moveTo(15, 5);
		ctx.lineTo(5, 30);
		ctx.lineTo(15, 20);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(15, 20);
		ctx.lineTo(25, 30);
		ctx.lineTo(15, 5);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();
		ctx.font = "15px MyriadPro";
		ctx.fillText("N", 10, 40);
		ctx.fillText("Seed: " + seed.toString(), 40, 20);

		//Axisnames
		//X
		ctx.font = "20px MyriadPro";
		var mapwidthcenter = borderleft + ((width - borderleft - borderright) / 2);
		ctx.fillText("X", mapwidthcenter - 10, 20);
		ctx.lineWidth = 0.4;
		ctx.beginPath();
		ctx.moveTo(mapwidthcenter + 5, 13);
		ctx.lineTo(mapwidthcenter + 17, 13);
		ctx.lineTo(mapwidthcenter + 14, 10);
		ctx.stroke();
		ctx.moveTo(mapwidthcenter + 17, 13);
		ctx.lineTo(mapwidthcenter + 14, 16);
		ctx.stroke();
		ctx.closePath();
		//Z
		var mapheightcenter = bordertop + ((height - bordertop - borderbottom) / 2);
		ctx.fillText("Z", 7.5, mapheightcenter - 5);
		ctx.lineWidth = 0.4;
		ctx.beginPath();
		ctx.moveTo(13, mapheightcenter);
		ctx.lineTo(13, mapheightcenter + 12);
		ctx.lineTo(10, mapheightcenter + 9);
		ctx.stroke();
		ctx.moveTo(13, mapheightcenter + 12);
		ctx.lineTo(16, mapheightcenter + 9);
		ctx.stroke();
		ctx.closePath();
	}

	function drawAxes() {
		var factor = 16;
		ctx.strokeStyle = "#000000";
		//X
		for (var i = Math.ceil(vp[0] / factor); i <= Math.floor(vp[2] / factor); i++) {
			if (i === 0) ctx.lineWidth = 0.8;
			else ctx.lineWidth = 0.5;
			var mark = i * factor;
			var pos = new Array(mark, vp[1]);
			pos = getAbsCoord(pos);
			ctx.beginPath();
			ctx.moveTo(pos[0], bordertop);
			ctx.lineTo(pos[0], height - borderbottom);
			ctx.stroke();
			ctx.closePath();
		}
		//Z
		for (i = Math.ceil(vp[1] / factor); i <= Math.floor(vp[3] / factor); i++) {
			if (i === 0) ctx.lineWidth = 0.8;
			else ctx.lineWidth = 0.5;
			var mark = i * factor;
			var pos = new Array(vp[0], mark);
			pos = getAbsCoord(pos);
			ctx.beginPath();
			ctx.moveTo(borderleft, pos[1]);
			ctx.lineTo(width - borderright, pos[1]);
			ctx.stroke();
			ctx.closePath();
		}
	}

	function clearAxes() {
		ctx.fillStyle = "#CED4DE";
		ctx.fillRect(30, bordertop - 22, width - 30, 20);
		ctx.fillRect(borderleft - 32, 40, 30, height - 40);
	}

	function clearBorderRight() {
		ctx.fillStyle = "#CED4DE";
		ctx.fillRect(width - borderright, 0, borderright, height);
	}

	function isInVP(vec) {
		return (vec[0] >= vp[0] && vec[0] <= vp[2] &&
			vec[1] >= vp[1] && vec[1] <= vp[3]);
	}

	function isOverMap(vec) {
		return (vec[0] >= borderleft && vec[0] <= (width - borderright) &&
			vec[1] >= bordertop && vec[1] <= (height - borderbottom));
	}

	function getAbsCoord(vec, ignoreBorder) {
		if (isInVP(vec) || ignoreBorder) {
			var vec2 = new Array(2);
			vec2[0] = ((Math.floor(vec[0]) - vp[0]) * zoom) + borderleft;
			vec2[1] = ((Math.floor(vec[1]) - vp[1]) * zoom) + bordertop;
			return vec2;
		} else return false;
	}

	function getMapCoord(vec) {
		if (isOverMap(vec)) {
			var vec2 = new Array(2);
			vec2[0] = (vec[0] - borderleft) / zoom;
			vec2[1] = (vec[1] - bordertop) / zoom;
			vec2[0] += vp[0];
			vec2[1] += vp[1];
			return vec2;
		} else return false;
	}

	function viewport() {
		var v = new Array(4);
		var totalwidth = (width - borderleft) - borderright;
		var totalheight = height - bordertop - borderbottom;
		v[0] = -(Math.ceil((xPos + (totalwidth / 2)) / zoom));
		v[1] = -(Math.ceil((yPos + (totalheight / 2)) / zoom));
		v[2] = -(Math.floor((xPos - (totalwidth / 2)) / zoom));
		v[3] = -(Math.floor((yPos - (totalheight / 2)) / zoom));
		return v;
	}

};

function onload() {
	if (document.readyState == "interactive") {
		var sm = new SlimeMap();
		sm.init("slimemap-canvas");
	}
};

document.onreadystatechange = onload;
