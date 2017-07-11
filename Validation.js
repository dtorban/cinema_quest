'use strict'

   			class LeaveOneOutCrossValidation {
	   			constructor(dataSize) {
	   				this.set = [];

	   				for (var f = 0; f < dataSize; f++) {
	   					this.set.push(f);
	   				}
	   			}

	   			getTrainingSet(i) {
	   				return this.set.slice(0,i).concat(this.set.slice(i+1));
	   			}
	   		}

	   		class KFoldCrossValidation {
	   			constructor(k, dataSize) {
	   				this.sets = [];
	   				this.setMapping = {};

	   				for (var f = 0; f < k; f++) {
	   					this.sets.push([]);
	   				}

	   				for (var f = 0; f < dataSize; f++) {
	   					var setNum = Math.floor(Math.random()*k);
	   					this.setMapping[f] = setNum;
	   					this.sets[setNum].push(f);
	   				}
	   			}

	   			getTrainingSet(i) {
	   				var testSet = [];
	   				var validationSet = this.setMapping[i];
	   				for (var f = 0; f < this.sets.length; f++) {
	   					if (validationSet != f) {
	   						testSet = testSet.concat(this.sets[f]);
	   					}
	   				}

	   				return testSet;
	   			}
	   		}
