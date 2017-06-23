'use strict'

function LineSpace(parent, getGraphProperties, interpolateFunctions) {
	var self = this;

	self.getGraphProperties = getGraphProperties;
	self.interpolateFunctions = interpolateFunctions;

	this.parent = parent;
	this.parent.attr("style", "position:relative;left:0px;top:0px;background-color:white");
	this.parentRect = parent.node().getBoundingClientRect();
	this.canvas = parent.append("canvas")
		.attr('width', this.parentRect.width)
		.attr('height', this.parentRect.height)
		.attr("style", "z-index: 0;position:relative;left:0px;top:0px;");
	this.context = this.canvas.node().getContext("2d");
    this.context.clearRect(0, 0, this.parentRect.width, this.parentRect.height);
	this.context.globalAlpha = 0.4;
	this.context.globalCompositeOperation = "difference";

    this.instanceWidth = self.parentRect.width/8;
    this.instanceHeight = self.parentRect.height/8;

    this.margin = {top: this.instanceHeight/2, right: this.instanceWidth/2, bottom: this.instanceHeight/2, left: this.instanceWidth/2};
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
    this.resizing = false;

    this.actionCanvas = parent.append("canvas")
		.attr('width', this.parentRect.width)
		.attr('height', this.parentRect.width)
		.attr("style", "z-index: 2;position:absolute;left:0px;top:0px;cursor: default");

	this.actionCanvas.on("mousedown", function() {
		self.cursorPosition = [d3.event.offsetX-self.margin.right, d3.event.offsetY-self.margin.top];

		self.currentLenseIndex = -1;
		var lense = null;
		for (var f = 0; f < self.lenses.length; f++) {
			lense = self.lenses[f];
			if (Math.abs(self.cursorPosition[0] - lense.position[0]) <= lense.width/2 &&
				Math.abs(self.cursorPosition[1] - lense.position[1]) <= lense.height/2) {
				self.currentLenseIndex = f;
				break;
			}
		}

		if (self.resizable) {
			self.resizing = true;
		}

		if (self.currentLenseIndex < 0) {
			lense = {width: self.instanceWidth, height: self.instanceHeight};
			var canvas = parent.append("canvas")
				.attr('width', self.parentRect.width)
				.attr('height', self.parentRect.width)
				.attr('class', 'lense')
				.attr("style", "z-index: 1;position:absolute;left:0px;top:0px;cursor: default");
			var context = canvas.node().getContext("2d");
			context.translate(self.margin.right, self.margin.top);
			context.fillStyle = "green";
			context.lineWidth = 1.0;
			context.globalAlpha = 1.0;
			context.globalCompositeOperation = "difference";
			lense.canvas = canvas;
			lense.context = context;
			lense.position = [self.cursorPosition[0],self.cursorPosition[1]];
			self.lenses.push(lense);
			self.currentLenseIndex = self.lenses.length-1;
		}
		

	    self.handleInterpolate(d3.event);

		lense.position = [self.cursorPosition[0],self.cursorPosition[1]];
    });

    this.actionCanvas.on("mouseup", function() {
	    self.handleInterpolate(d3.event);
	    self.cursorPosition = [d3.event.offsetX-self.margin.right, d3.event.offsetY-self.margin.top];

		self.lenses[self.currentLenseIndex].position = [self.cursorPosition[0],self.cursorPosition[1]];
    });

    this.actionCanvas.on("mousemove", function() {
    	if (self.dataSet) {
    		if (self.interpolating) {
    			var position = self.lenses[self.currentLenseIndex].position;
	    		self.interpolate(d3.event.offsetX, d3.event.offsetY, self.lenses[self.currentLenseIndex].context, position);
		    	//self.overlayContext.clearRect(self.cursorPosition[0]-self.instanceWidth/2-2, self.cursorPosition[1]-self.instanceHeight/2-2, self.instanceWidth+4, self.instanceHeight+4);
		    	self.cursorPosition = [d3.event.offsetX-self.margin.right, d3.event.offsetY-self.margin.top];

				self.lenses[self.currentLenseIndex].position = [self.cursorPosition[0],self.cursorPosition[1]];
	    	}
	    	else {
				self.resizable = false;
				var lense = null;
				for (var f = 0; f < self.lenses.length; f++) {
					lense = self.lenses[f];
					var x = d3.event.offsetX-self.margin.right - lense.position[0];
					var y = d3.event.offsetY-self.margin.top - lense.position[1];
					if ((Math.abs(x) <= lense.width/2 &&
						Math.abs(x) >= lense.width/2-5) ||
						(Math.abs(y) <= lense.height/2 &&
						Math.abs(y) >= lense.height/2-5)) {
						self.actionCanvas.style("cursor", "nesw-resize");
						self.resizable = true;
						break;
					}
					else if (Math.abs(x) <= lense.width/2 && Math.abs(y) <= lense.height/2) {
						self.actionCanvas.style("cursor", "move");
						break;
					}
					else {
						self.actionCanvas.style("cursor", "default");
					}
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

    self.colorMapPicker = new ColorMapPicker(selectDiv, "images/color_maps/ColorMaps.csv", function() { self.onColorMapChange();})
}

LineSpace.prototype.onColorMapChange = function() {
	var self = this;
	self.redraw();
}

LineSpace.prototype.handleInterpolate = function(event) {
	var self = this;
	self.interpolating = !self.interpolating;
	if(self.interpolating) {
		var position = self.lenses[self.currentLenseIndex].position;
	    self.interpolate(d3.event.offsetX, d3.event.offsetY, self.lenses[self.currentLenseIndex].context, position);
	}
	self.actionCanvas.style("cursor", self.interpolating ? "crosshair" : "default");
	//self.overlayCanvas.style("cursor", self.interpolating ? "none" : "default");
} 

LineSpace.prototype.interpolate = function(x, y, context, prevPosition) {
	var self = this;

	context.beginPath();
	context.clearRect(prevPosition[0]-self.instanceWidth/2-2, prevPosition[1]-self.instanceHeight/2-2, self.instanceWidth+4, self.instanceHeight+4);
	context.stroke();
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
	 	self.drawLines(context, self.dataSet[dsDist[f].id], 'black', false, true, 
	 		{x: +tempParams[self.dimensions[0]], y: +tempParams[self.dimensions[1]], value: 0, show: true}, true);
	}

	var interpResults = [];
	self.interpolateFunctions.forEach(function(item, index) {
		var query = {};
		query[self.dimensions[0]] = self.paramX.invert(x-self.margin.right);
		query[self.dimensions[1]] = self.paramY.invert(y-self.margin.top);
	 	var interp = item(query);
	 	interpResults.push(interp);
	});
	context.globalAlpha = 1.0;
	interpResults.forEach(function(interp, index) {
		self.drawLines(context, interp.ds, interp.color, index == 0, false, null, true);
	});

	self.colorMapPicker.getColor(0.5);
}

LineSpace.prototype.data = function(dataSet) {
	var self = this;

	this.dataSet = dataSet;

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

   	self.paramInfo = calcParamInfo(self.dataSet);

    self.update();
}

LineSpace.prototype.drawLines = function(context, ds, color, showBox, forceShow, localCoords, noPoint) {
	var self = this;

	var graphProperties = self.getGraphProperties(ds);
	if(localCoords) {
		graphProperties = localCoords;
	}

	var transX = self.paramX(graphProperties.x)-this.instanceWidth/2;
	var transY = self.paramY(graphProperties.y)-this.instanceHeight/2;
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
				context.moveTo(self.x(item.x), self.y(item.y));
			}
			else {
				context.lineTo(self.x(item.x), self.y(item.y));
			}
		});

		context.stroke();
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
		context.arc(transX+this.instanceWidth/2, transY+this.instanceHeight/2, 5, 0, 2 * Math.PI);
		context.fill();
		//context.fillRect(transX+this.instanceWidth/2-1,transY+this.instanceHeight/2-1,3,3);
		//context.stroke();
	}
	else {
		context.fillStyle = 'black';
		context.beginPath()
		context.arc(transX+this.instanceWidth/2, transY+this.instanceHeight/2, 3, 0, 2 * Math.PI);
		context.fill();
	}

	if(showBox) {
		context.beginPath();
		context.strokeRect(transX,transY,this.instanceWidth,this.instanceHeight);
		context.stroke();
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

		var interpResults = [];
		self.interpolateFunctions.forEach(function(item, index) {
			var query = {};
			query[self.dimensions[0]] = graphProperties.x;
			query[self.dimensions[1]] = graphProperties.y;
		 	var interp = item(query);
		 	interpResults.push(interp.error);
		});

		var averageError = average(interpResults);
		ds.params["Error"] = averageError;
	});

	self.paramInfo["Error"] = calcStatistics(self.dataSet, function(d) { return d.params.Error; });
	self.paramInfo["Error"].dynamic = true;

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

	self.redraw();
}

LineSpace.prototype.redraw = function() {
	var self = this;
	this.context.clearRect(-this.margin.right, -this.margin.top, this.parentRect.width, this.parentRect.height);

	this.dataSet.forEach(function(ds, index) {
		self.drawLines(self.context, ds);
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