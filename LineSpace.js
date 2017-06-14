'use strict'

function LineSpace(parent, getGraphProperties, interpolate) {
	var self = this;

	self.getGraphProperties = getGraphProperties;
	self.interpolate = interpolate;

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

    this.instanceWidth = self.parentRect.width/10;
    this.instanceHeight = self.parentRect.width/10;

    this.margin = {top: this.instanceHeight/2, right: this.instanceWidth/2, bottom: this.instanceHeight/2, left: this.instanceWidth/2};
    this.context.translate(this.margin.right, this.margin.top);
    this.innerWidth = this.parentRect.width - this.instanceWidth;
    this.innerHeight = this.parentRect.height - this.instanceHeight;

   	this.overlayCanvas = parent.append("canvas")
		.attr('width', this.parentRect.width)
		.attr('height', this.parentRect.width)
		.attr("style", "z-index: 1;position:absolute;left:0px;top:0px;cursor: none");
	this.overlayContext = this.overlayCanvas.node().getContext("2d");
	this.overlayContext.translate(this.margin.right, this.margin.top);
	this.overlayContext.fillStyle = "green";
    this.cursorPosition = [0,0];

    this.overlayCanvas.on("mousemove", function() {
    	if (self.dataSet) {
    		self.overlayContext.clearRect(self.cursorPosition[0]-self.instanceWidth/2-2, self.cursorPosition[1]-self.instanceHeight/2-2, self.instanceWidth+4, self.instanceHeight+4);
	    	var params = Object.create(self.dataSet[0].params);
	    	var ds = {params: params, rows: self.dataSet[0].rows};
	    	ds = interpolate(ds, self.paramX.invert(d3.event.offsetX-self.margin.right), self.paramY.invert(d3.event.offsetY-self.margin.top));
	 		//self.overlayContext.fillRect(d3.event.offsetX-self.instanceWidth/2, d3.event.offsetY-self.instanceHeight/2, self.instanceWidth, self.instanceHeight);
	 		self.drawLines(self.overlayContext, ds, 'green');
	    	//self.overlayContext.clearRect(self.cursorPosition[0]-self.instanceWidth/2-2, self.cursorPosition[1]-self.instanceHeight/2-2, self.instanceWidth+4, self.instanceHeight+4);
	    	self.cursorPosition = [d3.event.offsetX-self.margin.right, d3.event.offsetY-self.margin.top];
    	}
    });
}

LineSpace.prototype.data = function(dataSet) {
	var self = this;

	this.dataSet = dataSet;

	var paramSet = Object.keys(dataSet[0].params);
	self.dimensions = [paramSet[0], paramSet[1], paramSet[2]];

	var selectDiv = self.parent
		.append('div')
  		.attr("style", "z-index: 10;position:absolute;left:0px;top:0px;cursor: default");

	var select = selectDiv
		.append('select')
  		.attr('id','xval')
  		.attr('class','select')
    	.on('change',function() {
    		self.dimensions[0] = d3.event.target.value;
    		self.update();
    	});

	var options = select
	 	.selectAll('option')
		.data(paramSet).enter()
		.append('option')
		.text(function (d) { return d; })
    	.property("selected", function(d){ return d === self.dimensions[0]; });

	var select = selectDiv
		.append('select')
  		.attr('class','select')
    	.on('change',function() {
    		self.dimensions[1] = d3.event.target.value;
    		self.update();
    	});

	var options = select
	 	.selectAll('option')
		.data(paramSet).enter()
		.append('option')
		.text(function (d) { return d; })
    	.property("selected", function(d){ return d === self.dimensions[1]; });

	var select = selectDiv
		.append('select')
  		.attr('class','select')
  		.attr("style", "visibility: hidden")
    	.on('change',function() {
    		self.dimensions[2] = d3.event.target.value;
    		self.update();
    	});

	var options = select
	 	.selectAll('option')
		.data(paramSet).enter()
		.append('option')
		.text(function (d) { return d; })
    	.property("selected", function(d){ return d === self.dimensions[2]; });

   	self.paramInfo = {};
	paramSet.forEach(function(item, index) {
		var key = item;
		var mean = 0;
		self.dataSet.forEach(function(item, index) {
			mean += +item.params[key];
		});
		mean /= self.dataSet.length;

		var variance = 0;
		self.dataSet.forEach(function(item, index) {
			var val = +item.params[key];
			variance += (val - mean)*(val-mean);
		});
		variance /= self.dataSet.length;

		self.paramInfo[key] = {mean: mean, variance: variance};
		//console.log(item, mean, variance);
	});

    self.update();
}

LineSpace.prototype.drawLines = function(context, ds, color) {
	var self = this;

	var graphProperties = self.getGraphProperties(ds);
	var transX = self.paramX(graphProperties.x)-this.instanceWidth/2;
	var transY = self.paramY(graphProperties.y)-this.instanceHeight/2;
	context.translate(transX, transY);

	var show = true;
	if (color) {
		context.strokeStyle = color;
	}
	else if (graphProperties.value == 1) {
		//context.strokeStyle = 'rgb('+(graphProperties.value*(255))+','+0+','+0+')';//color;
		context.strokeStyle = 'black';//color;
	}
	else {
		context.strokeStyle = 'lightblue';
		show = false;
	}

	if (show) {
		context.beginPath();
		ds.rows.forEach(function(item, index) {
			if (index == 0) {
				context.moveTo(self.x(item.x), self.y(item.y));
			}
			else {
				context.lineTo(self.x(item.x), self.y(item.y));
			}
		});
	}

	context.stroke();

	context.translate(-transX, -transY);


	context.beginPath();
	//context.strokeRect(this.instanceWidth/2,this.instanceHeight/2,1,1);
	if (color == 'green') {
		context.strokeRect(transX,transY,this.instanceWidth,this.instanceHeight);
	}
	context.strokeRect(transX+this.instanceWidth/2,transY+this.instanceHeight/2,1,1);
	context.stroke();
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
	});

	self.paramX.domain(d3.extent(paramExtentX, function(d) { return d; }));
	self.paramY.domain(d3.extent(paramExtentY, function(d) { return d; }));
	self.x.domain(d3.extent(extentX, function(d) { return d; }));
	self.y.domain(d3.extent(extentY, function(d) { return d; }));

	self.redraw();
}

LineSpace.prototype.redraw = function() {
	var self = this;
	this.context.clearRect(-this.margin.right, -this.margin.top, this.parentRect.width, this.parentRect.height);

	this.dataSet.forEach(function(ds, index) {
		self.drawLines(self.context, ds);
	});
}