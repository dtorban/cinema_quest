import random
import math
import sys

with open("data.csv", "w") as csvFile:
	csvFile.write("Height,Center,Standard Deviation,Start,FILE\n")
	#csvFile.write("Height,Center,Standard Deviation,FILE\n")
	for i in range(0, 500):
		a = random.random()
		b = (random.random()-0.5)*2.0
		c = random.random()
		start = (random.random()-0.5)/10.0
		fileName = "" + str(i) + ".csv"
		csvFile.write("" + str(a) + "," + str(b) + "," + str(c) + "," + str(start) + "," + fileName + "\n")
		#csvFile.write("" + str(a) + "," + str(b) + "," + str(c) + "," + fileName + "\n")
		with open(fileName, "w") as dataFile:
			for f in range(0, 2000):
				x = start+(1.0*f/2000 - 0.5)*2.0
				y = a*math.exp(-math.pow(x-b,2)/(2.0*c*c))
				dataFile.write(str(x) + "," + str(y) + "\n")