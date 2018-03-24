'use strict'

var id = 0;

function LineSpace(parent, getGraphProperties, interpolateFunctions, onSelect, onUpdateLense, onRemoveLense, onCreateLense, rowSetIndex) {
	var self = this;

    self.id = id;
	id++;

    //Determine screen DPI to rescale canvas contexts
    //(prevents artifacts and blurring on some displays)
    //https://stackoverflow.com/a/15666143/2827258
    this.pixelRatio = (function() {
                       var ctx = document.createElement('canvas').getContext("2d"),
                       dpr = window.devicePixelRatio || 1,
                       bsr = ctx.webkitBackingStorePixelRatio ||
                       ctx.mozBackingStorePixelRatio ||
                       ctx.msBackingStorePixelRatio ||
                       ctx.oBackingStorePixelRatio ||
                       ctx.backingStorePixelRatio || 1;
                       return dpr / bsr;
                       })();
    
    this.pixelRatio = 2;
    //console.log(this.pixelRatio);

	self.getGraphProperties = getGraphProperties;
	self.interpolateFunctions = interpolateFunctions;
	self.onSelect = onSelect;
	self.onUpdateLense = onUpdateLense;
	self.onRemoveLense = onRemoveLense;

	this.parent = parent;
	this.parentRect = parent.node().getBoundingClientRect();
	this.canvas = parent.append("canvas")
		.attr('width', this.parentRect.width*this.pixelRatio)
		.attr('height', this.parentRect.height*this.pixelRatio)
		.attr("style", "z-index: 2;position:absolute;left:0px;top:0px;");
	this.context = this.canvas.node().getContext("2d");
    this.context.scale(self.pixelRatio,self.pixelRatio);
    this.canvas.style("width", ''+this.parentRect.width +'px');
    this.canvas.style("height", ''+this.parentRect.height +'px');
    this.context.clearRect(0, 0, this.parentRect.width, this.parentRect.height);
	this.context.globalAlpha = 0.4;
	this.context.globalCompositeOperation = "difference";

	this.selectCanvas = parent.append("canvas")
		.attr('width', this.parentRect.width*this.pixelRatio)
		.attr('height', this.parentRect.height*this.pixelRatio)
		.attr("style", "z-index: 3;position:absolute;left:0px;top:0px;");
	this.selectContext = this.selectCanvas.node().getContext("2d");
    this.selectContext.scale(self.pixelRatio,self.pixelRatio);
    this.selectCanvas.style("width", ''+this.parentRect.width +'px');
    this.selectCanvas.style("height", ''+this.parentRect.height +'px');
    this.selectContext.clearRect(0, 0, this.parentRect.width, this.parentRect.height);
	this.selectContext.globalAlpha = 1.0;
	this.selectContext.globalCompositeOperation = "source-over";

	this.featureCanvas = parent.append("canvas")
		.attr('width', this.parentRect.width*this.pixelRatio)
		.attr('height', this.parentRect.height*this.pixelRatio)
		.attr("style", "z-index: 1;position:absolute;left:0px;top:0px;");
	this.featureContext = this.featureCanvas.node().getContext("2d");
    this.featureContext.scale(self.pixelRatio,self.pixelRatio);
    this.featureCanvas.style("width", ''+this.parentRect.width +'px');
    this.featureCanvas.style("height", ''+this.parentRect.height +'px');
    this.featureContext.clearRect(0, 0, this.parentRect.width, this.parentRect.height);
	this.featureContext.globalAlpha = 1.0;
	this.featureContext.globalCompositeOperation = "source-over";

    this.instanceWidth = self.parentRect.width/8;
    this.instanceHeight = self.parentRect.height/8;
	this.margin = {top: this.instanceHeight/2, right: this.instanceWidth/2, bottom: this.instanceHeight/2, left: this.instanceWidth/2};

	this.bgcanvas = parent.append("canvas")
		.attr('width', this.parentRect.width/2)
		.attr('height', this.parentRect.height/2)
		.attr("style", "z-index: 0;position:absolute;left:0px;top:0px;");
	this.bgcontext = this.bgcanvas.node().getContext("2d");
    this.bgcanvas.style("width", ''+this.parentRect.width +'px');
    this.bgcanvas.style("height", ''+this.parentRect.height +'px');
    this.bgcontext.clearRect(0, 0, this.parentRect.width, this.parentRect.height);
	this.bgcontext.globalAlpha = 1.0;

	this.bgValues = [];
	this.bgValuesTemp = [];
	this.bgImageWidth = (this.parentRect.width-this.instanceWidth)/2;
	this.bgImageHeight = (this.parentRect.height-this.instanceHeight)/2;
	for (var f = 0; f < this.bgImageWidth*this.bgImageHeight; f++) {
		this.bgValues.push(0.0);
		this.bgValuesTemp.push(0.0);
	}

	// Image data
	this.imageData = this.bgcontext.createImageData(1,1);
	this.imageDataVal = this.imageData.data;


    this.context.translate(this.margin.right, this.margin.top);
    this.selectContext.translate(this.margin.right, this.margin.top);
    this.featureContext.translate(this.margin.right, this.margin.top);
    this.innerWidth = this.parentRect.width - this.instanceWidth;
    this.innerHeight = this.parentRect.height - this.instanceHeight;

	this.lenses = [];
    this.cursorPosition = [0,0];
    this.currentLenseIndex = -1;

    this.interpolating = false;
    this.resizable = false;
    this.removeable = false;
    this.resizing = false;
    this.canManipulate = false;
    this.manipulating = false;
    this.selecting = false;
    this.manipInterpIndex = -1;
    this.manipOutputIndex = -1;
    this.query = [];
    this.linkInterp = 0;
    self.rowSetIndex = rowSetIndex;

    this.actionCanvas = parent.append("canvas")
		.attr('width', this.parentRect.width*this.pixelRatio)
		.attr('height', this.parentRect.height*this.pixelRatio)
		.attr("style", "z-index: 6;position:absolute;left:0px;top:0px;cursor: default");
    this.actionCanvas.style("width", ''+this.parentRect.width +'px');
    this.actionCanvas.style("height", ''+this.parentRect.height +'px');

	this.actionCanvas.on("mousedown", function() {
		if (self.selectable) {
			self.selecting = true;
			self.selectContext.fillStyle = 'red';
			self.selectContext.globalAlpha = 0.1;
			self.selectContext.globalCompositeOperation = "source-over";
			self.selectContext.beginPath();
			self.selectContext.clearRect(-self.margin.left,-self.margin.top,self.parentRect.width*self.pixelRatio,self.parentRect.height*self.pixelRatio);
			self.selectContext.stroke();
			self.selectContext.closePath();
			return;
		}

		self.cursorPosition = [d3.event.offsetX-self.margin.right, d3.event.offsetY-self.margin.top];

		self.currentLenseIndex = -1;
		var lense = null;
		for (var f = 0; f < self.lenses.length; f++) {
			lense = self.lenses[f];
			if ((Math.abs(self.cursorPosition[0] - lense.position[0]) <= lense.scale*lense.width/2 &&
				Math.abs(self.cursorPosition[1] - lense.position[1]) <= lense.scale*lense.height/2) || (
				lense.searchPosition && Math.abs(Math.abs(self.cursorPosition[0] - lense.searchPosition[0])) < lense.width/15 && 
				Math.abs(self.cursorPosition[1] - lense.searchPosition[1]) < lense.height/15)) {
				self.currentLenseIndex = f;
				break;
			}
		}

		if (self.currentLenseIndex < 0) {
			lense = self.createLense(self.cursorPosition[0],self.cursorPosition[1]);
		}


		if (d3.event.ctrlKey && lense && !lense.searchPosition) {
			lense.searchPosition = lense.position;
		}

		if (self.removeable) {
			self.onRemoveLense(self, self.currentLenseIndex);
			self.removeLense(self.currentLenseIndex);
			return;
		}

		if (self.resizable) {
			self.resizing = true;
		}

		if (self.canManipulate) {
			lense.tempInterpParameters.forEach(function(item, index) {
				//lense.tempInterpParameters[index] = {};
			});
			self.handleManipulate(d3.event);
			self.manipulating = true;
		}

		if (self.resizing) {
			lense.tempInterpParameters.forEach(function(item, index) {
				//lense.tempInterpParameters[index] = {};
			});
			self.handleResize(d3.event);
		}
		else if (self.manipulating) {
		}
		else if (Math.abs(Math.abs(self.cursorPosition[0] - lense.position[0])) < lense.width/15 && 
				Math.abs(self.cursorPosition[1] - lense.position[1]) < lense.height/15) {
			lense.tempInterpParameters.forEach(function(item, index) {
				//lense.tempInterpParameters[index] = {};
			});

	    	self.handleInterpolate(d3.event);
		}
		else if (lense.searchPosition && Math.abs(Math.abs(self.cursorPosition[0] - lense.searchPosition[0])) < lense.width/15 && 
				Math.abs(self.cursorPosition[1] - lense.searchPosition[1]) < lense.height/15) {
			lense.tempInterpParameters.forEach(function(item, index) {
				//lense.tempInterpParameters[index] = {};
			});

    		self.searching = true;

	    	self.handleInterpolate(d3.event);
		}

		self.onUpdateLense(self, lense);
    });

    this.actionCanvas.on("mouseup", function() {

    	if (self.selecting) {
    		self.selecting = false;
			self.selectContext.globalAlpha = 1.0;

			var selected = [];

			self.query.forEach(function(item, index) {
				var ds = self.dataSet[item];
				var imgData = self.selectContext.getImageData(self.paramX(+ds.params[self.dimensions[0]])*self.pixelRatio+self.margin.left*self.pixelRatio, self.paramY(+ds.params[self.dimensions[1]])*self.pixelRatio+self.margin.top*self.pixelRatio, 1, 1).data;
				if (imgData[0] > 0) {
					selected.push(ds.id);
					$('.pCoordChart .resultPaths path[index="'+ds.refId+'"]').css('stroke-width', '1px');
				}
				else {
					$('.pCoordChart .resultPaths path[index="'+ds.refId+'"]').css('stroke-width', '0px');
				}
			});

			if (selected.length == 0) {
				self.query.forEach(function(item, index) {
					var ds = self.dataSet[item];
					$('.pCoordChart .resultPaths path[index="'+ds.refId+'"]').css('stroke-width', '1px');
				});
			}
			

			self.selectContext.beginPath();
			self.selectContext.clearRect(-self.margin.left,-self.margin.top,self.parentRect.width*self.pixelRatio,self.parentRect.height*self.pixelRatio);
			self.selectContext.stroke();
			self.selectContext.closePath();

			self.onSelect(selected);
    		return;
    	}

    	if (self.interpolating) {
		    self.handleInterpolate(d3.event);
		    self.cursorPosition = [d3.event.offsetX-self.margin.right, d3.event.offsetY-self.margin.top];
		    if (self.searching && self.lenses[self.currentLenseIndex].searchPosition) {
				self.lenses[self.currentLenseIndex].searchPosition = [self.cursorPosition[0],self.cursorPosition[1]];
			}
			else {
				self.lenses[self.currentLenseIndex].position = [self.cursorPosition[0],self.cursorPosition[1]];
			}
			self.onUpdateLense(self, self.lenses[self.currentLenseIndex]);
	    	self.searching = false;
		}
		else if (self.resizing) {
			self.handleResize(d3.event);
			self.resizing = false;
			self.onUpdateLense(self, self.lenses[self.currentLenseIndex]);
		}
		else if (self.manipulating) {
			self.manipulating = false;
			self.handleManipulate(d3.event);
			self.onUpdateLense(self, self.lenses[self.currentLenseIndex]);
		}
    });

    this.actionCanvas.on("mousemove", function() {
    	if (self.selectable) {
    		if (self.selecting) {
    			var cursorPosition = [d3.event.offsetX-self.margin.right, d3.event.offsetY-self.margin.top];
    			var x = self.paramX.invert(cursorPosition[0]);
				var y = self.paramY.invert(cursorPosition[1]);
				var context = self.selectContext;
				context.beginPath();
				context.arc(self.paramX(x), self.paramY(y), 10, 0, 2*Math.PI, true);
				context.fill();
				context.closePath();
    		}
    		return;
    	}

    	if (self.dataSet) {
    		if (self.interpolating) {
    			var x = self.lenses[self.currentLenseIndex].position[0] + self.margin.left;
				var y = self.lenses[self.currentLenseIndex].position[1] + self.margin.top;
	    		self.interpolate(x, y, self.lenses[self.currentLenseIndex]);
		    	self.cursorPosition = [d3.event.offsetX-self.margin.right, d3.event.offsetY-self.margin.top];

		    	if (self.searching && self.lenses[self.currentLenseIndex].searchPosition) {
					self.lenses[self.currentLenseIndex].searchPosition = [self.cursorPosition[0],self.cursorPosition[1]];		
		    	}
		    	else {
					self.lenses[self.currentLenseIndex].position = [self.cursorPosition[0],self.cursorPosition[1]];	
		    	}	

				self.onUpdateLense(self, self.lenses[self.currentLenseIndex]);
	    	}
	    	else if (self.resizing) {
	    		self.handleResize(d3.event);
	    		self.onUpdateLense(self, self.lenses[self.currentLenseIndex]);
	    	}
	    	else if (self.manipulating) {
	    		self.handleManipulate(d3.event);
				self.onUpdateLense(self, self.lenses[self.currentLenseIndex]);
	    	}
	    	else {
				self.resizable = false;
				self.removeable = false;
				self.canManipulate = false;
				var found = false;
				var lense = null;
				for (var f = 0; f < self.lenses.length; f++) {
					lense = self.lenses[f];
					var x = d3.event.offsetX-self.margin.right - lense.position[0];
					var y = d3.event.offsetY-self.margin.top - lense.position[1];
					
					if (Math.abs(x) < lense.scale*lense.width/2 && Math.abs(y) < lense.scale*lense.height/2) {

						if ((Math.abs(x) < lense.scale*lense.width/2 &&
							Math.abs(x) > lense.scale*lense.width/2-10) ||
							(Math.abs(y) < lense.scale*lense.height/2 &&
							Math.abs(y) > lense.scale*lense.height/2-10)) {
							if (x < -lense.scale*lense.width/2+15 && y < -lense.scale*lense.height/2+15) {
								self.actionCanvas.style("cursor", "url(css/delete.png) 16 16, not-allowed");
   								self.removeable = true;
   							}
   							else {
   								self.actionCanvas.style("cursor", "nesw-resize");
								self.resizable = true;
   							}
							found = true;
						}
						else if(Math.abs(x) < lense.width/15 && Math.abs(y) < lense.height/15) {
							self.actionCanvas.style("cursor", "move");
							found = true;
						}
						else {
							var transX = lense.width/2;
							var transY = lense.height/2;
							var xVal = self.x.invert(x/lense.scale+transX);
							var yVal = self.y.invert(y/lense.scale+transY);

							lense.interpResults.forEach(function(item, index) {
								var i = 0;
								var j = item.ds.rowSet[self.rowSetIndex].length-1;
								while (i < j) {
									var m = Math.floor((i+j)/2);
									if (xVal > item.ds.rowSet[self.rowSetIndex][m].x) {
										i = m + 1;
									}
									else {
										j = m;
									}
								}

								var foundY = item.ds.rowSet[self.rowSetIndex][i].y;

								if (Math.abs(yVal - foundY) < (self.y.domain()[1]-self.y.domain()[0])*0.02) {
									self.actionCanvas.style("cursor", "crosshair");
									found = true;
									self.manipInterpIndex = index;
									self.manipOutputIndex = i;
									self.canManipulate = true;
								}
							});
						}

						break;
					}
					

					var searchPos = lense.searchPosition ? lense.searchPosition : lense.position;
					if (!found && Math.abs(d3.event.offsetX-self.margin.right - searchPos[0]) < lense.width/15 && Math.abs(d3.event.offsetY-self.margin.top - searchPos[1]) < lense.height/15) {
							self.actionCanvas.style("cursor", "move");
							found = true;
					}
				}

				if (!found) {
					self.actionCanvas.style("cursor", "default");
				}
	    	}
    	}
    });

    this.showAll = false;
    this.showFeatures = false;
    this.selectable = false;
    this.showBackground = true;
    this.showInterpolation = true;
    this.searching = false;

    var selectDiv = self.parent
		.append('div')
  		.attr("style", "z-index: 10;position:absolute;left:0px;top:0px;cursor: default");

	var checkbox = selectDiv.append("input")
	    .attr("type", "checkbox")
	    .on('click',function() {
	    	self.showAll = d3.event.target.checked;
	    	self.redraw();
    		//self.update();
    	});
    if (self.showAll) {
    	checkbox.attr("checked", self.showAll);
    }
    checkbox.style("float", "left").style("position", "relative");

    var selectDivX = self.parent
		.append('div')
  		.attr("style", "z-index: 10;position:absolute;left:"+ (this.parentRect.width/2 - 62) +"px;top:"+ (this.parentRect.height - 30) +"px;cursor: default");
 
	var selectDivY = self.parent
		.append('div')
  		.attr("style", "z-index: 10;position:absolute;left:0px;top:"+ (this.parentRect.height/2) +"px;cursor: default");

	self.xSelect = selectDivX
		.append('select')
  		.attr('id','xval')
  		.attr('class','select')
    	.on('change',function() {
    		self.dimensions[0] = d3.event.target.value;
    		self.update();
    	});

    self.ySelect = selectDivY
		.append('select')
  		.attr('class','select')
    	.on('change',function() {
    		self.dimensions[1] = d3.event.target.value;
    		self.update();
    	});

    self.valueSelect = selectDiv
		.append('select')
  		.attr('class','select')
  		//.attr("style", "visibility: hidden")
    	.on('change',function() {
    		self.dimensions[2] = d3.event.target.value;
    		self.redraw();
    	});
    self.valueSelect.style("float", "left").style("position", "relative");

    self.colorMapPicker = new ColorMapPicker(selectDiv, "images/colormoves/ColorMaps.csv", function() { self.onColorMapChange();})
    
	var checkbox = selectDiv.append("input")
	    .attr("type", "checkbox")
	    .on('click',function() {
	    	self.showBackground = d3.event.target.checked;
	    	self.bgcanvas.style("visibility", self.showBackground ? 'visible' : 'hidden');
    		//self.update();
    	});
    if (self.showBackground) {
    	checkbox.attr("checked", self.showBackground);
    }
    self.bgcanvas.style("visibility", self.showBackground ? 'visible' : 'hidden');
    checkbox.style("float", "left").style("position", "relative");

    self.backgroundSelect = selectDiv
		.append('select')
  		.attr('class','select')
  		//.attr("style", "visibility: hidden")
    	.on('change',function() {
    		self.dimensions[3] = d3.event.target.value;
    		self.update();
    	});

    self.backgroundSelect.style("float", "left").style("position", "relative");

    self.colorMapPicker2 = new ColorMapPicker(selectDiv, "images/colormoves/ColorMaps2.csv", function() {self.redrawBackground();})

    var checkbox = selectDiv.append("input")
	    .attr("type", "checkbox")
	    .on('click',function() {
	    	self.selectable = d3.event.target.checked;
    		//self.update();
    	});
    if (self.selectable) {
    	checkbox.attr("checked", self.selectable);
    }
    checkbox.style("float", "left").style("position", "relative");

    self.opacitySelect = selectDiv
		.append('select')
  		.attr('class','select')
  		.attr("style", "visibility: hidden")
    	.on('change',function() {
    		self.dimensions[4] = d3.event.target.value;
    		self.redraw();
    	});

    self.opacitySelect.style("float", "left").style("position", "relative");

	var checkbox = selectDiv.append("input")
	    .attr("type", "checkbox")
	    .attr("style", "visibility: hidden")
	    .on('click',function() {
	    	self.showFeatures = d3.event.target.checked;
	    	self.featureCanvas.style("visibility", self.showFeatures ? 'visible' : 'hidden');
    		//self.update();
    		self.redraw();
    		self.redrawLenses();
    	});
    if (self.showFeatures) {
    	checkbox.attr("checked", self.showFeatures);
    }
    self.featureCanvas.style("visibility", self.showFeatures ? 'visible' : 'hidden');
    checkbox.style("float", "left").style("position", "relative");

    var checkbox = selectDiv.append("input")
	    .attr("type", "checkbox")
	    .attr("style", "visibility: hidden")
	    .on('click',function() {
	    	self.showInterpolation = d3.event.target.checked;
    		self.redrawLenses();
    	});
    if (self.showInterpolation) {
    	checkbox.attr("checked", self.showInterpolation);
    }
    checkbox.style("float", "left").style("position", "relative");
}

LineSpace.prototype.createLense = function(x,y) {
	var self = this;

	var selectcanvas = self.parent.append("canvas")
		.attr('width', self.parentRect.width*self.pixelRatio)
		.attr('height', self.parentRect.height*self.pixelRatio)
		.attr('class', 'lense')
		.attr("style", "z-index: 4;position:absolute;left:0px;top:0px;cursor: default");
	var selectcontext = selectcanvas.node().getContext("2d");
    selectcontext.scale(self.pixelRatio,self.pixelRatio);
    selectcanvas.style("width", ''+self.parentRect.width +'px');
    selectcanvas.style("height", ''+self.parentRect.height +'px');
	selectcontext.translate(self.margin.right, self.margin.top);
	selectcontext.fillStyle = "green";
	selectcontext.lineWidth = 1.1;
	selectcontext.globalAlpha = 1.0;
	selectcontext.globalCompositeOperation = "source-over";

	var lense = {width: self.instanceWidth, height: self.instanceHeight};
	var canvas = self.parent.append("canvas")
		.attr('width', self.parentRect.width*self.pixelRatio)
		.attr('height', self.parentRect.height*self.pixelRatio)
		.attr('class', 'lense')
		.attr("style", "z-index: 5;position:absolute;left:0px;top:0px;cursor: default");
	var context = canvas.node().getContext("2d");
    context.scale(self.pixelRatio,self.pixelRatio);
    canvas.style("width", ''+self.parentRect.width +'px');
    canvas.style("height", ''+self.parentRect.height +'px');
	context.translate(self.margin.right, self.margin.top);
	context.fillStyle = "green";
	context.lineWidth = 1.1;
	context.globalAlpha = 1.0;
	context.globalCompositeOperation = "difference";

	lense.canvas = canvas;
	lense.context = context;
	lense.selectcanvas = selectcanvas;
	lense.selectcontext = selectcontext;
	lense.prevScale = 1.0;
	lense.scale = 1.0;
	lense.position = [x,y];
	lense.interpResults = [];
	lense.interpParameters = [];
	lense.tempInterpParameters = [];
	lense.color = 'white';
	self.interpolateFunctions.forEach(function(item, index) {
		lense.interpParameters.push({});
		lense.tempInterpParameters.push({});
	});
	self.lenses.push(lense);
	self.currentLenseIndex = self.lenses.length-1;
	lense.id = self.currentLenseIndex;

	onCreateLense(self, lense);

	return lense;
}

LineSpace.prototype.updateLense = function(lense, space) {
	var self = this;
	var selectedLense = null;
	var created = false;

	if (lense.id > self.lenses.length-1) {
		selectedLense = self.createLense(lense.position[0], lense.position[1]);
		created = true;
	}
	else {
		selectedLense = self.lenses[lense.id];
	}

	var x = 0;
	var y = 0;

	selectedLense.interpParameters = lense.interpParameters;
	selectedLense.tempInterpParameters.forEach(function(item, index) {
		item[space.dimensions[0]] = {val: +lense.interpResults[index].ds.params[space.dimensions[0]], weight:1.0, interpWeight: 0.0};
		item[space.dimensions[1]] = {val: +lense.interpResults[index].ds.params[space.dimensions[1]], weight:1.0, interpWeight: 0.0};
		//if (index > 0) {return;}
		//x += +lense.interpResults[index].ds.params[self.dimensions[0]];
		//y += +lense.interpResults[index].ds.params[self.dimensions[1]];
	});

	x = +lense.interpResults[self.linkInterp].ds.params[self.dimensions[0]];
	y = +lense.interpResults[self.linkInterp].ds.params[self.dimensions[1]];
	x = self.paramX(x);
	y = self.paramY(y);

	/*x /= selectedLense.tempInterpParameters.length;
	y /= selectedLense.tempInterpParameters.length;
	x = self.paramX(x);
	y = self.paramY(y);*/

	if (created) {
		selectedLense.position = [x, y];
	}

	//if (!selectedLense.searchPosition) {
	//	selectedLense.x = x+self.margin.left;
	//	selectedLense.y = y+self.margin.top;
	//}

	self.redrawLense(selectedLense);
	//if (!selectedLense.searchPosition) {
	//	selectedLense.position = [x, y];
	//}
}

LineSpace.prototype.removeLense = function(lenseId) {
	var self = this;
	for (var f = lenseId+1; f < self.lenses.length; f++) {
		self.lenses[lenseId].id--;
	}
	self.lenses[lenseId].canvas.remove();
	self.lenses[lenseId].selectcanvas.remove();
	self.lenses.splice(lenseId,1);
	self.redrawLenses();
	//self.currentLenseIndex = -1;
	self.select([], true);
}

LineSpace.prototype.select = function(query, clear, color, metaIndex, numIndexes, alphas, lense) {
	var self = this;

	var selectContext = lense ? lense.selectcontext : self.selectContext;

	if (!color) {
		color = 'red';
	}

	if (clear) {
		selectContext.beginPath();
		selectContext.clearRect(-self.margin.left,-self.margin.top,self.parentRect.width*self.pixelRatio,self.parentRect.height*self.pixelRatio);
		selectContext.stroke();
		selectContext.closePath();
	}

	var oldGlobalAlpha = selectContext.globalAlpha;

	if (query.length > 0) {
		self.selected = [];
		query.forEach(function(item, index) {
			self.selected.push(item);
			var ds = self.dataSet[item];
			if (alphas) {
				selectContext.globalAlpha = alphas[index];
			}
			self.drawLines({context: selectContext, scale: 1.0, prevScale: 1.0}, ds, color, false, false, null, false, metaIndex, numIndexes);
		});
	}
	else {
		self.selected.forEach(function(item, index) {
			self.selected.push(item);
			var ds = self.dataSet[item];
			self.drawLines({context: selectContext, scale: 1.0, prevScale: 1.0}, ds, 'clear');
		});

		self.selected = [];

		if (clear) {

			self.query.forEach(function(item, index) {
				var ds = self.dataSet[item];
				$('.pCoordChart .resultPaths path[index="'+ds.refId+'"]').css('stroke-width', '1px');
				$('.pCoordChart .resultPaths path[index="'+ds.refId+'"]').css('stroke-opacity', '0.4');
			});
			self.redraw();
		}
	}
	
	selectContext.globalAlpha = oldGlobalAlpha;

}

LineSpace.prototype.setPixelValue = function(context, x, y, r, g, b, a) {
	var self = this;
	self.imageDataVal[0] = r;
	self.imageDataVal[1] = g;
	self.imageDataVal[2] = b;
	self.imageDataVal[3] = a;
	context.putImageData(self.imageData, x, y);
}

LineSpace.prototype.onSelectionChange = function(query) {
	var self = this;
	if (self.fullDataSet) {
		self.dataSet = [];
		self.query = [];
		query.forEach(function(item, index) {
			self.query.push(index);
		});
		query.forEach(function(item, index) {
	   		var ds = self.fullDataSet[item];
	   		self.dataSet.push({id: index, params: ds.params, rows: ds.rows, rowSet: ds.rowSet, refId: ds.refId});
	   	});
		self.redraw();
		self.redrawLenses();

		if (!self.selectionChangeVersion) { self.selectionChangeVersion = 0; }
		self.selectionChangeVersion++;

		var q = d3.queue();
			q.defer(function(callback) {
					var ver = self.selectionChangeVersion;
					setTimeout(function() {
						if (ver == self.selectionChangeVersion) {
							
							self.updateBackground();
						}
						callback(null); 
			}, 200);
								
		});
	}
	else {
		self.query = query;
	}

}

LineSpace.prototype.onColorMapChange = function() {
	var self = this;
	self.redraw();
}

LineSpace.prototype.handleInterpolate = function(event) {
	var self = this;
	self.interpolating = !self.interpolating;
	if(self.interpolating) {
		var x = self.lenses[self.currentLenseIndex].position[0] + self.margin.left;
		var y = self.lenses[self.currentLenseIndex].position[1] + self.margin.top;
	    self.interpolate(x, y, self.lenses[self.currentLenseIndex]);
	}
	self.actionCanvas.style("cursor", self.interpolating ? "crosshair" : "default");
} 

LineSpace.prototype.handleResize = function(event) {
	var self = this;
	var lense = self.lenses[self.currentLenseIndex];
	var x = lense.position[0] + self.margin.left;
	var y = lense.position[1] + self.margin.top;
	var center = lense.position;
	var corner = [lense.position[0]+lense.width/2, lense.position[1]+lense.height/2];
	var v1 = vectorSubtract(corner, center);
	var v1Len = mag(v1);
	var v2 = vectorSubtract([d3.event.offsetX-self.margin.left, d3.event.offsetY-self.margin.top], center);
	var v2Len = mag(v2);
	lense.prevScale = lense.scale;
	lense.scale = v2Len/v1Len;
	self.interpolate(x, y, self.lenses[self.currentLenseIndex]);
} 

LineSpace.prototype.handleManipulate = function(event) {
	var self = this;

	var lense = self.lenses[self.currentLenseIndex];
	
	if (self.manipulating) {
		var xPos = d3.event.offsetX-self.margin.right - lense.position[0];
		var yPos = d3.event.offsetY-self.margin.top - lense.position[1];
		var transX = lense.width/2;
		var transY = lense.height/2;
		var xVal = self.x.invert(xPos/lense.scale+transX);
		var yVal = self.y.invert(yPos/lense.scale+transY);
		self.interpolateFunctions.forEach(function(item, functionIndex) {
			lense.interpParameters[functionIndex]["output_" + self.rowSetIndex + "_" + self.manipOutputIndex] = {val: yVal, weight:1.0, interpWeight:0.0};
		});
	}
	//else if (self.lastPos) {
		//lense.position = self.lastPos;
	//}

	var x = lense.position[0] + self.margin.left;
	var y = lense.position[1] + self.margin.top;

	self.interpolate(x, y, lense);
}

LineSpace.prototype.interpolate = function(x, y, lense) {
	var self = this;

	var context = lense.context;
	var prevPosition = lense.prevPosition;

	if (lense.lastPos) {
					context.save();
					context.beginPath();
					var xClear = lense.lastPos[0];
					var yClear = lense.lastPos[1];
					var clearRadius = 10;
					context.arc(xClear, yClear, clearRadius, 0, 2*Math.PI, true);
					context.clip();
					context.clearRect(xClear-clearRadius,yClear-clearRadius,clearRadius*2,clearRadius*2);
					context.restore();
	}

	if (lense.prevSearchPosition) {
					context.save();
					context.beginPath();
					var xClear = lense.prevSearchPosition[0];
					var yClear = lense.prevSearchPosition[1];
					var clearRadius = 10;
					context.arc(xClear, yClear, clearRadius, 0, 2*Math.PI, true);
					context.clip();
					context.clearRect(xClear-clearRadius,yClear-clearRadius,clearRadius*2,clearRadius*2);
					context.restore();

					context.save();
					context.beginPath();
					context.clearRect(Math.min(lense.prevSearchPosition[0], lense.prevPosition[0]) - 10,
						Math.min(lense.prevSearchPosition[1], lense.prevPosition[1]) - 10,
						Math.abs(lense.prevPosition[0]-lense.prevSearchPosition[0])+20,
						Math.abs(lense.prevPosition[1]-lense.prevSearchPosition[1])+20);
					context.restore();
	}

	if (lense.searchPosition) {
					context.save();
					context.beginPath();
					var xClear = lense.searchPosition[0];
					var yClear = lense.searchPosition[1];
					var clearRadius = 10;
					context.arc(xClear, yClear, clearRadius, 0, 2*Math.PI, true);
					context.clip();
					context.clearRect(xClear-clearRadius,yClear-clearRadius,clearRadius*2,clearRadius*2);
					context.restore();
	}

	if (prevPosition) {
		context.beginPath();
		context.clearRect(prevPosition[0]-lense.prevScale*self.instanceWidth/2-8, prevPosition[1]-lense.prevScale*self.instanceHeight/2-8, lense.prevScale*self.instanceWidth+16, lense.prevScale*self.instanceHeight+16);
		context.stroke();
		context.closePath();
		context.beginPath();
	}

	prevPosition = lense.position;

	if (prevPosition) {
		context.beginPath();
		context.clearRect(prevPosition[0]-lense.prevScale*self.instanceWidth/2-8, prevPosition[1]-lense.prevScale*self.instanceHeight/2-8, lense.prevScale*self.instanceWidth+16, lense.prevScale*self.instanceHeight+16);
		context.stroke();
		context.closePath();
		context.beginPath();
		context.globalAlpha = 0.8;
		context.fillStyle = 'white';
		context.globalCompositeOperation = "difference";
		context.fillRect(x-self.margin.right-lense.scale*self.instanceWidth/2,y-self.margin.top-lense.scale*self.instanceHeight/2,this.instanceWidth*lense.scale,this.instanceHeight*lense.scale);
		context.stroke();
		context.closePath();
		context.beginPath();
		context.globalAlpha = 0.2;
		context.fillStyle = lense.color;
		context.globalCompositeOperation = "source-over";
		context.fillRect(x-self.margin.right-lense.scale*self.instanceWidth/2,y-self.margin.top-lense.scale*self.instanceHeight/2,this.instanceWidth*lense.scale,this.instanceHeight*lense.scale);
		context.stroke();
		context.closePath();
	}


	lense.prevSearchPosition = lense.searchPosition;
	lense.prevPosition = lense.position;

	context.globalAlpha = 1.0;
	context.globalCompositeOperation = "source-over";
	var pSet = [self.dimensions[0], self.dimensions[1]];
	var tempParams = {};
	tempParams[self.dimensions[0]] = self.paramX.invert(x-self.margin.right);
	tempParams[self.dimensions[1]] = self.paramY.invert(y-self.margin.top);
	var tempDs = {params: tempParams};
   	var dsDist = calcDistance(tempDs, self.dataSet, pSet, function(item) { return 1.0/self.paramInfo[item].variance; }, weightedEclideanDistance, 1);

	var interpResults = [];
	self.interpolateFunctions.forEach(function(item, functionIndex) {
		var query = {};
		if (true) { //Object.keys(lense.tempInterpParameters[functionIndex]).length == 0) {
			var searchPos = lense.searchPosition ? lense.searchPosition : [x-self.margin.right, y-self.margin.top];
			query[self.dimensions[0]] = {val: self.paramX.invert(searchPos[0]), weight:1.0, interpWeight: 0.0};//self.manipulating ? 0.0 : 1.0};
			query[self.dimensions[1]] = {val: self.paramY.invert(searchPos[1]), weight:1.0, interpWeight: 0.0};//self.manipulating ? 0.0 : 1.0};
		}
		var lenseQueryParams = Object.keys(lense.interpParameters[functionIndex]);
		lenseQueryParams.forEach(function(item, index) {
			query[item] = lense.interpParameters[functionIndex][item];
		});

		lenseQueryParams = Object.keys(lense.tempInterpParameters[functionIndex]);
		lenseQueryParams.forEach(function(item, index) {
			query[item] = lense.tempInterpParameters[functionIndex][item];
		});

	 	var interp = item(query, self.dataSet, lense);
	 	//console.log(self.id, query, interp);
	 	interpResults.push(interp);
	});

	lense.interpResults = interpResults;

   	if (self.dataSet[dsDist[0].id].image) {
   		self.drawLines(lense, self.dataSet[dsDist[0].id], 'black', true, true, 
	 		{x: +tempParams[self.dimensions[0]], y: +tempParams[self.dimensions[1]], value: 0, show: true}, true);
   		return;
   	}

	var neighborResults = [];

	interpResults.forEach(function(interp, index) {
		var neighborIds = [];
		var alphas = []

		var weightSum = 0;
		var numNeighbors = interp.neighbors.length < 25.0 ? interp.neighbors.length : 25.0;
		for (var f = 0; f < numNeighbors; f++) {
			weightSum+= interp.neighbors[f].weight;
		 }

		for (var f = 0; f < numNeighbors; f++) {
			var alpha = numNeighbors == 0 ? 0.0 : (1.0*numNeighbors-f)/numNeighbors;
			alpha = alpha * alpha * alpha;
			//var alpha = (interp.neighbors[f].weight/weightSum)+0.25;
			alphas.push(alpha);
			context.globalAlpha = alpha;
			context.lineWidth = 1.0;
		 	self.drawLines(lense, self.dataSet[interp.neighbors[f].id], interp.color, false, true, 
		 		{x: +tempParams[self.dimensions[0]], y: +tempParams[self.dimensions[1]], value: 0, show: true}, true);
		 	neighborIds.push(interp.neighbors[f].id);
		}

		self.select(neighborIds, index == 0, interp.color, index, interpResults.length, alphas, lense);
		neighborResults.push([neighborIds, interp.color, alphas]);
		lense.neighborResults = neighborResults;
	});

	if (!self.selectVersion) { self.selectVersion = 0; }
	self.selectVersion++;

	var q = d3.queue();
			q.defer(function(callback) {
				var ver = self.selectVersion;
				setTimeout(function() {
					if (ver == self.selectVersion) {
						self.query.forEach(function(item, index) {
							var ds = self.dataSet[item];
							$('.pCoordChart .resultPaths path[index="'+ds.refId+'"]').css('stroke-width', '0.2px');
							$('.pCoordChart .resultPaths path[index="'+ds.refId+'"]').css('stroke-opacity', '0.4px');
							//$('.pCoordChart .resultPaths path[index="'+ds.refId+'"]').css('stroke', self.fullDataSet[ds.refId].defaultColor);
							$('.pCoordChart .resultPaths path[index="'+ds.refId+'"]').css('stroke', 'grey');

							self.lenses.forEach(function(item, index) {
								item.neighborResults.forEach(function(item, index) {
									if (item[0].includes(ds.id)) {
										$('.pCoordChart .resultPaths path[index="'+ds.refId+'"]').css('stroke-width', '1.5px');
										$('.pCoordChart .resultPaths path[index="'+ds.refId+'"]').css('stroke-opacity', '1.0px');
										var alphaIndex = item[0].findIndex(function(element) {
											 return element == ds.id; });
										//$('.pCoordChart .resultPaths path[index="'+ds.id+'"]').css('stroke-opacity', '' + item[2][alphaIndex]);
										$('.pCoordChart .resultPaths path[index="'+ds.refId+'"]').css('stroke', item[1]);
									}
								});
							});
							
						});
					}
					
					callback(null); 
				}, 200);
							
			});


	context.globalAlpha = 1.0;
	interpResults.forEach(function(interp, index) {
		context.lineWidth = 2.0;
		self.drawLines(lense, interp.ds, interp.color, index == 0, false, {x: +tempParams[self.dimensions[0]], y: +tempParams[self.dimensions[1]], value: 0, show: true}, true);
	});


	/*
	var weightSum = 0;
	for (var f = 0; f < 1; f++) {
		weightSum+= dsDist[f].weight;
	}

	for (var f = 0; f < 1; f++) {
		context.globalAlpha = (dsDist[f].weight/weightSum);
		context.lineWidth = 3.0;
	 	self.drawLines(lense, self.dataSet[dsDist[f].id], 'black', false, true, 
	 		{x: +tempParams[self.dimensions[0]], y: +tempParams[self.dimensions[1]], value: 0, show: true}, true);
	}
	*/
}

LineSpace.prototype.data = function(dataSet) {
	var self = this;

	this.fullDataSet = dataSet;
	this.dataSet = dataSet;

	this.fullDataSet.forEach(function(item, index) {
		item.refId = item.id;
	})

   	self.paramInfo = calcParamInfo(self.dataSet);


	var paramSet = Object.keys(dataSet[0].params).filter(function(d) {
		return !isNaN(+dataSet[0].params[d]);
	});

    self.update();
}

LineSpace.prototype.drawLines = function(lense, ds, color, showBox, forceShow, localCoords, noPoint, metaIndex, numIndexes) {
	var self = this;

	var context = lense.context;
	var oldGlobalAlpha = context.globalAlpha;
	var graphProperties = self.getGraphProperties(self, ds);
	if(localCoords) {
		graphProperties = localCoords;
	}

	var transX = self.paramX(graphProperties.x)-lense.scale*self.instanceWidth/2;
	var transY = self.paramY(graphProperties.y)-lense.scale*self.instanceHeight/2;
	context.translate(transX, transY);

	if (color) {
		context.strokeStyle = color;
		context.fillStyle = color;
	}
	else if (graphProperties.show) {
		context.strokeStyle = 'black'
		this.context.globalAlpha = 1;
	}
	else {
		context.strokeStyle = 'grey';
	}

	if ((self.showAll || graphProperties.show || forceShow) && !ds.image) {
		var alpha = context.globalAlpha;
		for (var f = 0; f < 2; f++) {
			context.beginPath();
			context.strokeStyle = f == 0 ? context.strokeStyle : 'black';
			context.globalAlpha = f == 0 ? alpha : 0.4*alpha;
			ds.rowSet[self.rowSetIndex].forEach(function(item, index) {
				if (index == 0) {
					context.moveTo(lense.scale*self.x(item.x), lense.scale*self.y(item.y));
				}
				else {
					context.lineTo(lense.scale*self.x(item.x), lense.scale*self.y(item.y));
				}
			});
			context.stroke();
			context.closePath();
		}
		context.globalAlpha = alpha;
	}

	context.translate(-transX, -transY);

	if (ds.image && (self.showAll || graphProperties.show || forceShow)) {
		context.globalAlpha = 0.7;
		context.globalCompositeOperation = "source-over";
		context.drawImage(ds.image, transX,transY,this.instanceWidth*lense.scale,this.instanceHeight*lense.scale);
	}

	if (self.showFeatures && (self.showAll || graphProperties.show || forceShow) && ds.features) {

		context.globalAlpha = 1.0;

		var corners = ds.features;

		for (var i = 0; i < corners.length; i += 2) {
			if (corners[i]*this.instanceWidth*lense.scale <= this.instanceWidth*lense.scale && corners[i+1]*this.instanceHeight*lense.scale <= this.instanceHeight*lense.scale) {
		        context.lineWidth = 1;
		        context.strokeStyle = 'darkred';
		        context.beginPath();
		        context.strokeRect(transX + corners[i]*this.instanceWidth*lense.scale, transY+ corners[i + 1]*this.instanceHeight*lense.scale, 3, 3);
		        context.stroke();
			}
	    }
	}

	if (!graphProperties.show && !color) {
		var colorValue = self.colorMapPicker.getColor(graphProperties.value);
		var c = 'rgba('+colorValue[0]+','+colorValue[1]+','+colorValue[2]+','+colorValue[3]+')';
		context.fillStyle = c;
		$('.pCoordChart .resultPaths path[index="'+graphProperties.index+'"]').css('stroke', c);
		self.fullDataSet[graphProperties.index].defaultColor = c;
	}

	if (!noPoint) {
		if (color == 'clear') {
			context.save();
			context.beginPath();
			var xClear = transX+lense.scale*this.instanceWidth/2;
			var yClear = transY+lense.scale*this.instanceHeight/2;
			var clearRadius = 10;
		
			context.arc(xClear, yClear, clearRadius, 0, 2*Math.PI, true);
			context.clip();
			context.clearRect(xClear-clearRadius,yClear-clearRadius,clearRadius*2,clearRadius*2);
			context.restore();
		}
		else {
			var opacityKey = self.dimensions[4];
			var opacity = 1.0;
			if (opacityKey in self.paramInfo) {
				var pInfo = self.paramInfo[opacityKey];
				opacity = (+ds.params[opacityKey] - pInfo.min)/(pInfo.max - pInfo.min);		
			}

			
			$('.pCoordChart .resultPaths path[index="'+graphProperties.index+'"]').css('stroke-opacity', '' + (opacity*0.4));
			context.beginPath()
			if (!numIndexes) {
				this.context.globalAlpha = opacity;	
				this.context.globalCompositeOperation = "source-over";
				context.arc(transX+lense.scale*this.instanceWidth/2, transY+lense.scale*this.instanceHeight/2, 5, 0, 2 * Math.PI);
				context.fill();
			}
			context.closePath();

			context.beginPath()
			var oldLineWidth = context.lineWidth;
			var oldStyle = context.strokeStyle;
			context.strokeStyle = context.fillStyle;
			context.lineWidth = 20.0;
			context.globalAlpha = oldGlobalAlpha;
			//var metaStart = 2.0 * Math.PI*metaIndex/numIndexes;
			//var metaLength = 2.0 * Math.PI/numIndexes;
			//context.arc(transX+lense.scale*this.instanceWidth/2, transY+lense.scale*this.instanceHeight/2, 6, metaStart, metaStart + metaLength);
			context.arc(transX+lense.scale*this.instanceWidth/2, transY+lense.scale*this.instanceHeight/2, 8 + metaIndex*2, 0, 2 * Math.PI);
			context.stroke();
			context.lineWidth = 2.0;
			context.closePath();

			this.context.globalAlpha = 1.0;
			context.strokeStyle = oldStyle;
			context.lineWidth = oldLineWidth;
		}
	}
	else {
		/*context.fillStyle = 'black';
		context.beginPath()
		context.arc(transX+lense.scale*this.instanceWidth/2, transY+lense.scale*this.instanceHeight/2, 3, 0, 2 * Math.PI);
		context.fill();
		context.closePath();*/
	}

	if(showBox) {
		context.strokeStyle = 'black';
		context.lineWidth = 2.0;
		context.beginPath();
		context.strokeRect(transX,transY,this.instanceWidth*lense.scale,this.instanceHeight*lense.scale);
		context.stroke();
		context.closePath();
		context.beginPath();
		context.strokeStyle = lense.color;
		context.strokeRect(transX+1,transY+1,this.instanceWidth*lense.scale-2,this.instanceHeight*lense.scale-2);
		context.stroke();
		context.closePath();
		context.lineWidth = 1.1;

		context.fillStyle = lense.color;
		context.beginPath();
		var x = self.paramX(ds.params[self.dimensions[0]]);
		var y = self.paramY(ds.params[self.dimensions[1]]);
		var xtrans = x-lense.scale*self.instanceWidth/2;
		var ytrans = y-lense.scale*self.instanceHeight/2;
		//context.arc(xtrans+lense.scale*this.instanceWidth/2, ytrans+lense.scale*this.instanceHeight/2, 4, 0, 2 * Math.PI);
		context.fillRect(xtrans+lense.scale*this.instanceWidth/2-4,ytrans+lense.scale*this.instanceHeight/2-4,8,8);
		context.fill();
		context.closePath();
		lense.lastPos = [x, y];

		context.strokeStyle = 'black';
		context.lineWidth = 1;
		//context.arc(xtrans+lense.scale*this.instanceWidth/2, ytrans+lense.scale*this.instanceHeight/2, 5, 0, 2 * Math.PI);
		context.strokeRect(xtrans+lense.scale*this.instanceWidth/2-5,ytrans+lense.scale*this.instanceHeight/2-5,10,10);
		context.stroke();
		context.closePath();
		context.beginPath();
		/*context.strokeStyle = 'black';
		context.lineWidth = 2;
		context.arc(xtrans+lense.scale*this.instanceWidth/2, ytrans+lense.scale*this.instanceHeight/2, 8, 0, 2 * Math.PI);
		context.stroke();
		context.closePath();*/

		var searchPos = lense.searchPosition ? lense.searchPosition : lense.position;
		context.fillStyle = lense.color;
		context.beginPath();
		var x = searchPos[0];
		var y = searchPos[1];
		var xtrans = x-lense.scale*self.instanceWidth/2;
		var ytrans = y-lense.scale*self.instanceHeight/2;
		context.arc(xtrans+lense.scale*this.instanceWidth/2, ytrans+lense.scale*this.instanceHeight/2, 8, 0, 2 * Math.PI);
		context.fill();
		context.closePath();

		context.strokeStyle = 'white';
		context.lineWidth = 2;
		context.arc(xtrans+lense.scale*this.instanceWidth/2, ytrans+lense.scale*this.instanceHeight/2, 6, 0, 2 * Math.PI);
		context.stroke();
		context.closePath();
		context.beginPath();
		context.strokeStyle = 'black';
		context.lineWidth = 2;
		context.arc(xtrans+lense.scale*this.instanceWidth/2, ytrans+lense.scale*this.instanceHeight/2, 8, 0, 2 * Math.PI);
		context.stroke();
		context.closePath();

		context.beginPath();
		context.strokeStyle = lense.color;
		context.lineWidth = 1;
		context.moveTo(searchPos[0], searchPos[1]);
		context.lineTo(lense.position[0], lense.position[1]);
		context.stroke();
		context.closePath();
	}

	if (graphProperties.show) {
		this.context.globalAlpha = 0.4;
		this.context.globalCompositeOperation = "difference";
	}
}

LineSpace.prototype.update = function() {
	var self = this;

	var extentX = [];
	var extentY = [];
	var paramExtentX = [];
	var paramExtentY = [];

	this.paramX = d3.scaleLinear().range([0, this.innerWidth]);
    this.paramY = d3.scaleLinear().range([this.innerHeight, 0]);

    this.x = d3.scaleLinear().range([0, this.instanceWidth]);
    this.y = d3.scaleLinear().range([this.instanceHeight, 0]);

	var fold10 = new KFoldCrossValidation(10, self.fullDataSet.length);
	var validator = fold10;

	self.fullDataSet.forEach(function(ds, index) {
		var graphProperties = self.getGraphProperties(self, ds);
		paramExtentX.push(graphProperties.x);
		paramExtentY.push(graphProperties.y);
		ds.extentX = d3.extent(ds.rowSet[self.rowSetIndex], function(d) { return d.x; });
		ds.extentY = d3.extent(ds.rowSet[self.rowSetIndex], function(d) { return d.y; });
		extentX.push.apply(extentX, ds.extentX);
		extentY.push.apply(extentY, ds.extentY);
	});

	var paramSet = Object.keys(self.fullDataSet[0].params).filter(function(d) {
		return !isNaN(+self.fullDataSet[0].params[d]);
	});

    paramSet.unshift('Select...');

	var options = self.xSelect
	 	.selectAll('option')
		.data(paramSet).enter()
		.append('option')
		.text(function (d) { return d; })
    self.xSelect.property('value', self.dimensions[0]);

	var options = self.ySelect
	 	.selectAll('option')
		.data(paramSet).enter()
		.append('option')
		.text(function (d) { return d; })
    self.ySelect.property('value', self.dimensions[1]);

	var options = self.valueSelect
	 	.selectAll('option')
		.data(paramSet).enter()
		.append('option')
		.text(function (d) { return d; })
    self.valueSelect.property('value', self.dimensions[2]);

	var options = self.backgroundSelect
	 	.selectAll('option')
		.data(paramSet).enter()
		.append('option')
		.text(function (d) { return d; })
    self.backgroundSelect.property('value', self.dimensions[3]);

	var options = self.opacitySelect
	 	.selectAll('option')
		.data(paramSet).enter()
		.append('option')
		.text(function (d) { return d; })
    self.opacitySelect.property('value', self.dimensions[4]);

	self.paramX.domain(d3.extent(paramExtentX, function(d) { return d; }));
	self.paramY.domain(d3.extent(paramExtentY, function(d) { return d; }));
	self.x.domain(d3.extent(extentX, function(d) { return d; }));
	self.y.domain(d3.extent(extentY, function(d) { return d; }));

	self.lenses.forEach(function(item, index) {
		item.canvas.remove();
		item.selectcanvas.remove();
		self.onRemoveLense(self, 0);
	});
	self.lenses = [];
	self.currentLenseIndex = -1;

	self.updateBackground();

	self.redraw();
}

LineSpace.prototype.changeView = function(dimensions) {
	var self = this;
	self.dimensions = dimensions;
}

LineSpace.prototype.calcBackgroundInterpolate = function(nearest) {
	var self = this;
	var val = 0;
	if (false) { // nearest neighbor
		val = +nearest[0][0][self.dimensions[3]];
	}
	else if (true) { // inverse weighted
		var w = [];
		var sum = 0;
		nearest.forEach(function(item, index) {
			var weight = 1/(Math.pow(item[1],1));
			sum += weight;
			w.push(weight);
		});		

		if (sum < 20) {
			return null;
		}

		nearest.forEach(function(item, index) {
			val += (+item[0][self.dimensions[3]])*w[index];
		});



		val /= sum;
	}

	return val;
}

LineSpace.prototype.updateBackground = function() {
	var self = this;

	this.bgcontext.clearRect(-this.margin.right, -this.margin.top, this.parentRect.width, this.parentRect.height);

	if (!(self.dimensions[3] in self.paramInfo)) {
		return;
	}

	var points = [];
	self.dataSet.forEach(function(item, index) {
		points.push(item.params);
	});


	var distance = function(a, b){
		return Math.sqrt((1.0/self.paramInfo[self.dimensions[0]].variance)*Math.pow(+a[self.dimensions[0]] - b[self.dimensions[0]], 2) +  (1.0/self.paramInfo[self.dimensions[1]].variance)*Math.pow(+a[self.dimensions[1]] - b[self.dimensions[1]], 2));
	}

	var tree = new kdTree(points, distance, [self.dimensions[0], self.dimensions[1]]);


	var colorValue = null;	

	for (var f = 0; f < self.bgImageWidth/4; f+=1) {
		for (var i = 0; i < self.bgImageHeight/4; i+=1) {

				var point = {};
				point[self.dimensions[0]] = self.paramX.invert(f*4*2);
				point[self.dimensions[1]] = self.paramY.invert(i*4*2);
				var nearest = tree.nearest(point, 10);
				nearest.sort(function(a, b){return a[1]-b[1]});

				var val = self.calcBackgroundInterpolate(nearest);

				var pInfo = self.paramInfo[self.dimensions[3]];

				if (val != null) {
					self.bgValuesTemp[f*self.bgImageHeight + i] = (val - pInfo.min)/(pInfo.max-pInfo.min);
				}
				else {
					self.bgValuesTemp[f*self.bgImageHeight + i] = null;
				}
				
				//self.bgValuesTemp[f*self.bgImageHeight + i] = 0.0;
				//self.bgValuesTemp[f*self.bgImageHeight + i] = null;
		}
	}

	for (var f = 0; f < self.bgImageWidth; f+=1) {
		for (var i = 0; i < self.bgImageHeight; i+=1) {
			self.bgValues[f*self.bgImageHeight + i] = self.bgValuesTemp[Math.floor(f/4)*self.bgImageHeight + Math.floor(i/4)];
			if (self.bgValues[f*self.bgImageHeight + i] != null) {
				colorValue = self.colorMapPicker2.getColor(self.bgValues[f*self.bgImageHeight + i]);
				self.setPixelValue(self.bgcontext, f+self.margin.left/2, i+self.margin.top/2, colorValue[0], colorValue[1], colorValue[2], colorValue[3]);
			}
		}
	}
	self.drawBackgroundFeatures();

	if (!self.bgVersion) { self.bgVersion = 0; }
	self.bgVersion++;

	var q = d3.queue();
	for (var sample1 = 0; sample1 < 50; sample1++) {
		for (var sample2 = 0; sample2 < 50; sample2++) {

			q.defer(function(callback) {
				var s1 = sample1;
				var s2 = sample2;
				var ver = self.bgVersion;
				setTimeout(function() {
					if (ver == self.bgVersion && (self.dimensions[3] in self.paramInfo)) {
						for (var f = s1; f < self.bgImageWidth; f+=50) {
							for (var i = s2; i < self.bgImageHeight; i+=50) {

							   	if ((f % 1 == 0) && (i % 1 == 0)) {
									var point = {};
									point[self.dimensions[0]] = self.paramX.invert(f*2);
									point[self.dimensions[1]] = self.paramY.invert(i*2);
									var nearest = tree.nearest(point, 10);
									nearest.sort(function(a, b){return a[1]-b[1]});

									var val = self.calcBackgroundInterpolate(nearest);

									var pInfo = self.paramInfo[self.dimensions[3]];

									if (val != null) {
										self.bgValues[f*self.bgImageHeight + i] = (val - pInfo.min)/(pInfo.max-pInfo.min);
									}
									else {
										self.bgValues[f*self.bgImageHeight + i] = null;
									}
								}
							}
						}
					}
					
					callback(null); 
				}, 200);
							
			});

		}
	}

	q.awaitAll(function(error) {
		console.log("done");
		self.redrawBackground();
	});
}

LineSpace.prototype.redrawBackground = function() {
	var self = this;

	this.bgcontext.clearRect(-this.margin.right, -this.margin.top, this.parentRect.width, this.parentRect.height);

	if (!(self.dimensions[3] in self.paramInfo)) {
		self.featureContext.beginPath();
		self.featureContext.clearRect(0,0,self.parentRect.width*self.pixelRatio,self.parentRect.height*self.pixelRatio);
		self.featureContext.stroke();
		return;
	}

	for (var f = 0; f < self.bgImageWidth; f++) {
		for (var i = 0; i < self.bgImageHeight; i++) {
			if (self.bgValues[f*self.bgImageHeight + i] != null) {
				var colorValue = self.colorMapPicker2.getColor(self.bgValues[f*self.bgImageHeight + i]);
				self.setPixelValue(self.bgcontext, f+self.margin.left/2, i+self.margin.top/2, colorValue[0], colorValue[1], colorValue[2], colorValue[3]);
			}
		}
	}

	self.drawBackgroundFeatures();
}

LineSpace.prototype.drawBackgroundFeatures = function() {
	var self = this;

	tracking.Fast.THRESHOLD = 5;

	var width = Math.floor(1+self.bgImageWidth/16)*16;
	var height = Math.floor(1+self.bgImageHeight/16)*16;
	var imageData = self.bgcontext.getImageData(self.margin.left/2, self.margin.top/2, width, height);
	var gray = tracking.Image.grayscale(imageData.data, width, height);
	var corners = tracking.Fast.findCorners(gray, width, height);

	self.featureContext.beginPath();
	self.featureContext.clearRect(0,0,self.parentRect.width*self.pixelRatio,self.parentRect.height*self.pixelRatio);
	self.featureContext.stroke();

	for (var i = 0; i < corners.length; i += 2) {
		if (corners[i] <= self.bgImageWidth && corners[i+1] <= self.bgImageHeight) {
	        self.featureContext.lineWidth = 1;
	        self.featureContext.strokeStyle = 'darkred';
	        self.featureContext.beginPath();
	        self.featureContext.strokeRect(corners[i]*2, corners[i + 1]*2, 3, 3);
	        self.featureContext.stroke();
		}
    }
}

LineSpace.prototype.redraw = function() {
	var self = this;
	this.context.clearRect(-this.margin.right, -this.margin.top, this.parentRect.width, this.parentRect.height);


	var querySet = [];

	this.query.forEach(function(item, index) {
		querySet.push(self.dataSet[item]);
	});

	querySet.sort(function(a, b){
		return self.getGraphProperties(self, a).value - self.getGraphProperties(self, b).value;
	});

	querySet.forEach(function(item, index) {
		var ds = item;
		self.drawLines({context: self.context, scale: 1.0, prevScale: 1.0}, ds);
	});
	
	self.xAxis(this.context);
	self.yAxis(this.context);
}

LineSpace.prototype.redrawLenses = function() {
	var self = this;
	self.lenses.forEach(function(lense, index) {
		self.redrawLense(lense);
	});
}

LineSpace.prototype.redrawLense = function(lense) {
	var self = this;

	var x = lense.x ? lense.x : lense.position[0] + self.margin.left;
	var y = lense.y ? lense.y : lense.position[1] + self.margin.top;

	self.interpolate(x, y, lense);
}

// This draws the xAxis
LineSpace.prototype.xAxis = function(context) {
	var self = this;
	var tickCount = 10,
		tickSize = 6,
		ticks = self.paramX.ticks(tickCount),
		tickFormat = self.paramX.tickFormat();

	var internalHeight = self.parentRect.height - self.instanceHeight;
	var internalWidth = self.parentRect.width - self.instanceWidth;

	context.fillStyle = 'black';
	context.beginPath();
	ticks.forEach(function(d) {
		context.moveTo(self.paramX(d), internalHeight);
		context.lineTo(self.paramX(d), internalHeight + tickSize);
	});
	context.strokeStyle = "black";
	context.stroke();

	context.beginPath();
	context.moveTo(0, internalHeight+tickSize);
	context.lineTo(0, internalHeight);
	context.lineTo(internalWidth, internalHeight);
	context.lineTo(internalWidth, internalHeight+tickSize);
	context.strokeStyle = "black";
	context.stroke();

	context.textAlign = "center";
	context.textBaseline = "top";
	ticks.forEach(function(d) {
		context.fillText(tickFormat(d), self.paramX(d), internalHeight + tickSize);
	});
}

// This draws the yAxis
LineSpace.prototype.yAxis = function(context) {
	var self = this;
	var tickCount = 10,
		tickSize = 6,
		tickPadding = 3,
		ticks = self.paramY.ticks(tickCount),
		tickFormat = self.paramY.tickFormat(tickCount);

	var internalHeight = self.parentRect.height - self.instanceHeight;

	context.fillStyle = 'black';
	context.beginPath();
	ticks.forEach(function(d) {
		context.moveTo(0, self.paramY(d));
		context.lineTo(-6, self.paramY(d));
	});
	context.strokeStyle = "black";
	context.stroke();

	context.beginPath();
	context.moveTo(-tickSize, 0);
	context.lineTo(0.5, 0);
	context.lineTo(0.5, internalHeight);
	context.lineTo(-tickSize, internalHeight);
	context.strokeStyle = "black";
	context.stroke();

	context.textAlign = "right";
	context.textBaseline = "middle";
	ticks.forEach(function(d) {
		context.fillText(tickFormat(d), -tickSize - tickPadding, self.paramY(d));
	});

	context.save();
	context.rotate(-Math.PI / 2);
	context.textAlign = "right";
	context.textBaseline = "top";
	context.font = "bold 10px sans-serif";
	context.restore();
}
