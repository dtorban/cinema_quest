'use strict'

function loadDatabase(dbString, callback) {
	var dbInfo = dbString.split(',')

	d3.csv(dbInfo[0], function(error, results) {
	   				var params = results;
	   				console.log(results[0]);
			         	var q = d3.queue();
			         	results.forEach(function(item, index) {
			            	q.defer(d3.text, item[dbInfo[1]]);
			   			});
			            q.awaitAll(function(error, results) {
			            	//if (!error) {
				            	var data = [];
					        	results.forEach(function(text, index) {
					        		if (text) {
										// correct for white space delemited
						    			if (dbInfo[3] == " ") {
						    				var lines = text.split('\n');
						    				text = '';
							    			lines = lines.slice(dbInfo[6], lines.length);
							    			lines.forEach(function(item, index) {
							    				if (index == 0) {
							    					text = lines[index].trim();
							    				}
							    				else {
							    					if (index % 10 == 0) {
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

							            var ds = {id: index, params: params[index], rows: rows2};
							            data.push(ds);
						        	}
				               		
				           		});

					            //lineSpace.data(data);
					            callback(data);
				           // }
			            });
				});
}