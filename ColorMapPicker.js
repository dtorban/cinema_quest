'use strict'

function ColorMapPicker(parent, dataFile, onChange) {
	var self = this;
	this.parent = parent;

	this.colorMapSelect = this.parent
		.append('select')
  		.attr('class','selectColorMap')
		.attr("style","width:200px;height:30px;background-size: 200px 30px;background-repeat: no-repeat;")
    	.on('change',function() {
    		self.colorMapSelect.style('background-image', "url('images/color_maps/"+d3.event.target.value+"')")
    		self.img.property('src', 'images/color_maps/'+d3.event.target.value);
    		self.canvas
				.attr('width', self.img.node().width)
				.attr('height', self.img.node().height);
    		self.context.drawImage(self.img.node(), 0, 0, self.img.node().width, self.img.node().height);
    		onChange();
    	});

    //var colorMaps = ['Gray52Pur.png', 'warm1.png', '5YBGBT.png'];
    d3.csv(dataFile, function(error, results) {
    	console.log(error);
    	var colorMaps = results;
    	console.log(results[0]);

		var options = self.colorMapSelect
		 	.selectAll('option')
			.data(colorMaps).enter()
			.append('option')
			.property('value', function (d) { return d.File; })
			.style('background-image', function (d) { return "url('images/color_maps/"+d.File+"')"; })//, 'background-size': '200px 60px','background-repeat': 'no-repeat'})//background-size: 200px 60px;background-repeat: no-repeat;";})
			.style('background-size', '200px 30px')//, 'background-size': '200px 60px','background-repeat': 'no-repeat'})//background-size: 200px 60px;background-repeat: no-repeat;";})
			.style('height', '30px')
			.style('background-repeat', 'no-repeat');//, 'background-size': '200px 60px','background-repeat': 'no-repeat'})//background-size: 200px 60px;background-repeat: no-repeat;";})

		self.colorMapSelect.style('background-image', "url('images/color_maps/"+colorMaps[0].File+"')")

		self.img = parent.append('img')
			.property('src', 'images/color_maps/'+colorMaps[0].File)
			.attr("style","position:absolute;left:0px;top:0px;visibility: hidden");
		self.canvas = parent.append('canvas')
			.attr('width', self.img.node().width)
			.attr('height', self.img.node().height)
			.attr("style","z-index: -1;position:absolute;left:0px;top:0px;visibility: hidden");
		//self.canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height);
		self.context = self.canvas.node().getContext("2d");
		self.context.drawImage(self.img.node(), 0, 0, self.img.node().width, self.img.node().height)
    });

	//var canvas = document.createElement('canvas');
	//canvas.width = img.width;
	//canvas.height = img.height;
	//canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height);
}
//self.idContext.getImageData(d3.event.offsetX*2-1, d3.event.offsetY*2-1, 3, 3).data;
ColorMapPicker.prototype.getColor = function(value) {
	var self = this;

	var imageData = self.context.getImageData(Math.floor(self.img.node().width*value), Math.floor(self.img.node().height/2), 1, 1).data;
	//console.log(imageData);
	return imageData;
}
