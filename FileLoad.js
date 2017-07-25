'use strict'

function readTextFile(file, callback) {
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === 4 && rawFile.status == "200") {
            callback(rawFile.responseText);
        }
    }
    rawFile.send(null);
}

function loadDatabase(dbString, callback) {
	if (dbString.endsWith(".json")) {
		readTextFile(dbString, function(text) {
			var data = JSON.parse(text);
			//console.log(data);
		});
		
		return;
	}

	var dbInfo = dbString.split(',')

	d3.csv(dbInfo[0], function(error, results) {
	   				var params = results;
	   				console.log(results[0]);
			         	var q = d3.queue();

			         	if (dbInfo[2] == "image") {
			         		var data = [];
			         		var numProcessed = 0;
			         		results.forEach(function(item, index) {
			         			var img = new Image;
			         			var ds = {id: index, params: params[index], rows: [{x:1,y:2},{x:1,y:2},{x:1,y:2}], image: img};
			         			img.src = item[dbInfo[1]];
								var canvas = document.createElement('canvas');
			         			var context = canvas.getContext("2d");
								var featureCanvas = document.createElement('canvas');
			         			var featureContext = featureCanvas.getContext("2d");

			         			img.onload = function() {
					                canvas.width = img.width/100;
					                canvas.height = img.height/100;
					                context.drawImage(img, 0, 0, canvas.width, canvas.height);
									console.log(ds.id, "loaded");

									ds.rows = [];
									var imageData = context.getImageData(0,0,canvas.width, canvas.height);
									for (var f = 0; f < canvas.width*canvas.height*4; f++) {
										ds.rows.push({x:f, y:imageData.data[f]});
									}


									tracking.Fast.THRESHOLD = 20;
									var width = Math.floor(1+img.width/16)*16;
									var height = Math.floor(1+img.height/16)*16;
									featureCanvas.width = width;
									featureCanvas.height = height;
					                featureContext.drawImage(img, 0, 0, width, height);

									//console.log(width,height);
									imageData = featureContext.getImageData(0, 0, width, height);
									var gray = tracking.Image.grayscale(imageData.data, width, height);
									ds.features = tracking.Fast.findCorners(gray, width, height);

									for (var f = 0; f < ds.features.length; f+=2) {
										ds.features[f] = 1.0*ds.features[f]/width;
										ds.features[f+1] = 1.0*ds.features[f+1]/height;
									}

									numProcessed++;
									if (numProcessed == results.length) {
										console.log("done loading");
						    			callback(data);
									}
								}
			         			//URL.revokeObjectURL(img.src)
			         			data.push(ds);
				   			});
						}
						else {
							results.forEach(function(item, index) {
								//if (index > 500) {
									//console.log(item[dbInfo[1]]);
					            	q.defer(d3.text, item[dbInfo[1]]);
								//}
				   			});
				   			q.awaitAll(function(error, results) {
				            	//if (!error) {
				            		//console.log(error);
					            	var data = [];
						        	results.forEach(function(text, index) {
						        		if (text) {
											// correct for white space delemited
							    			if (dbInfo[3] == " ") {
							    				var lines = text.split('\n');
							    				text = '';
								    			lines = lines.slice(dbInfo[6], (dbInfo[7] > 0) ? dbInfo[7] : lines.length);
								    			lines.forEach(function(item, index) {
								    				if (index == 0) {
								    					text = lines[index].trim();
								    				}
								    				else {
								    					if (index % (dbInfo[8] > 0 ? dbInfo[8]: 10) == 0) {
								    						text = text + "\n" + lines[index].trim();
								    					}
								    				}
								    			});
								    			text = replaceAll(text,"  ","\t");
							    			}
								    

						        			var rows = d3.tsvParseRows(text).map(function(row) {
							            		return row.map(function(value) {
							            			return +value;
							               		});
							            	});

								            var rows2 = [];
								            var count = 0;
								            rows.forEach(function(item, index) {
								                if (dbInfo[2] == 'column') {
								               		rows2.push({x : count, y : item[dbInfo[4]]});
								               		count++;
								                }
								                else if (dbInfo[2] == 'columns') {
								                	rows2.push({x : item[dbInfo[4]], y : item[dbInfo[5]]});
								                }
								                else {
								               		//rows2.push({x : item[0], y : item[column]});
								                }
								            });

								            var ds = {id: index, params: params[index], rows: rows2, image: null};
								            data.push(ds);
							        	}
					               		
					           		});

						            //lineSpace.data(data);
						            callback(data);
					           // }
				            });
						}
				});
}
