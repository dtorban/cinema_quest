#Cinema Quest
##Version 1.1
​
An interactive visual tool for querying Cinema Database ensembles.
​
###NOTE: The only datasets included in the code are those in the examples folder
​
##Usage
* View SpecD Cinema Databases across multiple dimensionally reduced views.
* Query continous spaces using several interpolation methods.


## Getting started

Clone the repository and generate example data:

```
# Clone repository
git clone <path to quest repository>
cd quest
# Generate example datasets
cd examples/gaussian.cdb
python create.py
cd ../curve.cdb
python create.py
cd ../..

```

Open index.html in the Firefox web browser

## View a SpecD Cinema Database Using Quest
* Copy the database to data/MyCinemaDatabase.cdb
* Edit databases.json to add database as an option for quest.  For example:
```
[
	{"name" : "Rainbow Sphere", "database" : "examples/rainbowsphere_D.cdb"},
	{"name" : "Guassian", "database" : "examples/gaussian.cdb"},
	{"name" : "Curve Example", "database" : "examples/curve.cdb"}
	{"name" : "My Cinema Database", "database" : "data/MyCinemaDatabase.cdb"}
]

# name - The name of the database
# database - The location of the database (i.e. data/MyCinemaDatabase.cdb)
```

## Displaying CSV Files Instead of Images
* To display csv files instead of images, add data loading information in the quest.json file:
  * Store the quest.json file in MyCinemaDatabase.cdb/quest.json.
  * The following is an example of a quest.json file (also look at examples/curve.cdb/quest.json):
```
{
	"type" : "csv",
	"delimiter" : " ",
	"columns" : [1,3],
	"sample" : {
		"start" : "1000",
		"length" : "4500",
		"step" : "10"
	}
}

# type (Required) - Either "image" or "csv"
# delimiter (Required if type is "csv") - The delimiter for the file (i.e. "\t", " ", ",", etc...)
# columns (Required if type is "csv") - The columns to read for x and y respectively out of the file.  If only one column is specified, the y value will be set and x will be a series from 0 to the number of rows.
# sample.start (Optional) - Set's the start row
# sample.length (Optional) - Set's the number of rows to read from the start
# sample.step (Optional) - Set's the number of rows to skip per sample

```

## Create a New Interpolation Method
* Add a function of the following form and add it to the "interpFunctions" array in index.html (See interpolate1() function for example):
```
function interpolate1(query, trainingSet) {
	// calculate interpolated data set (interpolatedInstance) and find nearest neighbors distances (neighbors)
   	return {ds: interpolatedInstance, neighbors: neighbors, color: 'cyan'};
}

// Simple interpolation function - returns the first value in training set:
function interpolate_UseFirstValue(query, trainingSet) {
	var interpolatedInstance = trainingSet[0];
	var neighbors = [{id: 0, distance: 0.0, weight: 1.0}];
	return {ds: interpolatedInstance, neighbors: neighbors, color: 'cyan'};
}
```
​
##Issues
* Currently Quest only interactively supports up to 500 instances due to the performance of SVG in the parallel coordinates plot.  This can be improved by using the HTML5 Canvas.
* A Cinema Database needs to have at least 2 parameters to calculate PCA.
* The first time quest is loaded, you have to refresh due to a loading bug in the lib/ColorMapPicker.js

##Changelog
###Version 1.0
 * Initial Release