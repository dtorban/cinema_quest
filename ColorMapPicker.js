'use strict'

function ColorMapPicker(parent, dataFile, onChange) {
	var self = this;
	this.parent = parent;
	this.path = dataFile.substring(0,dataFile.lastIndexOf("/")+1);
	console.log(this.path);

    this.dd = this.parent.append("div")
        .attr('id', 'dd')
        .attr('class', 'wrapper-dropdown');
    this.dd.append("span");
    this.dd.attr("style","float:left;position:relative;width:300px;height:30px;background-size: 300px 30px;background-repeat: no-repeat;box-sizing: border-box;");
    
    self.dd.on('click', function(event){
        $(this).toggleClass('active');
        return false;
    });
    
    $(document).click(function() {
        $('.wrapper-dropdown-1').removeClass('active');
    });
    
	this.colorMapSelect =  this.dd
		.append('ul')
  		.attr('class','dropdown')

    d3.csv(dataFile, function(error, results) {
    	console.log(error);
    	var colorMaps = results;
    	console.log(results[0]);
           
		var options = self.colorMapSelect
		 	.selectAll('li')
			.data(colorMaps).enter()
			.append('li')
            //.text(function (d) { return d.File; })
			.property('value', function (d) { return d.File; })
			.style('background-image', function (d) { return "url('"+self.path+d.File+"')"; })
           .style('background-size', '300px 30px')
           .style('height', '30px')
			.style('background-repeat', 'no-repeat')
           .on('click',function(d) {
               self.dd.style('background-image', "url('"+self.path+d.File+"')")
               self.img.property('src', self.path+d.File);
               self.canvas
                 .attr('width', self.img.node().width)
                 .attr('height', self.img.node().height);
               self.context.drawImage(self.img.node(), 0, 0, self.img.node().width, self.img.node().height);
               onChange();
            });

		self.dd.style('background-image', "url('"+self.path+colorMaps[0].File+"')")

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
