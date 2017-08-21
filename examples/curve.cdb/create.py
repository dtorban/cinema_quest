import random
import math
import sys

with open("data.csv", "w") as csvFile:
	csvFile.write("Mag1,Mag2,Phase1,Phase2,FILE\n")
	for i in range(0, 500):
		mag1 = random.random()
		mag2 = random.random()
		phase1 = random.random()*1;
		phase2 = random.random()*2;
		c = random.random()
		start = (random.random()-0.5)/10.0
		fileName = "" + str(i) + ".csv"
		csvFile.write("" + str(mag1) + "," + str(mag2) + "," + str(phase1) + "," + str(phase2) + "," + fileName + "\n")
		with open(fileName, "w") as dataFile:
			for f in range(0, 2000):
				x = 1.0*f/2000
				y = mag1*math.cos(2.0*math.pi*phase1*x) + mag2*math.sin(2.0*math.pi*phase2*x)
				dataFile.write(str(x) + "," + str(y) + "\n")