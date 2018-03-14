'use strict'

function readTextFile(file, callback) {
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === 4 && rawFile.status == "200") {
            callback(rawFile.responseText);
        }
        else if (rawFile.readyState === 4 && rawFile.status == "0") {
        	console.log(rawFile.readyState, rawFile.status);
        	callback(null);
        }
    }
    rawFile.send(null);
}

function loadDatabaseWithInfo(dbInfo, results, callback) {
	readTextFile(dbInfo.filePath + "quest.json", function(text) {
	   	if (text) {
			var data = JSON.parse(text);
			for (var attrname in data) { dbInfo[attrname] = data[attrname]; }
			console.log(dbInfo);
	   	}

		loadDatabaseData(dbInfo, results, callback);
	});
}

function loadDatabase(dbString, callback) {
	var dbInfo = {};
	dbInfo.filePath = "";
	var filePath = "";

	if (dbString.endsWith(".cdb")) {
		dbInfo.filePath = dbString + "/";
		dbInfo.file = dbString + "/data.csv";
		dbInfo.fileColumn = "FILE";
		d3.csv(dbInfo.file, function(error, results) {
	   		var fileName = results[0][dbInfo.fileColumn];
	   		console.log(fileName);
	   		if (fileName.endsWith(".jpg") || fileName.endsWith(".png") || fileName.endsWith(".gif") || fileName.endsWith(".tiff")) {
	   			dbInfo.type = "image";
	   		}

			loadDatabaseWithInfo(dbInfo, results, callback);
		});
	}
	else {
		dbInfo = dbString.split(',');
		d3.csv(dbInfo[0], function(error, results) {
			loadDatabaseData(dbInfo, results, callback);
		});
	}
}

function loadDatabaseData(dbInfo, results, callback) {
	   				var params = results;
			         	var q = d3.queue();

			         	if (dbInfo.type == "image") {
			         		var data = [];
			         		var numProcessed = 0;
			         		results.forEach(function(item, index) {
			         			var img = new Image;
			         			var ds = {id: index, params: params[index], rows: [{x:1,y:2},{x:1,y:2},{x:1,y:2}], image: img};
			         			img.src = dbInfo.filePath + item[dbInfo.fileColumn];
								var canvas = document.createElement('canvas');
			         			var context = canvas.getContext("2d");
								var featureCanvas = document.createElement('canvas');
			         			var featureContext = featureCanvas.getContext("2d");

			         			img.onload = function() {
					                canvas.width = 16;//img.width/100;
					                canvas.height = 16;//img.height/100;
					                context.drawImage(img, 0, 0, canvas.width, canvas.height);
									console.log(ds.id, "loaded");

									ds.rowSet = [];
									ds.rows = [];
									var imageData = context.getImageData(0,0,canvas.width, canvas.height);
									for (var f = 0; f < canvas.width*canvas.height*4; f++) {
										ds.rows.push({x:f, y:imageData.data[f]});
									}

									ds.rowSet.push(ds.rows);

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

								img.onerror = function() {
									console.log("error cannot open image: " + this.src);
								}
			         			//URL.revokeObjectURL(img.src)
			         			data.push(ds);
				   			});
						}
						else {
							results.forEach(function(item, index) {
								//if (index > 500) {
									//console.log(item[dbInfo[1]]);
					            	q.defer(d3.text, dbInfo.filePath + item[dbInfo.fileColumn]);
								//}
				   			});
				   			q.awaitAll(function(error, results) {
				            	//if (!error) {
				            		console.log(error);
					            	var data = [];
						        	results.forEach(function(text, index) {
						        		if (text) {
											// correct for white space delemited
							    			if (dbInfo.delimiter == " ") {
							    				var lines = text.split('\n');
							    				text = '';
							    				if (dbInfo.sample) {
								    				lines = lines.slice(dbInfo.sample.start ? dbInfo.sample.start : 0,
								    				 	dbInfo.sample.length ? dbInfo.sample.length : lines.length);
							    				}
								    			lines.forEach(function(item, index) {
								    					if (index % (dbInfo.sample && dbInfo.sample.step ? dbInfo.sample.step: 1) == 0) {
										    				if (text == '') {
										    					text = lines[index].trim();
										    				}
										    				else {
								    							text = text + "\n" + lines[index].trim();
									    					}
									    				}
								    			});
								    			text = replaceAll(text,"  ","\t");
							    			}
							    			else if (dbInfo.delimiter && dbInfo.delimiter != "\t") {
							    				text = replaceAll(text,dbInfo.delimiter,"\t");
							    			}
								    
						        			var rows = d3.tsvParseRows(text).map(function(row) {
							            		return row.map(function(value) {
							            			return +value;
							               		});
							            	});

								            var rows2 = [];
								            var count = 0;

								            if (dbInfo.delimiter != " " && dbInfo.sample) {
								            	rows = rows.slice(dbInfo.sample.start ? dbInfo.sample.start : 0,
								    				 	dbInfo.sample.length ? dbInfo.sample.length : lines.length);
								            }

								            rows.forEach(function(item, index) {
								            	var skip = dbInfo.delimiter != " " && dbInfo.sample && (index % (dbInfo.sample && dbInfo.sample.step ? dbInfo.sample.step: 1) != 0);

								            	if (!skip) {
								            		if (dbInfo.columns.length == 1) {
									               		rows2.push({x : count, y : item[dbInfo.columns[0]]});
									               		count++;
									                }
									                else if (dbInfo.columns.length == 2) {
									                	rows2.push({x : item[dbInfo.columns[0]], y : item[dbInfo.columns[1]]});
									                }
								            	}

								            });

								            var ds = {id: index, params: params[index], rows: rows2, image: null};
								            data.push(ds);
							        	}
					               		
					           		});

						            //lineSpace.data(data);
									console.log("done loading");
						            callback(data);
					           // }
				            });
						}
}