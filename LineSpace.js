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

   	this.overlayCanvas = parent.append("canvas")
		.attr('width', this.parentRect.width)
		.attr('height', this.parentRect.width)
		.attr("style", "z-index: 1;position:absolute;left:0px;top:0px;");
	this.overlayContext = this.overlayCanvas.node().getContext("2d");
	this.overlayContext.fillStyle = "green";
    this.overlayContext.fillRect(0, 0, this.parentRect.width/8, this.parentRect.height/8);
    this.cursorPosition = [0,0];

    this.overlayCanvas.on("mousemove", function() {
    	//console.log(d3.event.offsetX);

    	//self.overlayCanvas.style("left", '' + d3.event.offsetX + 'px');
    	//self.overlayCanvas.style("top", '' + d3.event.offsetY + 'px');
    	self.overlayContext.clearRect(self.cursorPosition[0]-2, self.cursorPosition[1]-2, self.parentRect.width/8+4, self.parentRect.height/8+4);
    	self.overlayContext.fillRect(d3.event.offsetX, d3.event.offsetY, self.parentRect.width/8, self.parentRect.height/8);
    	self.cursorPosition = [d3.event.offsetX, d3.event.offsetY];
    });
}

