'use strict'

function LineSpace(parent, getGraphProperties, interpolateFunctions) {
	var self = this;
    
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
    
    //console.log(this.pixelRatio);

	self.getGraphProperties = getGraphProperties;
	self.interpolateFunctions = interpolateFunctions;

	this.parent = parent;
	this.parent.attr("style", "position:relative;left:0px;top:0px;background-color:white");
	this.parentRect = parent.node().getBoundingClientRect();
	this.canvas = parent.append("canvas")
		.attr('width', this.parentRect.width*this.pixelRatio)
		.attr('height', this.parentRect.height*this.pixelRatio)
		.attr("style", "z-index: 1;position:relative;left:0px;top:0px;");
	this.context = this.canvas.node().getContext("2d");
    this.context.scale(self.pixelRatio,self.pixelRatio);
    this.canvas.style("width", ''+this.parentRect.width +'px');
    this.canvas.style("height", ''+this.parentRect.height +'px');
    this.context.clearRect(0, 0, this.parentRect.width, this.parentRect.height);
	this.context.globalAlpha = 0.4;
	this.context.globalCompositeOperation = "difference";

    this.instanceWidth = self.parentRect.width/8;
    this.instanceHeight = self.parentRect.height/8;
	this.margin = {top: this.instanceHeight/2, right: this.instanceWidth/2, bottom: this.instanceHeight/2, left: this.instanceWidth/2};

	this.bgcanvas = parent.append("canvas")
		.attr('width', this.parentRect.width*this.pixelRatio)
		.attr('height', this.parentRect.height*this.pixelRatio)
		.attr("style", "z-index: 0;position:absolute;left:0px;top:0px;");
	this.bgcontext = this.bgcanvas.node().getContext("2d");
    this.bgcontext.scale(self.pixelRatio,self.pixelRatio);
    this.bgcanvas.style("width", ''+this.parentRect.width +'px');
    this.bgcanvas.style("height", ''+this.parentRect.height +'px');
    this.bgcontext.clearRect(0, 0, this.parentRect.width, this.parentRect.height);
	this.bgcontext.globalAlpha = 0.4;
	this.bgcontext.globalCompositeOperation = "difference";

	this.bgValues = [];
	this.bgValuesTemp = [];
	this.bgImageWidth = (this.parentRect.width-this.margin.left)*this.pixelRatio;
	this.bgImageHeight = (this.parentRect.height-this.margin.top)*this.pixelRatio;
	for (var f = 0; f < this.bgImageWidth*this.bgImageHeight; f++) {
		this.bgValues.push(0.0);
		this.bgValuesTemp.push(0.0);
	}

	// Image data
	this.imageData = this.bgcontext.createImageData(1,1);
	this.imageDataVal = this.imageData.data;


    this.context.translate(this.margin.right, this.margin.top);
    this.innerWidth = this.parentRect.width - this.instanceWidth;
    this.innerHeight = this.parentRect.height - this.instanceHeight;

   	/*this.overlayCanvas = parent.append("canvas")
		.attr('width', this.parentRect.width)
		.attr('height', this.parentRect.width)
		.attr("style", "z-index: 1;position:absolute;left:0px;top:0px;cursor: default");
	this.overlayContext = this.overlayCanvas.node().getContext("2d");
	this.overlayContext.translate(this.margin.right, this.margin.top);
	this.overlayContext.fillStyle = "green";
	this.overlayContext.lineWidth = 1.0;
	this.overlayContext.globalAlpha = 1.0;
	this.overlayContext.globalCompositeOperation = "difference";*/
	this.lenses = [];
    this.cursorPosition = [0,0];
    this.currentLenseIndex = -1;

    this.interpolating = false;
    this.resizable = false;
    this.removeable = false;
    this.resizing = false;
    this.canManipulate = false;
    this.manipulating = false;
    this.manipInterpIndex = -1;
    this.manipOutputIndex = -1;
    this.query = [];

    this.actionCanvas = parent.append("canvas")
		.attr('width', this.parentRect.width*this.pixelRatio)
		.attr('height', this.parentRect.height*this.pixelRatio)
		.attr("style", "z-index: 3;position:absolute;left:0px;top:0px;cursor: default");
    this.actionCanvas.style("width", ''+this.parentRect.width +'px');
    this.actionCanvas.style("height", ''+this.parentRect.height +'px');

	this.actionCanvas.on("mousedown", function() {
		self.cursorPosition = [d3.event.offsetX-self.margin.right, d3.event.offsetY-self.margin.top];

		self.currentLenseIndex = -1;
		var lense = null;
		for (var f = 0; f < self.lenses.length; f++) {
			lense = self.lenses[f];
			if (Math.abs(self.cursorPosition[0] - lense.position[0]) <= lense.scale*lense.width/2 &&
				Math.abs(self.cursorPosition[1] - lense.position[1]) <= lense.scale*lense.height/2) {
				self.currentLenseIndex = f;
				break;
			}
		}

		if (self.currentLenseIndex < 0) {
			lense = {width: self.instanceWidth, height: self.instanceHeight};
			var canvas = parent.append("canvas")
				.attr('width', self.parentRect.width*self.pixelRatio)
				.attr('height', self.parentRect.height*self.pixelRatio)
				.attr('class', 'lense')
				.attr("style", "z-index: 2;position:absolute;left:0px;top:0px;cursor: default");
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
			lense.prevScale = 1.0;
			lense.scale = 1.0;
			lense.position = [self.cursorPosition[0],self.cursorPosition[1]];
			lense.interpResults = [];
			lense.interpParameters = [];
			self.interpolateFunctions.forEach(function(item, index) {
				lense.interpParameters.push({});
			});
			self.lenses.push(lense);
			self.currentLenseIndex = self.lenses.length-1;
		}

		if (self.removeable) {
			lense.canvas.remove();
			self.lenses.splice(self.currentLenseIndex,1);
			return;
		}

		if (self.resizable) {
			self.resizing = true;
		}

		if (self.canManipulate) {
			self.handleManipulate(d3.event);
			self.manipulating = true;
		}

		if (self.resizing) {
			self.handleResize(d3.event);
		}
		else if (self.manipulating) {

		}
		else if (Math.abs(Math.abs(self.cursorPosition[0] - lense.position[0])) < lense.width/15 && 
				Math.abs(self.cursorPosition[1] - lense.position[1]) < lense.height/15) {
	    	self.handleInterpolate(d3.event);
		}
    });

    this.actionCanvas.on("mouseup", function() {
    	if (self.interpolating) {
		    self.handleInterpolate(d3.event);
		    self.cursorPosition = [d3.event.offsetX-self.margin.right, d3.event.offsetY-self.margin.top];
			self.lenses[self.currentLenseIndex].position = [self.cursorPosition[0],self.cursorPosition[1]];
		}
		else if (self.resizing) {
			self.handleResize(d3.event);
			self.resizing = false;
		}
		else if (self.manipulating) {
			self.handleManipulate(d3.event);
			//self.lenses[self.currentLenseIndex].interpParameters[self.manipInterpIndex] = {};
			self.manipulating = false;
		}
    });

    this.actionCanvas.on("mousemove", function() {
    	if (self.dataSet) {
    		if (self.interpolating) {
	    		self.interpolate(d3.event.offsetX, d3.event.offsetY, self.lenses[self.currentLenseIndex]);
		    	//self.overlayContext.clearRect(self.cursorPosition[0]-self.instanceWidth/2-2, self.cursorPosition[1]-self.instanceHeight/2-2, self.instanceWidth+4, self.instanceHeight+4);
		    	self.cursorPosition = [d3.event.offsetX-self.margin.right, d3.event.offsetY-self.margin.top];

				self.lenses[self.currentLenseIndex].position = [self.cursorPosition[0],self.cursorPosition[1]];
	    	}
	    	else if (self.resizing) {
	    		self.handleResize(d3.event);
	    	}
	    	else if (self.manipulating) {
	    		self.handleManipulate(d3.event);
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
							//self.actionCanvas.style("cursor", "nesw-resize");
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
								var j = item.ds.rows.length-1;
								while (i < j) {
									var m = Math.floor((i+j)/2);
									if (xVal > item.ds.rows[m].x) {
										i = m + 1;
									}
									else {
										j = m;
									}
								}

								//console.log(xVal, item.ds.rows[i].x, item.ds.rows[i].y, yVal);
								var foundY = item.ds.rows[i].y;

								if (Math.abs(yVal - foundY) < (self.y.domain()[1]-self.y.domain()[0])*0.02) {
									self.actionCanvas.style("cursor", "crosshair");
									found = true;
									self.manipInterpIndex = index;
									self.manipOutputIndex = i;
									self.canManipulate = true;
								}
							});
							//console.log(self.x.domain(),self.y.domain(),self.x.invert(x/lense.scale+transX), self.y.invert(y/lense.scale+transY), lense.interpResults[0].ds.rows.length);
						}

						break;
					}
				}

				if (!found) {
					self.actionCanvas.style("cursor", "default");
				}
	    	}
    	}
    });

    this.showAll = false;

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

    self.colorMapPicker = new ColorMapPicker(selectDiv, "images/color_maps/ColorMaps.csv", function() { self.onColorMapChange();})
    self.colorMapPicker2 = new ColorMapPicker(selectDiv, "images/color_maps/ColorMaps2.csv", function() {self.redrawBackground();})
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
	self.query = query;
	if (self.dataSet) {
		self.redraw();
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
	    self.interpolate(d3.event.offsetX, d3.event.offsetY, self.lenses[self.currentLenseIndex]);
	}
	self.actionCanvas.style("cursor", self.interpolating ? "crosshair" : "default");
	//self.overlayCanvas.style("cursor", self.interpolating ? "none" : "default");
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
	var x = lense.position[0] + self.margin.left;
	var y = lense.position[1] + self.margin.top;
	var xPos = d3.event.offsetX-self.margin.right - lense.position[0];
	var yPos = d3.event.offsetY-self.margin.top - lense.position[1];
	var transX = lense.width/2;
	var transY = lense.height/2;
	var xVal = self.x.invert(xPos/lense.scale+transX);
	var yVal = self.y.invert(yPos/lense.scale+transY);
	lense.interpParameters[self.manipInterpIndex]["output_" + self.manipOutputIndex] = yVal;
	//console.log(self.manipOutputIndex, xVal, yVal);
	self.interpolate(x, y, lense);
} 

LineSpace.prototype.interpolate = function(x, y, lense) {
	var self = this;


	var context = lense.context;
	var prevPosition = lense.position;
	context.beginPath();
	context.clearRect(prevPosition[0]-lense.prevScale*self.instanceWidth/2-2, prevPosition[1]-lense.prevScale*self.instanceHeight/2-2, lense.prevScale*self.instanceWidth+4, lense.prevScale*self.instanceHeight+4);
	context.stroke();
	context.closePath();
	context.beginPath();
	context.globalAlpha = 0.8;
	context.fillStyle = 'white';
	context.globalCompositeOperation = "difference";
	context.fillRect(x-self.margin.right-lense.scale*self.instanceWidth/2,y-self.margin.top-lense.scale*self.instanceHeight/2,this.instanceWidth*lense.scale,this.instanceHeight*lense.scale);
	context.stroke();
	context.closePath();
	context.globalAlpha = 1.0;
	context.globalCompositeOperation = "source-over";
	var pSet = [self.dimensions[0], self.dimensions[1]];
	var tempParams = {};
	tempParams[self.dimensions[0]] = self.paramX.invert(x-self.margin.right);
	tempParams[self.dimensions[1]] = self.paramY.invert(y-self.margin.top);
	var tempDs = {params: tempParams};
   	var dsDist = calcDistance(tempDs, self.dataSet, pSet, function(item) { return 1.0/self.paramInfo[item].variance; }, weightedEclideanDistance, 2);

	var weightSum = 0;
	for (var f = 0; f < 5; f++) {
		weightSum+= dsDist[f].weight;
	 }

	for (var f = 0; f < 5; f++) {
		context.globalAlpha = dsDist[f].weight/weightSum;
	 	self.drawLines(lense, self.dataSet[dsDist[f].id], 'black', false, true, 
	 		{x: +tempParams[self.dimensions[0]], y: +tempParams[self.dimensions[1]], value: 0, show: true}, true);
	}

	var interpResults = [];
	self.interpolateFunctions.forEach(function(item, functionIndex) {
		var query = {};
		query[self.dimensions[0]] = self.paramX.invert(x-self.margin.right);
		query[self.dimensions[1]] = self.paramY.invert(y-self.margin.top);
		var lenseQueryParams = Object.keys(lense.interpParameters[functionIndex]);
		lenseQueryParams.forEach(function(item, index) {
			query[item] = lense.interpParameters[functionIndex][item];
		});
		//query["output"] = 483;
	 	var interp = item(query);
	 	interpResults.push(interp);
	});
	context.globalAlpha = 1.0;
	lense.interpResults = interpResults;
	interpResults.forEach(function(interp, index) {
		self.drawLines(lense, interp.ds, interp.color, index == 0, false, null, true);
	});

	self.colorMapPicker.getColor(0.5);
}

LineSpace.prototype.data = function(dataSet) {
	var self = this;

	this.dataSet = dataSet;

   	self.paramInfo = calcParamInfo(self.dataSet);
	//self.paramInfo["output"] = calcStatistics(self.dataSet, function(d) { return d.rows[512].y; });


	var paramSet = Object.keys(dataSet[0].params).filter(function(d) {
		return !isNaN(+dataSet[0].params[d]);
	});
	self.dimensions = [paramSet[0], paramSet[1], paramSet[2]];

	var options = self.xSelect
	 	.selectAll('option')
		.data(paramSet).enter()
		.append('option')
		.text(function (d) { return d; })
    	.property("selected", function(d){ return d === self.dimensions[0]; });

	var options = self.ySelect
	 	.selectAll('option')
		.data(paramSet).enter()
		.append('option')
		.text(function (d) { return d; })
    	.property("selected", function(d){ return d === self.dimensions[1]; });

    self.update();
}

LineSpace.prototype.drawLines = function(lense, ds, color, showBox, forceShow, localCoords, noPoint) {
	var self = this;

	var context = lense.context;
	var graphProperties = self.getGraphProperties(ds);
	if(localCoords) {
		graphProperties = localCoords;
	}

	var transX = self.paramX(graphProperties.x)-lense.scale*self.instanceWidth/2;
	var transY = self.paramY(graphProperties.y)-lense.scale*self.instanceHeight/2;
	context.translate(transX, transY);

	if (color) {
		context.strokeStyle = color;
	}
	else if (graphProperties.show) {
		//context.strokeStyle = 'rgb('+(graphProperties.value*(255))+','+0+','+0+')';//color;
		context.strokeStyle = 'black'
		//context.lineWidth = 2;
		this.context.globalAlpha = 1;
		//context.strokeStyle = 'black';//color;
	}
	else {
		context.strokeStyle = 'grey';//'#f1f9fa';
	}

	//console.log(graphProperties.show, graphProperties.value);
	if (self.showAll || graphProperties.show || forceShow) {
		context.beginPath();
		ds.rows.forEach(function(item, index) {
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

	context.translate(-transX, -transY);


	//context.strokeRect(this.instanceWidth/2,this.instanceHeight/2,1,1);
	if (!graphProperties.show) {
		var colorValue = self.colorMapPicker.getColor(graphProperties.value);
		var c = 'rgba('+colorValue[0]+','+colorValue[1]+','+colorValue[2]+','+colorValue[3]+')';
		context.fillStyle = c;
		//context.fillStyle = 'rgb('+(graphProperties.value*(255))+','+0+','+0+')';//'blue';//color;
		$('.pCoordChart .resultPaths path[index="'+graphProperties.index+'"]').css('stroke', c);
	}

	if (!noPoint) {
		this.context.globalAlpha = 1.0;
		this.context.globalCompositeOperation = "source-over";
		context.beginPath()
		context.arc(transX+lense.scale*this.instanceWidth/2, transY+lense.scale*this.instanceHeight/2, 5, 0, 2 * Math.PI);
		context.fill();
		context.closePath();
		//context.fillRect(transX+this.instanceWidth/2-1,transY+this.instanceHeight/2-1,3,3);
		//context.stroke();
	}
	else {
		context.fillStyle = 'black';
		context.beginPath()
		context.arc(transX+lense.scale*this.instanceWidth/2, transY+lense.scale*this.instanceHeight/2, 3, 0, 2 * Math.PI);
		context.fill();
		context.closePath();
	}

	if(showBox) {
		context.strokeStyle = 'black';
		context.lineWidth = 2.0;
		context.beginPath();
		context.strokeRect(transX,transY,this.instanceWidth*lense.scale,this.instanceHeight*lense.scale);
		context.stroke();
		context.closePath();
		context.lineWidth = 1.1;
	}

	if (graphProperties.show) {
		//context.lineWidth = 1;
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

	self.dataSet.forEach(function(ds, index) {
		var graphProperties = self.getGraphProperties(ds);
		paramExtentX.push(graphProperties.x);
		paramExtentY.push(graphProperties.y);
		ds.extentX = d3.extent(ds.rows, function(d) { return d.x; });
		ds.extentY = d3.extent(ds.rows, function(d) { return d.y; });
		extentX.push.apply(extentX, ds.extentX);
		extentY.push.apply(extentY, ds.extentY);

		/*var interpResults = [];
		self.interpolateFunctions.forEach(function(item, index) {
			var query = {};
			query[self.dimensions[0]] = graphProperties.x;
			query[self.dimensions[1]] = graphProperties.y;
		 	var interp = item(query);
		 	interpResults.push(interp.error);
		});

		var averageError = average(interpResults);
		ds.params["Error"] = averageError;*/
	});

	//self.paramInfo["Error"] = calcStatistics(self.dataSet, function(d) { return d.params.Error; });
	//self.paramInfo["Error"].dynamic = true;

	var paramSet = Object.keys(self.dataSet[0].params).filter(function(d) {
		return !isNaN(+self.dataSet[0].params[d]);
	});

	var options = self.valueSelect
	 	.selectAll('option')
		.data(paramSet).enter()
		.append('option')
		.text(function (d) { return d; })
    	.property("selected", function(d){ return d === self.dimensions[2]; });

	self.paramX.domain(d3.extent(paramExtentX, function(d) { return d; }));
	self.paramY.domain(d3.extent(paramExtentY, function(d) { return d; }));
	self.x.domain(d3.extent(extentX, function(d) { return d; }));
	self.y.domain(d3.extent(extentY, function(d) { return d; }));

	self.lenses.forEach(function(item, index) {
		item.canvas.remove();
	});
	self.lenses = [];
	self.currentLenseIndex = -1;

	self.updateBackground();

	self.redraw();
}

LineSpace.prototype.updateBackground = function() {
	var self = this;
	/*	var points = [
  {x: 1, y: 2},
  {x: 3, y: 4},
  {x: 5, y: 6},
  {x: 7, y: 8}
];*/
	var points = [];
	self.dataSet.forEach(function(item, index) {
		points.push(item.params);
	});


	var distance = function(a, b){
	  return Math.pow(+a[self.dimensions[0]] - b[self.dimensions[0]], 2) +  Math.pow(+a[self.dimensions[1]] - b[self.dimensions[1]], 2);
	}

	var tree = new kdTree(points, distance, [self.dimensions[0], self.dimensions[1]]);


//console.log(nearest);
	var colorValue = null;	
	this.bgcontext.clearRect(-this.margin.right, -this.margin.top, this.parentRect.width, this.parentRect.height);

	for (var f = 0; f < (self.parentRect.width*self.pixelRatio - self.instanceWidth*self.pixelRatio)/4; f+=1) {
		for (var i = 0; i < (self.parentRect.height*self.pixelRatio - self.instanceHeight*self.pixelRatio)/4; i+=1) {

				var point = {};
				point[self.dimensions[0]] = self.paramX.invert(f*4);
				point[self.dimensions[1]] = self.paramY.invert(i*4);
				var nearest = tree.nearest(point, 1);
				//console.log(self.parentRect.width - self.instanceWidth, i, f, self.paramX.invert(i), self.paramY.invert(f), nearest[0][0]);

				var val = +nearest[0][0][self.dimensions[2]];
				var pInfo = self.paramInfo[self.dimensions[2]];

				//console.log(nearest, nearest[0][0], val, pInfo);
				self.bgValuesTemp[f*self.bgImageHeight + i] = (val - pInfo.min)/(pInfo.max-pInfo.min);
				//colorValue = self.colorMapPicker2.getColor(self.bgValues[f*self.bgImageHeight + i]);
		   	//}
			//self.setPixelValue(self.bgcontext, f+self.margin.left, i+self.margin.top, colorValue[0], colorValue[1], colorValue[2], colorValue[3]);
		}
	}

	for (var f = 0; f < self.parentRect.width*self.pixelRatio - self.instanceWidth*self.pixelRatio; f+=1) {
		for (var i = 0; i < self.parentRect.height*self.pixelRatio - self.instanceHeight*self.pixelRatio; i+=1) {
			self.bgValues[f*self.bgImageHeight + i] = self.bgValuesTemp[Math.floor(f/4)*self.bgImageHeight + Math.floor(i/4)];
			colorValue = self.colorMapPicker2.getColor(self.bgValues[f*self.bgImageHeight + i]);
			self.setPixelValue(self.bgcontext, f+self.margin.left, i+self.margin.top, colorValue[0], colorValue[1], colorValue[2], colorValue[3]);
		}
	}

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
					if (ver == self.bgVersion) {
						for (var f = s1; f < (self.parentRect.width*self.pixelRatio - self.instanceWidth*self.pixelRatio); f+=50) {
							for (var i = s2; i < (self.parentRect.height*self.pixelRatio - self.instanceHeight*self.pixelRatio); i+=50) {

							   	if ((f % 1 == 0) && (i % 1 == 0)) {
							   	//if ((f*self.bgImageHeight + i) % 5 == 0) {
									var point = {};
									point[self.dimensions[0]] = self.paramX.invert(f);
									point[self.dimensions[1]] = self.paramY.invert(i);
									var nearest = tree.nearest(point, 1);
									//console.log(self.parentRect.width - self.instanceWidth, i, f, self.paramX.invert(i), self.paramY.invert(f), nearest[0][0]);

									var val = +nearest[0][0][self.dimensions[2]];
									var pInfo = self.paramInfo[self.dimensions[2]];

									//console.log(nearest, nearest[0][0], val, pInfo);
									self.bgValues[f*self.bgImageHeight + i] = (val - pInfo.min)/(pInfo.max-pInfo.min);
									//colorValue = self.colorMapPicker2.getColor(self.bgValues[f*self.bgImageHeight + i]);
							   	//}
								//self.setPixelValue(self.bgcontext, f+self.margin.left, i+self.margin.top, colorValue[0], colorValue[1], colorValue[2], colorValue[3]);
								}
							}
						}
					}
					
					callback(null); 
				}, 200);
							
			});

		}
	}
	/*for (var sample1 = 0; sample1 < 20; sample1++) {
		for (var sample2 = 0; sample2 < 20; sample2++) {

			q.defer(function(callback) {
				var s1 = sample1;
				var s2 = sample2;
				setTimeout(function() {
					for (var f = s1; f < (self.parentRect.width*self.pixelRatio - self.instanceWidth*self.pixelRatio); f+=1) {
						for (var i = s2; i < (self.parentRect.height*self.pixelRatio - self.instanceHeight*self.pixelRatio); i+=1) {

						   	if ((f % 1 == 0) && (i % 1 == 0)) {
						   	//if ((f*self.bgImageHeight + i) % 5 == 0) {
								var point = {};
								point[self.dimensions[0]] = self.paramX.invert(f);
								point[self.dimensions[1]] = self.paramY.invert(i);
								var nearest = tree.nearest(point, 1);
								//console.log(self.parentRect.width - self.instanceWidth, i, f, self.paramX.invert(i), self.paramY.invert(f), nearest[0][0]);

								var val = +nearest[0][0][self.dimensions[2]];
								var pInfo = self.paramInfo[self.dimensions[2]];

								//console.log(nearest, nearest[0][0], val, pInfo);
								self.bgValues[f*self.bgImageHeight + i] = (val - pInfo.min)/(pInfo.max-pInfo.min);
								colorValue = self.colorMapPicker2.getColor(self.bgValues[f*self.bgImageHeight + i]);
						   	//}
							self.setPixelValue(self.bgcontext, f+self.margin.left, i+self.margin.top, colorValue[0], colorValue[1], colorValue[2], colorValue[3]);
							}
						}
					}
					callback(null); 
				}, 200);
							
			});

		}
	}*/
	q.awaitAll(function(error) {
		console.log("done");
		self.redrawBackground();
	});
}

LineSpace.prototype.redrawBackground = function() {
	var self = this;
	for (var f = 0; f < self.parentRect.width*self.pixelRatio - self.instanceWidth*self.pixelRatio; f++) {
		for (var i = 0; i < self.parentRect.height*self.pixelRatio - self.instanceHeight*self.pixelRatio; i++) {
			var colorValue = self.colorMapPicker2.getColor(self.bgValues[f*self.bgImageHeight + i]);
			self.setPixelValue(self.bgcontext, f+self.margin.left, i+self.margin.top, colorValue[0], colorValue[1], colorValue[2], colorValue[3]);
		}
	}
}

LineSpace.prototype.redraw = function() {
	var self = this;
	this.context.clearRect(-this.margin.right, -this.margin.top, this.parentRect.width, this.parentRect.height);

	//console.log(colorValue);

	this.query.forEach(function(item, index) {
		var ds = self.dataSet[item];
		self.drawLines({context: self.context, scale: 1.0, prevScale: 1.0}, ds);
	});
	//self.overlayContext.clearRect(self.cursorPosition[0]-self.instanceWidth/2-2, self.cursorPosition[1]-self.instanceHeight/2-2, self.instanceWidth+4, self.instanceHeight+4);
	
	self.xAxis(this.context);
	self.yAxis(this.context);
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
