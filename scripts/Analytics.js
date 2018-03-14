'use strict'

			function paramNormalize(ds, param, paramInfo) {
	   			var pInfo = paramInfo[param];
	   			var val = +ds.params[param];
	   			return (val - pInfo.min)/(pInfo.max - pInfo.min);
	   		}

	   		function generateFeature(prefix, data, query, paramInfo) {
	   			var paramSet = Object.keys(data[0].params).filter(function(d) {
					return d != 'run' && d != 'id' && !isNaN(+data[0].params[d]) && !d.startsWith("output_") && !d.startsWith('pca_') && !d.startsWith('kmeans_') && !d.startsWith('error_');
				});

				//console.log(query);

	   			var points = [];
	   			data.forEach(function(item, index) {
	   				var point = [];
	   				paramSet.forEach(function(param, index) {
	   					point.push(paramNormalize(item, param, paramInfo));
					});
					points.push(point);
	   			});

	   			var trainingPoints = [];
	   			query.forEach(function(item, index) {
	   				trainingPoints.push(points[item]);
	   			});

				var pca = new ML.Stat.PCA(trainingPoints);
				console.log(pca.getExplainedVariance());
				var inPrediction = pca.predict(points);

	   			points = [];
				data.forEach(function(item, index) {
	   				var point = [];
					for (var f = 0; f < item.rows.length; f++) {
						point.push(item.rows[f].y);
					}
					points.push(point);
				});

				trainingPoints = [];
	   			query.forEach(function(item, index) {
	   				trainingPoints.push(points[item]);
	   			});

				pca = new ML.Stat.PCA(trainingPoints);
				console.log(pca.getExplainedVariance());
				var outPrediction = pca.predict(points);

	   			data.forEach(function(item, index) {
	   				item.params[prefix + "_in1"] = inPrediction[index][0];
	   				item.params[prefix + "_in2"] = inPrediction[index][1];
	   				item.params[prefix + "_in3"] = inPrediction[index][2];
	   				//item.params[prefix + "_in4"] = inPrediction[index][3];
	   				//item.params[prefix + "_in5"] = inPrediction[index][4];
	   				item.params[prefix + "_out1"] = outPrediction[index][0];
	   				item.params[prefix + "_out2"] = outPrediction[index][1];
	   				item.params[prefix + "_out3"] = outPrediction[index][2];
	   				//item.params[prefix + "_out4"] = outPrediction[index][3];
	   				//item.params[prefix + "_out5"] = outPrediction[index][4];
	   			});

	   		}

	   		function generatePCA(prefix, data, query, paramSet, paramInfo) {
	   			var points = [];
	   			data.forEach(function(item, index) {
	   				var point = [];
	   				paramSet.forEach(function(param, index) {
	   					point.push(paramNormalize(item, param, paramInfo));
					});
					points.push(point);
	   			});

	   			var trainingPoints = [];
	   			query.forEach(function(item, index) {
	   				trainingPoints.push(points[item]);
	   			});

				var pca = new ML.Stat.PCA(trainingPoints);
				console.log(pca.getExplainedVariance());
				var prediction = pca.predict(points);

	   			data.forEach(function(item, index) {
	   				item.params[prefix + "1"] = prediction[index][0];
	   				item.params[prefix + "2"] = prediction[index][1];
	   				item.params[prefix + "3"] = prediction[index][2];
	   			});

	   		}

	   		function generateKMeans(prefix, data, query, k, paramInfo) {
	   			var paramSet = Object.keys(data[0].params).filter(function(d) {
					return d != 'run' && d != 'id' && !isNaN(+data[0].params[d]) && !d.startsWith("output_") && !d.startsWith('pca_') && !d.startsWith('kmeans_') && !d.startsWith('error_');
				});

				//console.log(query);

	   			var points = [];
	   			data.forEach(function(item, index) {
	   				var point = [];
	   				paramSet.forEach(function(param, index) {
	   					point.push(paramNormalize(item, param, paramInfo));
					});
					points.push(point);
	   			});

	   			var trainingPoints = [];
	   			query.forEach(function(item, index) {
	   				trainingPoints.push(points[item]);
	   			});

				var centers = [];
				for (var f = 0; f < k; f++) {
					centers.push(trainingPoints[Math.floor(Math.random()*trainingPoints.length)]);
				}

				var kmeansIn = new ML.Clust.kmeans(trainingPoints, k, {initialization: centers});

	   			points = [];
				data.forEach(function(item, index) {
	   				var point = [];
					for (var f = 0; f < item.rows.length; f++) {
						point.push(item.rows[f].y);
					}
					points.push(point);
				});

				trainingPoints = [];
	   			query.forEach(function(item, index) {
	   				trainingPoints.push(points[item]);
	   			});

	   			centers = [];
				for (var f = 0; f < k; f++) {
					centers.push(trainingPoints[Math.floor(Math.random()*trainingPoints.length)]);
				}

	   			var kmeansOut = new ML.Clust.kmeans(trainingPoints, k, {initialization: centers});

	   			data.forEach(function(item, index) {
	   				item.params[prefix + "_" + k + "_in"] = kmeansIn.clusters[index];
	   				item.params[prefix + "_" + k + "_out"] = kmeansOut.clusters[index];
	   			});

	   		}


	   		function generateInterpolationError(suffix, data, interpolationFunction, validator) {
	   			var paramSet = Object.keys(data[0].params).filter(function(d) {
					return d != 'run' && d != 'id' && !isNaN(+data[0].params[d]) && !d.startsWith("output_") && !d.startsWith('pca_') && !d.startsWith('kmeans_') && !d.startsWith('error_');
				});

	   			data.forEach(function(ds, index) {
	   				var trainingSet = validator.getTrainingSet(index);
	   				trainingSet.forEach(function(item, index) {
	   					var ds = data[item];
	   					trainingSet[index] = {id: index, params: ds.params, rows: ds.rows, rowSet: ds.rowSet};
	   				});

	   				var query = {};
	   				paramSet.forEach(function(param, index) {
	   					query[param] = {val: ds.params[param], weight:1.0, interpWeight:1.0};
	   				});

	   				var interp = interpolationFunction(query, trainingSet);

					var interpError = weightedEclideanDistance(null, 
						Array.from(ds.rows, x => x.y),
						Array.from(interp.ds.rows, x => x.y));
					//console.log(validator.getTrainingSet(index), index, interpError);

	   				ds.params["error_" + suffix] = interpError;


					var neighborErrors = [];
					var weights = [];
					var weightSum = 0.0;
					interp.neighbors.forEach(function(item, index) {
						var interpNeighborError = weightedEclideanDistance(null, 
						Array.from(trainingSet[item.id].rows, x => x.y),
						Array.from(interp.ds.rows, x => x.y));
						if (index < 15) {
							neighborErrors.push(interpNeighborError);
							weights.push(item.weight);
							weightSum += item.weight;
						}
					});

					neighborErrors.forEach(function(item, index) {
						neighborErrors[index] = item*weights[index]/weightSum;
					});

					var statistics = calcStatistics(neighborErrors, function(item) { return item; })
					ds.params["error_variance_" + suffix] = statistics.variance;
	   			});
	   		}

	   		function generateInterpolationParamError(suffix, data, interpolationFunction, validator, inParamSet, outParamSet, paramInfo) {
	   			data.forEach(function(ds, index) {
	   				var trainingSet = validator.getTrainingSet(index);
	   				trainingSet.forEach(function(item, index) {
	   					var ds = data[item];
	   					trainingSet[index] = {id: index, params: ds.params, rows: ds.rows, rowSet: ds.rowSet};
	   				});

	   				var query = {};
	   				inParamSet.forEach(function(param, index) {
	   					query[param] = {val: ds.params[param], weight:1.0, interpWeight:0.0};
	   				});

	   				var interp = interpolationFunction(query, trainingSet);

					var interpError = weightedEclideanDistance(
						Array.from(outParamSet, x => 1.0/paramInfo[x].variance), 
						Array.from(outParamSet, x => +ds.params[x]),
						Array.from(outParamSet, x => +interp.ds.params[x]));

					if (suffix.startsWith("in") && index == 15) {
						console.log("error_" + suffix, interpError, outParamSet[0], interp.ds.params[outParamSet[0]], ds.params[outParamSet[0]]);
					}

	   				ds.params["error_" + suffix] = interpError;
	   			});
	   		}