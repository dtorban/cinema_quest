'use strict'

function ColorMapPicker(parent, dataFile, onChange) {
	var self = this;
	this.parent = parent;
	this.path = dataFile.substring(0,dataFile.lastIndexOf("/")+1);
	console.log(this.path);

	this.colorMapSelect = this.parent
		.append('select')
  		.attr('class','selectColorMap')
		.attr("style","width:300px;height:30px;background-size: 300px 30px;background-repeat: no-repeat;")
    	.on('change',function() {
    		self.colorMapSelect.style('background-image', "url('"+self.path+d3.event.target.value+"')")
    		self.img.property('src', self.path+d3.event.target.value);
    		self.canvas
				.attr('width', self.img.node().width)
				.attr('height', self.img.node().height);
    		self.context.drawImage(self.img.node(), 0, 0, self.img.node().width, self.img.node().height);
    		onChange();
    	});

    d3.csv(dataFile, function(error, results) {
    	console.log(error);
    	var colorMaps = results;
    	console.log(results[0]);

		var options = self.colorMapSelect
		 	.selectAll('option')
			.data(colorMaps).enter()
			.append('option')
			.property('value', function (d) { return d.File; })
			.style('background-image', function (d) { return "url('"+self.path+d.File+"')"; })
			.style('background-size', '300px 30px')
			.style('height', '30px')
			.style('background-repeat', 'no-repeat');

		self.colorMapSelect.style('background-image', "url('"+self.path+colorMaps[0].File+"')")

		self.img = parent.append('img')
			.property('src', self.path+colorMaps[0].File)
			.attr("style","position:absolute;left:0px;top:0px;visibility: hidden");
		self.canvas = parent.append('canvas')
			.attr('width', self.img.node().width)
			.attr('height', self.img.node().height)
			.attr("style","z-index: -1;position:absolute;left:0px;top:0px;visibility: hidden");
		self.context = self.canvas.node().getContext("2d");
		self.context.drawImage(self.img.node(), 0, 0, self.img.node().width, self.img.node().height)
    });
}
ColorMapPicker.prototype.getColor = function(value) {
	var self = this;

	var imageData = self.context.getImageData(Math.floor(self.img.node().width*value), Math.floor(self.img.node().height/2), 1, 1).data;
	return imageData;
}
