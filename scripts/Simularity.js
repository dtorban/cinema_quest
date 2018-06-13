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

   			function vectorMult(a, b) {
   				var c = [];
   				for (var f = 0; f < a.length; f++) {
   					c.push(a[f]*b[f]);
   				}
   				return c;
   			}

   			function vectorAdd(a, b) {
   				var c = [];
   				for (var f = 0; f < a.length; f++) {
   					c.push(a[f]+b[f]);
   				}
   				return c;
   			}

            function vectorSubtract(a, b) {
               var c = [];
               for (var f = 0; f < a.length; f++) {
                  c.push(a[f]-b[f]);
               }
               return c;
            }

   			function average(x) {
   				var sum = x.reduce(function(a, b) { return a + b; });
				return sum / x.length;
   			}

   			function weightedEclideanDistance(w, a, b) {
   				var sum = 0;
   				if (w) {
	   				for (var f = 0; f < a.length && f < b.length && f < w.length; f++) {
	   					sum += w[f]*Math.pow(a[f]-b[f],2);
	   				}
   				}
   				else {
   					for (var f = 0; f < a.length && f < b.length; f++) {
	   					sum += Math.pow(a[f]-b[f],2);
	   				}
   				}

   				return Math.sqrt(sum);
   			}

   			function manhattanDistance(w, a, b) {
               a = vectorAdd(a, w);
               b = vectorAdd(b, w);
   				var sum = 0;
   				for (var f = 0; f < a.length && f < b.length && f < w.length; f++) {
   					sum += Math.abs(a[f]-b[f]);
   				}

   				return sum;
   			}

   			function centeredCosineSimularity(w, a, b) {
               if (w) {
                  a = vectorAdd(a, w);
                  b = vectorAdd(b, w);
               }
   				var x = -(dot(a, b)/(mag(a)*mag(b)));
   				//console.log(a, b, dot(a, b), mag(a), mag(b),x);
   				return x;
   			}

   			function calcDistance(ds, dataSet, paramSet, getWeight, distanceFunction, p) {
   				var w = [];
   				paramSet.forEach(function(item, index) {
   					w.push(getWeight(item));
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

   			function calcStatistics(items, getValue) {
   				var mean = 0;
   				var max = 0;
   				var min = 0;
   				items.forEach(function(item, index) {
   					var val = getValue(item);
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
   				mean /= items.length;

   				var variance = 0;
   				items.forEach(function(item, index) {
   					var val = getValue(item);
   					variance += (val - mean)*(val-mean);
   				});
   				variance /= items.length;

   				return {mean: mean, variance: variance, max: max, min: min};
      		}

      		function calcParamInfo(dataSet) {
      				var paramInfo = {};
      				var paramSet = Object.keys(dataSet[0].params).filter(function(d) {
   					    return !isNaN(+dataSet[0].params[d]);
   			      });

   				paramSet.forEach(function(item, index) {
   					var key = item;

   					paramInfo[key] = calcStatistics(dataSet, function(d) { return +d.params[key]; });
   				});

   				return paramInfo;
   			}