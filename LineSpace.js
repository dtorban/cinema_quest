'use strict'

function LineSpace(parent) {
	var self = this;

	this.parent = parent;
	this.parent.attr("style", "position:relative;left:0px;top:0px;");
	this.parentRect = parent.node().getBoundingClientRect();
	this.canvas = parent.append("canvas")
		.attr('width', this.parentRect.width)
		.attr('height', this.parentRect.height)
		.attr("style", "z-index: 0;position:relative;left:0px;top:0px;");
	this.context = this.canvas.node().getContext("2d");
	this.context.fillStyle = "lightgrey";
    this.context.fillRect(0, 0, this.parentRect.width, this.parentRect.height);

    this.instanceWidth = self.parentRect.width/8;
    this.instanceHeight = self.parentRect.height/8;

   	this.overlayCanvas = parent.append("canvas")
		.attr('width', this.parentRect.width)
		.attr('height', this.parentRect.width)
		.attr("style", "z-index: 1;position:absolute;left:0px;top:0px;cursor: default");
	this.overlayContext = this.overlayCanvas.node().getContext("2d");
	this.overlayContext.fillStyle = "green";
    this.cursorPosition = [0,0];

    this.overlayCanvas.on("mousemove", function() {
    	self.overlayContext.clearRect(self.cursorPosition[0]-self.instanceWidth/2-2, self.cursorPosition[1]-self.instanceHeight/2-2, self.instanceWidth+4, self.instanceHeight+4);
    	self.overlayContext.fillRect(d3.event.offsetX-self.instanceWidth/2, d3.event.offsetY-self.instanceHeight/2, self.instanceWidth, self.instanceHeight);
    	self.cursorPosition = [d3.event.offsetX, d3.event.offsetY];
    });


    this.paramX = d3.scaleLinear().range([0, self.parentRect.width]);
    this.paramY = d3.scaleLinear().range([self.parentRect.height, 0]);

    this.x = d3.scaleLinear().range([0, this.instanceWidth]);
    this.y = d3.scaleLinear().range([this.instanceHeight, 0]);
}

LineSpace.prototype.data = function(dataSet) {
	var self = this;

	this.dataSet = dataSet;

	var extentX = [];
	var extentY = [];
	var paramExtentX = [];
	var paramExtentY = [];

	dataSet.forEach(function(ds, index) {
		paramExtentX.push(ds.paramX);
		paramExtentY.push(ds.paramY);
		extentX.push.apply(extentX, d3.extent(ds.rows, function(d) { return d.x; }));
		extentY.push.apply(extentY, d3.extent(ds.rows, function(d) { return d.y; }));
	});

	self.paramX.domain(d3.extent(paramExtentX, function(d) { return d; }));
	self.paramY.domain(d3.extent(paramExtentY, function(d) { return d; }));
	self.x.domain(d3.extent(extentX, function(d) { return d; }));
	self.y.domain(d3.extent(extentY, function(d) { return d; }));

	self.redraw();
}

LineSpace.prototype.drawLines = function(context, ds, color) {
	var self = this;

	var transX = self.paramX(ds.paramX)-this.instanceWidth/2;
	var transY = self.paramY(ds.paramY)-this.instanceHeight/2;
	context.translate(transX, transY);

	context.strokeStyle = color;

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

	context.translate(-transX, -transY);
}

LineSpace.prototype.redraw = function() {
	var self = this;

	this.dataSet.forEach(function(ds, index) {
		self.drawLines(self.context, ds, 'green');
	});
}