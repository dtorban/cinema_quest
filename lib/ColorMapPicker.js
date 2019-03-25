'use strict'

function ColorMapPicker(parent, dataFile, onChange) {
	var self = this;
	this.parent = parent;
	this.path = dataFile.substring(0,dataFile.lastIndexOf("/")+1);

    this.dd = this.parent.append("div")
        .attr('id', 'dd')
        .attr('class', 'wrapper-dropdown');
    this.dd.append("span");
    this.dd.attr("style","float:left;position:relative;width:100px;height:30px;background-size: 100px 30px;background-repeat: no-repeat;box-sizing: border-box;");
    
    self.dd.on('click', function(event){
        $(this).toggleClass('active');
        return false;
    });
    
    $(document).click(function() {
        $('.wrapper-dropdown-1').removeClass('active');
    });

  self.output = [0,0,0,0];
    
	this.colorMapSelect =  this.dd
		.append('ul')
  		.attr('class','dropdown')
      .style('columns','2')
      .style('column-gap','220px');

    d3.csv(dataFile, function(error, results) {
    	var colorMaps = results;
           
		  var options = self.colorMapSelect
  		 	.selectAll('li')
  			.data(colorMaps).enter()
  			.append('li')
              //.text(function (d) { return d.File; })
  			.property('value', function (d) { return d.File; })
  			.style('background-image', function (d) { return "url('"+self.path+d.File+"')"; })
             .style('background-size', '200px 30px')
             .style('width', '200px')
             .style('height', '30px')
             .style('padding', '3px')
             .style('display','inline-block')
  			.style('background-repeat', 'no-repeat')
             .on('click',function(d, index) {
                 self.dd.style('background-image', "url('"+self.path+d.File+"')")
                 self.img.property('src', self.path+d.File);
                 self.canvas
                   .attr('width', self.img.node().width)
                   .attr('height', self.img.node().height);
                 self.context.drawImage(self.img.node(), 0, 0, self.img.node().width, self.img.node().height);
                 self.imageData = self.context.getImageData(0, Math.floor(self.img.node().height/2), self.img.node().width, 1).data;
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
		self.context.drawImage(self.img.node(), 0, 0, self.img.node().width, self.img.node().height);
    self.imageData = self.context.getImageData(0, Math.floor(self.img.node().height/2), self.img.node().width, 1).data;
  });
}
ColorMapPicker.prototype.getColor = function(value, bins = 6) {
	var self = this;
  if (value < 0.00001) {
    value = 0.01;
  }
  if (value > 0.999999) {
    value = 0.99;
  }

  if (bins && bins > 0) {
    value = (1.0/bins)*Math.floor(value/(1.0/bins)) + 0.5/bins;
  }

  self.output[0] = self.imageData[Math.floor(self.img.node().width*value)*4];
  self.output[1] = self.imageData[Math.floor(self.img.node().width*value)*4+1];
  self.output[2] = self.imageData[Math.floor(self.img.node().width*value)*4+2];
  self.output[3] = self.imageData[Math.floor(self.img.node().width*value)*4+3];
  return self.output;
}
