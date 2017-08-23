'use strict'

   			function inverseDistanceInterpolation(query, k, p, weightFunction, distanceFunction, trainingSet, paramInfo) {
   				var paramSet = Object.keys(paramInfo);
   				var querySet = Object.keys(query);
   				var params = {}

		    	var ds = {params: params, id: 0};
   				var newDs = ds;
   				newDs.id = -1;
   				querySet.forEach(function(item, index) {
   					newDs.params[item] = query[item].val;
   				});

   				var weightedParamFunction = function(index) { return query[index].weight*weightFunction(index); }

   				var dsDist = calcDistance(newDs, trainingSet, querySet, weightedParamFunction, distanceFunction, p);

   				querySet.forEach(function(item, index) {
   					newDs.params[item] = query[item].val*query[item].interpWeight;
   				});

   				if (k > dsDist.length) {
   					k = dsDist.length;
   				}

				var weightSum = 0;
				for (var f = 0; f < k; f++) {
					weightSum += dsDist[f].weight;
				}

				paramSet.forEach(function(item, index) {
					if (!item.startsWith("output_")) {
						for (var f = 0; f < k; f++) {

							if (f == 0 && !(item in query)) {
								params[item] = 0;
							}

							var interpWeight = (item in query) ? (1.0 - query[item].interpWeight) : 1.0;

							params[item] += interpWeight*trainingSet[dsDist[f].id].params[item]*dsDist[f].weight/weightSum;
						}
					}
   				});

				var rows = [];
				for (var f = 0; f < k; f++) {
					trainingSet[dsDist[f].id].rows.forEach(function(item, index) {
						if (f == 0) {
							rows.push({x: item.x, y: item.y*dsDist[f].weight/weightSum});
						}
						else {
							rows[index].y += item.y*dsDist[f].weight/weightSum;
						}
					});
				}

				newDs.rows = rows;

				newDs.extentX = d3.extent(newDs.rows, function(d) { return d.x; });
				newDs.extentY = d3.extent(newDs.rows, function(d) { return d.y; });

   				return {ds: newDs, neighbors: dsDist};
   			}