'use strict'

   			function dot(a, b) {
   				var sum = 0;
   				for (var f = 0; f < a.length && f < b.length; f++) {
   					sum += a[f]*b[f];
   				}

   				return sum;
   			}

   			function mag(a) {
   				var sum = 0;
   				for (var f = 0; f < a.length; f++) {
   					sum += Math.pow(a[f],2);
   				}

   				return Math.sqrt(sum);
   			}

   			function weightedEclideanDistance(w, a, b) {
   				var sum = 0;
   				for (var f = 0; f < a.length && f < b.length && f < w.length; f++) {
   					sum += w[f]*Math.pow(a[f]-b[f],2);
   				}

   				return Math.sqrt(sum);
   			}

   			function manhattanDistance(w, a, b) {
   				var sum = 0;
   				for (var f = 0; f < a.length && f < b.length && f < w.length; f++) {
   					sum += Math.abs(a[f]-b[f]);
   				}

   				return sum;
   			}

   			function cosineSimularity(w, a, b) {
   				return dot(a, b)/(mag(a)*mag(b));
   			}

   			function calcDistance(ds, dataSet, paramSet, getVariance, distanceFunction, p) {
   				var w = [];
   				paramSet.forEach(function(item, index) {
   					w.push(1/getVariance(item));
   				});

   				var dsDist = [];
   				dataSet.forEach(function(dsOther, index) {
   					var a = [];
   					var b = [];
   					paramSet.forEach(function(item, index) {
   						a.push(+ds.params[item]);
   						b.push(+dsOther.params[item]);
   					});
   					var distance = distanceFunction(w, a, b);
   					dsDist.push({id: index, distance: distance, weight: 1/(Math.pow(distance,p))});
   				});

				dsDist.sort(function(a, b){return a.distance-b.distance});

   				return dsDist;
   			}

   			function calcParamInfo(dataSet) {
   				var paramInfo = {};
   				var paramSet = Object.keys(dataSet[0].params).filter(function(d) {
					return !isNaN(+dataSet[0].params[d]);
				});

				paramSet.forEach(function(item, index) {
					var key = item;
					var mean = 0;
					var max = 0;
					var min = 0;
					dataSet.forEach(function(item, index) {
						var val = +item.params[key];
						if (index == 0) {
							max = val;
							min = val;
						}
						else {
							max = max < val ? val : max;
							min = min > val ? val : min;
						}
						mean += val;
					});
					mean /= dataSet.length;

					var variance = 0;
					dataSet.forEach(function(item, index) {
						var val = +item.params[key];
						variance += (val - mean)*(val-mean);
					});
					variance /= dataSet.length;

					paramInfo[key] = {mean: mean, variance: variance, max: max, min: min};
				});

				return paramInfo;
   			}