class HanulseBoardView {
	$parent = null;
	$content = null;

	width = null;
	height = null;
	aspectRatio = null;
	parentWidth = null;
	parentHeight = null;
	realWidth = null;
	realHeight = null;
	sizeRatio = 1;
	needToRefreshItems = false;

	nextItemId = 0;
	nextZIndex = 0;

	/*
		{
			type: "color" | "image"
			value: ColorString | ImageUrlString
		}
	*/
	background = null;
	/*
		{
			id: number,
			type: "image" | "text",
			value: ImageUrlString | TextString,
			x: number,
			y: number,
			w: number,
			h: number,
			radian: number,
			zIndex: number,
			resizable: boolean,
			editable: boolean,
			style: {
				color: ColorString,
				backgroundColor: ColorString,
				fontSize: number,
				fontFamily: FontNameString,
				isFontBold: boolean,
				isFontItalic: boolean,
			},
		}[];
	*/
	items = [];

	// Item control variables
	transformMode = null;
	downedItem = null;
	$downedItem = null;
	lastPointerX = null;
	lastPointerY = null;

	// Drawing variables
	/*
		{
			strokeColor: ColorString,
			strokeWidth: number,
		}
	*/
	drawingStyle = null;
	isDrawingStarted = false;
	drawingPath = null;
	lastDrawingX = null;
	lastDrawingY = null;
	drawingCanvas = null;
	drawingContext = null;

	/*
		options: {
			width: number,
			height: number,
		}
	*/
	constructor($parent, options) {
		this.$parent = $parent;

		this.width = options.width || $parent.width();
		this.height = options.height || $parent.height();
		this.aspectRatio = options.width / options.height;

		this.parentWidth = $parent.width();
		this.parentHeight = $parent.height();
		this.setParentSize(this.parentWidth, this.parentHeight);

		this.$content = $("<div>").css({ position: "relative", width: this.realWidth + "px", height: this.realHeight + "px", overflow: "hidden" });
		this.$parent.append(this.$content);
		
		this.background = { type: "color", value: "white" };
		this.$content.css({ backgroundColor: "white" });

		this.$parent.on("mousedown", (event) => {
			this._onItemMoveStart(event);
			this._onDrawingStart(event);
		});
		this.$parent.on("mousemove", (event) => {
			this._onItemMove(event);
			this._onDrawing(event);
		});
		this.$parent.on("mouseup", (event) => {
			this._onItemMoveEnd(event);
			this._onDrawingEnd(event);
		});
		this.$parent.on("touchstart", (event) => {
			this._onItemMoveStart(event);
			this._onDrawingStart(event);
		});
		this.$parent.on("touchmove", (event) => {
			this._onItemMove(event);
			this._onDrawing(event);
		});
		this.$parent.on("touchend", (event) => {
			this._onDrawingEnd(event);
		});
		setInterval(() => {
			var parentWidth = $parent.width();
			var parentHeight = $parent.height();
			if (parentWidth == this.parentWidth && parentHeight == this.parentHeight) {
				if (this.needToRefreshItems) {
					this.refreshContent(true);
					this.needToRefreshItems = false;
				}
				return;
			}

			this.setParentSize(parentWidth, parentHeight);
			this.needToRefreshItems = true;

			console.log("Resized", this.parentWidth, this.parentHeight);
		}, 100);
	}

	setBackground(itemDescription) {
		if (itemDescription.type == "color") {
			this.background = itemDescription;
			this.$content.css({
				backgroundColor: itemDescription.value,
				backgroundImage: "",
			});
		} else if (itemDescription.type == "image") {
			this.background = itemDescription;
			this.$content.css({
				backgroundColor: "black",
				backgroundImage: "url(\"" + itemDescription.value + "\")",
				backgroundPosition: "center",
				backgroundSize: "cover",
				backgroundRepeat: "no-repeat",
			});
		} else if (itemDescription.type == "pattern") {
			this.background = itemDescription;
			this.$content.css({
				backgroundColor: "black",
				backgroundImage: "url(\"" + itemDescription.value + "\")",
				backgroundPosition: "center",
				backgroundSize: "auto",
				backgroundRepeat: "repeat",
			});
		}
	}

	setDrawerStyles(styles) {
		this.drawingStyle = styles;
	}

	setParentSize(parentWidth, parentHeight) {
		this.parentWidth = parentWidth;
		this.parentHeight = parentHeight;
		var parentAspectRatio = parentWidth / parentHeight;

		if (this.aspectRatio < parentAspectRatio) {
			this.realWidth = parentHeight * this.aspectRatio;
			this.realHeight = parentHeight;
		} else if (this.aspectRatio > parentAspectRatio) {
			this.realWidth = parentWidth;
			this.realHeight = parentWidth / this.aspectRatio;
		} else {
			this.realWidth = parentWidth;
			this.realHeight = parentHeight;
		}
		this.sizeRatio = this.realWidth / this.width;
	}

	refreshContent(animate) {
		if (animate) {
			this.$content.stop().animate({
				width: this.realWidth + "px",
				height: this.realHeight + "px",
			}, { duration: 100 });
		} else {
			this.$content.css({
				width: this.realWidth + "px",
				height: this.realHeight + "px",
			});
		}

		for (var i = 0; i < this.items.length; i++) {
			var item = this.items[i];
			var $item = this.$content.find("[data-id=" + item.id + "]");
			if (animate) {
				$item.stop().animate({
					width: item.width * this.sizeRatio + "px",
					height: item.height * this.sizeRatio + "px",
					left: item.x * this.sizeRatio + "px",
					top: item.y * this.sizeRatio + "px",
				}, { duration: 100 });
			} else {
				$item.css({
					width: item.width * this.sizeRatio + "px",
					height: item.height * this.sizeRatio + "px",
					left: item.x * this.sizeRatio + "px",
					top: item.y * this.sizeRatio + "px",
				});
			}
		}
	}

	createItem(itemDescription) {
		var item = this._newItem(itemDescription);
		var $item = this._newItemElement(item);

		this.items.push(item);
		this.$content.append($item);
		
		// Unselect
		$(".item").removeClass('selected');
		// Select Item
		$item.addClass('selected');
		$item.css({ zIndex: item.zIndex });
	}

	deleteItemById(id) {
		var index = this.items.findIndex((item) => item.id == id);
		if (index > 0) {
			this.items.splice(index, 1);
		}

		var $item = this.$content.find("[data-id=" + id + "]");
		$item.remove();
	}

	cloneItemById(id) {
		var item = this.items.find((item) => item.id == id);
		if (item == null) {
			return;
		}

		var clonedItem = this._newItem({
			... item,
			x: item.x + 10,
			y: item.y + 10,
		});
		var $clonedItem = this._newItemElement(clonedItem);

		this.items.push(clonedItem);
		this.$content.append($clonedItem);

		// Unselect
		$(".item").removeClass('selected');
		// Select Item
		$clonedItem.addClass('selected');
	}

	toImageBlob(callback) {
		this._loadImages((imagesByUrl) => {
			var canvas = document.createElement("canvas");
			var width = canvas.width = this.width;
			var height = canvas.height = this.height;

			var context = canvas.getContext("2d");
			if (this.background.type == "color") {
				context.fillStyle = this.background.value;
				context.fillRect(0, 0, width, height);
			} else if (this.background.type == "image") {
				var backgroundImage = imagesByUrl['background'];
				var backgroundOffsetX;
				var backgroundOffsetY;
				var backgroundWidth;
				var backgroundHeight;
				if (width / height < backgroundImage.width / backgroundImage.height) {
					backgroundWidth = width * (backgroundImage.width / backgroundImage.height);
					backgroundHeight = height;
					backgroundOffsetX = (width - backgroundWidth) * 0.5;
					backgroundOffsetY = 0;
				} else {
					backgroundWidth = width;
					backgroundHeight = height / (backgroundImage.width / backgroundImage.height);
					backgroundOffsetX = 0;
					backgroundOffsetY = (height - backgroundHeight) * 0.5;
				}
				context.drawImage(backgroundImage, backgroundOffsetX, backgroundOffsetY, backgroundWidth, backgroundHeight);
			} else if (this.background.type == "pattern") {
				// TODO
			}

			this.items.sort((a, b) => a.zIndex > b.zIndex? 1: -1);
			this.items.forEach(item => {
				if (item.type == "image") {
					var itemImage = imagesByUrl[item.id];
					context.save();
					context.translate(item.x + item.width * 0.5, item.y + item.height * 0.5);
					context.rotate(item.radian);
					context.drawImage(itemImage, -item.width * 0.5, -item.height * 0.5, item.width, item.height);
					context.restore();
				} else if (item.type == "text") {
					context.save();
					context.translate(item.x + item.width * 0.5, item.y + item.height * 0.5);
					context.rotate(item.radian);
					// Draw background
					if (item.style) {
						context.fillStyle = item.style.backgroundColor;
						context.fillRect(-item.width * 0.5, -item.height * 0.5, item.width, item.height);
					}
					// Draw text
					if (item.style) {
						context.font = `${item.style.isFontItalic? "italic": ""} ${item.style.isFontBold? "bold": ""} ${item.style.fontSize}px ${item.style.fontFamily}`
						context.fillStyle = item.style.color;
					} else {
						context.fillStyle = "black";
					}
					context.textBaseline = "top";
					context.textAlign = "left";
					context.fillText(item.value, -item.width * 0.5, -item.height * 0.5);
					context.restore();
				}
			});

			// Preview image
			// var dataUrl = canvas.toDataURL("image/png");
			// var newTab = window.open('about:blank', '_blank');
			// newTab.document.write("<img src='" + dataUrl + "' alt='from canvas'/>");

			canvas.toBlob((blob) => {
				callback && callback(blob);
			}, "image/png");
		});
	}
	
	_loadImages(callback) {
		var imagesByUrl = {};

		var imageList = [];
		if (this.background.type == "image" || this.background.type == "pattern") {
			imageList.push({ id: 'background', url: this.background.value });
		}

		this.items.forEach(item => {
			if (item.type == "image") {
				imageList.push({ id: item.id, url: item.value });
			}
		})

		var loadNextImage = (imageItem) => {
			if (imageItem == null) {
				return callback && callback(imagesByUrl);
			}

			var image = new Image();
			image.onload = () => {
				imagesByUrl[imageItem.id] = image;
				loadNextImage(imageList.shift());
			};
			image.src = imageItem.url;
		};

		loadNextImage(imageList.shift());
	}

	_newItem(itemDescription) {
		if (itemDescription.type == "image") {
			return {
				id: this.nextItemId++,
				type: "image",
				value: itemDescription.value,
				x: itemDescription.x ?? (this.width - itemDescription.width) * 0.5,
				y: itemDescription.y ?? (this.height - itemDescription.height) * 0.5,
				width: itemDescription.width,
				height: itemDescription.height,
				radian: itemDescription.radian ?? 0,
				zIndex: this.nextZIndex++,
				resizable: true,
				editable: false,
			};
		} else if(itemDescription.type == "text") {
			return {
				id: this.nextItemId++,
				type: "text",
				value: itemDescription.value,
				x: itemDescription.x ?? (this.width - itemDescription.width) * 0.5,
				y: itemDescription.y ?? (this.height - itemDescription.height) * 0.5,
				width: itemDescription.width,
				height: itemDescription.height,
				radian: itemDescription.radian ?? 0,
				zIndex: this.nextZIndex++,
				resizable: false,
				editable: true,
				style: itemDescription.style,
			};
		}
	}

	_newItemElement(item) {
		var $e = $("<div class=\"item\">");
		$e.attr("data-id", item.id);

		if (item.type == "image") {
			var $image = $("<img data-type=\"image\">").attr("src", item.value);
			$e.append($("<div class=\"content\">").append($image));
		} else {
			var $text = $("<span data-type=\"text\">").text(item.value);
			$e.append($("<div class=\"content\">").append($text));
			
			if (item.style) {
				$text.css({
					color: item.style.color,
					backgroundColor: item.style.backgroundColor,
					fontSize: item.style.fontSize,
					fontFamily: item.style.fontFamily,
					fontWeight: item.style.isFontBold? "bold": "normal",
					fontStyle: item.style.isFontItalic? "italic": "normal",
					whiteSpace: "nowrap",
				});
			}
		}

		var $frame = $("<div class=\"frame\" data-transform-mode=\"move\">");
		if (item.resizable) {
			var $frameEdgeNW = $("<div class=\"edge-nw\" data-transform-mode=\"resize-nw\">");
			var $frameEdgeNE = $("<div class=\"edge-ne\" data-transform-mode=\"resize-ne\">");
			var $frameEdgeSW = $("<div class=\"edge-sw\" data-transform-mode=\"resize-sw\">");
			var $frameEdgeSE = $("<div class=\"edge-se\" data-transform-mode=\"resize-se\">");
			var $frameEdgeN = $("<div class=\"edge-n\" data-transform-mode=\"resize-n\">");
			var $frameEdgeS = $("<div class=\"edge-s\" data-transform-mode=\"resize-s\">");
			var $frameEdgeW = $("<div class=\"edge-w\" data-transform-mode=\"resize-w\">");
			var $frameEdgeE = $("<div class=\"edge-e\" data-transform-mode=\"resize-e\">");
			$frame.append($frameEdgeNW);
			$frame.append($frameEdgeNE);
			$frame.append($frameEdgeSW);
			$frame.append($frameEdgeSE);
			$frame.append($frameEdgeN);
			$frame.append($frameEdgeS);
			$frame.append($frameEdgeW);
			$frame.append($frameEdgeE);
		}

		var $frameRotate = $("<div class=\"function rotate\" data-transform-mode=\"rotate\">");
		var $frameDelete = $("<div class=\"function delete\" data-transform-mode=\"delete\">").click(() => this.deleteItemById(item.id));
		var $frameClone = $("<div class=\"function clone\" data-transform-mode=\"clone\">").click(() => this.cloneItemById(item.id));
		$frame.append($frameRotate);
		$frame.append($frameDelete);
		$frame.append($frameClone);

		if (item.editable) {
			var $frameEdit = $("<div class=\"function edit\" data-transform-mode=\"edit\">").click(() => {
				this._onBeginEdit && this._onBeginEdit(item);
			});
			$frame.append($frameEdit);
		}

		$e.width(item.width * this.sizeRatio);
		$e.height(item.height * this.sizeRatio);
		$e.css({ left: item.x * this.sizeRatio, top: item.y * this.sizeRatio, zIndex: item.zIndex });

		$e.css({ transform: "rotate(" + item.radian + "rad)" });
		$e.find('.function').css({ transform: "rotate(" + -item.radian + "rad)" });

		$e.append($frame);

		return $e;
	}

	_pointToRadian(x, y) {
		return Math.atan2(y, x);
	}

	_onItemMoveStart(event) {
		if (event.type == "touchstart") {
			event.preventDefault(); //for Mobile
		}

		var $target = $(event.target);

		var $item = $target.parents('[data-id]');
		var itemId = $item.attr("data-id");
		var item = this.items.find(item => item.id == itemId);
		if (item == null) {
			// Unselect
			$(".item").removeClass('selected');
			this.transformMode = null;
			this.downedItem = null;
			this.$downedItem = null;
			return;
		}

		if (this.downedItem != item) {
			// Unselect
			$(".item").removeClass('selected');
			// Select Item
			item.zIndex = this.nextZIndex++;
			$item.addClass('selected');
			$item.css({ zIndex: item.zIndex });
		}

		var mode = $target.attr("data-transform-mode");
		if (mode == null) {
			this.transformMode = null;
			return;
		}

		if (["delete", "clone", "edit"].includes(mode)) {
			$target.click();
			this.transformMode = null;
			return;
		}

		this.transformMode = mode;
		this.downedItem = item;
		this.$downedItem = $item;

		var pointer = event.targetTouches? event.targetTouches[0] : event;
		this.lastPointerX = pointer.pageX;
		this.lastPointerY = pointer.pageY;

		console.log('Start Transform', item.id, mode);
	}

	_onItemMove(event) {
		if (event.type == "touchstart") {
			event.preventDefault(); //for Mobile
		}

		if (this.downedItem == null) {
			return;
		}

		if (this.transformMode == null) {
			return;
		}

		var pointer = event.targetTouches? event.targetTouches[0] : event;
		var pointerX = pointer.pageX;
		var pointerY = pointer.pageY;

		if (this.transformMode == 'move') {
			this.downedItem.x += (pointerX - this.lastPointerX) / this.sizeRatio;
			this.downedItem.y += (pointerY - this.lastPointerY) / this.sizeRatio;
			this.$downedItem.css({ left: this.downedItem.x * this.sizeRatio, top: this.downedItem.y * this.sizeRatio });
		} else if (this.transformMode == 'rotate') {
			var offset = this.$content.offset();
			var itemCenterX = (this.downedItem.x + this.downedItem.width * 0.5) * this.sizeRatio + offset.left;
			var itemCenterY = (this.downedItem.y + this.downedItem.height * 0.5) * this.sizeRatio + offset.top;
			var lastRadian = this._pointToRadian(this.lastPointerX - itemCenterX, this.lastPointerY - itemCenterY);
			var radian = this._pointToRadian(pointerX - itemCenterX, pointerY - itemCenterY);
			this.downedItem.radian += radian - lastRadian;
			this.$downedItem.css({ transform: "rotate(" + this.downedItem.radian + "rad)" });
			this.$downedItem.find('.function').css({ transform: "rotate(" + -this.downedItem.radian + "rad)" })
		} else if (this.transformMode == "resize-nw") {
			var x = (pointerX - this.lastPointerX) / this.sizeRatio;
			var y = (pointerY - this.lastPointerY) / this.sizeRatio;
			var cos = Math.cos(this.downedItem.radian);
			var sin = Math.sin(this.downedItem.radian);
			var rcos = cos;
			var rsin = -sin;
			var rotatedX = x * rcos - y * rsin;
			var rotatedY = x * rsin + y * rcos;

			this.downedItem.x += rotatedX;
			this.downedItem.y += rotatedY;
			this.downedItem.width -= rotatedX;
			this.downedItem.height -= rotatedY;
			
			this.downedItem.x -= (rotatedX - x) / 2;
			this.downedItem.y -= (rotatedY - y) / 2;
			
			this.$downedItem.width(this.downedItem.width * this.sizeRatio);
			this.$downedItem.height(this.downedItem.height * this.sizeRatio);
			this.$downedItem.css({ left: this.downedItem.x * this.sizeRatio, top: this.downedItem.y * this.sizeRatio });
		} else if (this.transformMode == "resize-ne") {
			var x = (pointerX - this.lastPointerX) / this.sizeRatio;
			var y = (pointerY - this.lastPointerY) / this.sizeRatio;
			var cos = Math.cos(this.downedItem.radian);
			var sin = Math.sin(this.downedItem.radian);
			var rcos = cos;
			var rsin = -sin;
			var rotatedX = x * rcos - y * rsin;
			var rotatedY = x * rsin + y * rcos;

			this.downedItem.y += rotatedY;
			this.downedItem.width += rotatedX;
			this.downedItem.height -= rotatedY;
			
			this.downedItem.x -= (rotatedX - x) / 2;
			this.downedItem.y -= (rotatedY - y) / 2;

			this.$downedItem.width(this.downedItem.width * this.sizeRatio);
			this.$downedItem.height(this.downedItem.height * this.sizeRatio);
			this.$downedItem.css({ left: this.downedItem.x * this.sizeRatio, top: this.downedItem.y * this.sizeRatio });
		} else if (this.transformMode == "resize-sw") {
			var x = (pointerX - this.lastPointerX) / this.sizeRatio;
			var y = (pointerY - this.lastPointerY) / this.sizeRatio;
			var cos = Math.cos(this.downedItem.radian);
			var sin = Math.sin(this.downedItem.radian);
			var rcos = cos;
			var rsin = -sin;
			var rotatedX = x * rcos - y * rsin;
			var rotatedY = x * rsin + y * rcos;

			this.downedItem.x += rotatedX;
			this.downedItem.width -= rotatedX;
			this.downedItem.height += rotatedY;
			
			this.downedItem.x -= (rotatedX - x) / 2;
			this.downedItem.y -= (rotatedY - y) / 2;

			this.$downedItem.width(this.downedItem.width * this.sizeRatio);
			this.$downedItem.height(this.downedItem.height * this.sizeRatio);
			this.$downedItem.css({ left: this.downedItem.x * this.sizeRatio, top: this.downedItem.y * this.sizeRatio });
		} else if (this.transformMode == "resize-se") {
			var x = (pointerX - this.lastPointerX) / this.sizeRatio;
			var y = (pointerY - this.lastPointerY) / this.sizeRatio;
			var cos = Math.cos(this.downedItem.radian);
			var sin = Math.sin(this.downedItem.radian);
			var rcos = cos;
			var rsin = -sin;
			var rotatedX = x * rcos - y * rsin;
			var rotatedY = x * rsin + y * rcos;

			this.downedItem.width += rotatedX;
			this.downedItem.height += rotatedY;

			this.downedItem.x -= (rotatedX - x) / 2;
			this.downedItem.y -= (rotatedY - y) / 2;

			this.$downedItem.width(this.downedItem.width * this.sizeRatio);
			this.$downedItem.height(this.downedItem.height * this.sizeRatio);
			this.$downedItem.css({ left: this.downedItem.x * this.sizeRatio, top: this.downedItem.y * this.sizeRatio });
		} else if (this.transformMode == "resize-n") {
			var x = (pointerX - this.lastPointerX) / this.sizeRatio;
			var y = (pointerY - this.lastPointerY) / this.sizeRatio;
			var cos = Math.cos(this.downedItem.radian);
			var sin = Math.sin(this.downedItem.radian);
			var rcos = cos;
			var rsin = -sin;
			var rotatedX = 0;
			var rotatedY = x * rsin + y * rcos;
			var fixedX = rotatedX * cos - rotatedY * sin;
			var fixedY = rotatedX * sin + rotatedY * cos;

			this.downedItem.y += rotatedY;
			this.downedItem.height -= rotatedY;
			
			this.downedItem.x -= (rotatedX - fixedX) / 2;
			this.downedItem.y -= (rotatedY - fixedY) / 2;
			
			this.$downedItem.width(this.downedItem.width * this.sizeRatio);
			this.$downedItem.height(this.downedItem.height * this.sizeRatio);
			this.$downedItem.css({ left: this.downedItem.x * this.sizeRatio, top: this.downedItem.y * this.sizeRatio });
		} else if (this.transformMode == "resize-s") {
			var x = (pointerX - this.lastPointerX) / this.sizeRatio;
			var y = (pointerY - this.lastPointerY) / this.sizeRatio;
			var cos = Math.cos(this.downedItem.radian);
			var sin = Math.sin(this.downedItem.radian);
			var rcos = cos;
			var rsin = -sin;
			var rotatedX = 0;
			var rotatedY = x * rsin + y * rcos;
			var fixedX = rotatedX * cos - rotatedY * sin;
			var fixedY = rotatedX * sin + rotatedY * cos;

			this.downedItem.height += rotatedY;

			this.downedItem.x -= (rotatedX - fixedX) / 2;
			this.downedItem.y -= (rotatedY - fixedY) / 2;

			this.$downedItem.width(this.downedItem.width * this.sizeRatio);
			this.$downedItem.height(this.downedItem.height * this.sizeRatio);
			this.$downedItem.css({ left: this.downedItem.x * this.sizeRatio, top: this.downedItem.y * this.sizeRatio });
		} else if (this.transformMode == "resize-w") {
			var x = (pointerX - this.lastPointerX) / this.sizeRatio;
			var y = (pointerY - this.lastPointerY) / this.sizeRatio;
			var cos = Math.cos(this.downedItem.radian);
			var sin = Math.sin(this.downedItem.radian);
			var rcos = cos;
			var rsin = -sin;
			var rotatedX = x * rcos - y * rsin;
			var rotatedY = 0;
			var fixedX = rotatedX * cos - rotatedY * sin;
			var fixedY = rotatedX * sin + rotatedY * cos;

			this.downedItem.x += rotatedX;
			this.downedItem.width -= rotatedX;
			
			this.downedItem.x -= (rotatedX - fixedX) / 2;
			this.downedItem.y -= (rotatedY - fixedY) / 2;
			
			this.$downedItem.width(this.downedItem.width * this.sizeRatio);
			this.$downedItem.height(this.downedItem.height * this.sizeRatio);
			this.$downedItem.css({ left: this.downedItem.x * this.sizeRatio, top: this.downedItem.y * this.sizeRatio });
		} else if (this.transformMode == "resize-e") {
			var x = (pointerX - this.lastPointerX) / this.sizeRatio;
			var y = (pointerY - this.lastPointerY) / this.sizeRatio;
			var cos = Math.cos(this.downedItem.radian);
			var sin = Math.sin(this.downedItem.radian);
			var rcos = cos;
			var rsin = -sin;
			var rotatedX = x * rcos - y * rsin;
			var rotatedY = 0;
			var fixedX = rotatedX * cos - rotatedY * sin;
			var fixedY = rotatedX * sin + rotatedY * cos;

			this.downedItem.width += rotatedX;

			this.downedItem.x -= (rotatedX - fixedX) / 2;
			this.downedItem.y -= (rotatedY - fixedY) / 2;

			this.$downedItem.width(this.downedItem.width * this.sizeRatio);
			this.$downedItem.height(this.downedItem.height * this.sizeRatio);
			this.$downedItem.css({ left: this.downedItem.x * this.sizeRatio, top: this.downedItem.y * this.sizeRatio });
		}

		this.lastPointerX = pointer.pageX;
		this.lastPointerY = pointer.pageY;
	}

	_onItemMoveEnd() {
		this.transformMode = null;
		this.downedItem = null;
		this.$downedItem = null;
		this.lastPointerX = null;
		this.lastPointerY = null;
	}
	
	_onDrawingStart(event) {
		if (event.type == "touchstart") {
			event.preventDefault(); //for Mobile
		}

		if (this.drawingStyle == null) {
			return;
		}

		if (this.isDrawingStarted) {
			return;
		}

		var $target = $(event.target);

		var $item = $target.parents('[data-id]');
		var itemId = $item.attr("data-id");
		var item = this.items.find(item => item.id == itemId);
		if (item != null) {
			return;
		}

		var pointer = event.targetTouches? event.targetTouches[0] : event;
		var offset = this.$content.offset();
		var x = pointer.pageX - offset.left;
		var y = pointer.pageY - offset.top;

		this.isDrawingStarted = true;
		this.drawingPath = [{ x: x, y: y }];

		this.drawingCanvas = document.createElement("canvas");
		this.drawingCanvas.width = this.realWidth;
		this.drawingCanvas.height = this.realHeight;
		$(this.drawingCanvas).css({
			position: "absolute",
			left: "0px",
			right: "0px",
			top: "0px",
			bottom: "0px",
			zIndex: this.nextZIndex++,
		});

		this.drawingContext = this.drawingCanvas.getContext("2d");
		this.$content.append(this.drawingCanvas);

		this.drawingContext.lineJoin = "round";
		this.drawingContext.lineCap = "round";
		this.drawingContext.strokeStyle = this.drawingStyle.strokeColor;
		this.drawingContext.lineWidth = this.drawingStyle.strokeWidth;

		this.lastDrawingX = x;
		this.lastDrawingY = y;
	}
	
	_onDrawing(event) {
		if (event.type == "touchstart") {
			event.preventDefault(); //for Mobile
		}

		if (this.isDrawingStarted == false) {
			return;
		}
		
		var pointer = event.targetTouches? event.targetTouches[0] : event;
		var offset = this.$content.offset();
		var x = pointer.pageX - offset.left;
		var y = pointer.pageY - offset.top;

		this.drawingPath.push({ x: x, y: y });

		this.drawingContext.beginPath();
		this.drawingContext.moveTo(this.lastDrawingX, this.lastDrawingY);
		this.drawingContext.lineTo(x, y);
		this.drawingContext.stroke();
		this.drawingContext.closePath();

		this.lastDrawingX = x;
		this.lastDrawingY = y;
	}
	
	_onDrawingEnd(event) {
		if (this.isDrawingStarted == false) {
			return;
		}
		
		// Note: Does not working on ios safari
		// var pointer = event.targetTouches? event.targetTouches[0] : event;
		// var offset = this.$content.offset();
		// var x = pointer.pageX - offset.left;
		// var y = pointer.pageY - offset.top;
		// this.drawingPath.push({ x: x, y: y });

		this.drawingCanvas.remove();

		if (this.drawingPath.length > 2) {
			var quality = 2;
			var offset = this.drawingStyle.strokeWidth;
			var pathBoundary = this._getPathBoundary(this.drawingPath, offset);
			var normalizedPath = this._normalizePath(this.drawingPath, pathBoundary);

			this.drawingCanvas.width = pathBoundary.width * quality;
			this.drawingCanvas.height = pathBoundary.height * quality;
			this.drawingContext.clearRect(0, 0, pathBoundary.width * quality, pathBoundary.height * quality);
			
			this.drawingContext.lineJoin = "round";
			this.drawingContext.lineCap = "round";
			this.drawingContext.strokeStyle = this.drawingStyle.strokeColor;
			this.drawingContext.lineWidth = this.drawingStyle.strokeWidth;
			
			this.drawingContext.beginPath();
			this.drawingContext.scale(quality, quality);
			this.drawingContext.moveTo(normalizedPath[0].x, normalizedPath[0].y);
			for (var i = 1; i < normalizedPath.length; i++) {
				this.drawingContext.lineTo(normalizedPath[i].x, normalizedPath[i].y);
			}
			this.drawingContext.stroke();
			this.drawingContext.closePath();
			console.log(this.drawingCanvas.toDataURL("image/png"));

			this.createItem({
				type: "image",
				value: this.drawingCanvas.toDataURL("image/png"),
				x: pathBoundary.offsetX / this.sizeRatio,
				y: pathBoundary.offsetY / this.sizeRatio,
				width: pathBoundary.width / this.sizeRatio,
				height: pathBoundary.height / this.sizeRatio,
				radian: 0,
			});
		}

		this.isDrawingStarted = false;
		this.drawingStyle = null;
		this.drawingPath = null;
		this.drawingCanvas = null;
		this.drawingContext = null;
		this.lastDrawingX = null;
		this.lastDrawingY = null;
	}
	
	_getPathBoundary(path, margin) {
		var minX = Number.MAX_VALUE;
		var maxX = -Number.MAX_VALUE;
		var minY = Number.MAX_VALUE;
		var maxY = -Number.MAX_VALUE;
		for (var i = 0; i < path.length; i++) {
			minX = Math.min(minX, path[i].x);
			minY = Math.min(minY, path[i].y);
			maxX = Math.max(maxX, path[i].x);
			maxY = Math.max(maxY, path[i].y);
		}
		return {
			offsetX: minX - margin,
			offsetY: minY - margin,
			width: maxX - minX + margin * 2,
			height: maxY - minY + margin * 2,
		}
	}

	_normalizePath(path, boundary) {
		return path.map(p => ({ x: p.x - boundary.offsetX, y: p.y - boundary.offsetY }))
	}
}