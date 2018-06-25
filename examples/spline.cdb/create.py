import random
import math
import sys
import numpy as np

from scipy.misc import comb

def bernstein_poly(i, n, t):
    """
     The Bernstein polynomial of n, i as a function of t
    """

    return comb(n, i) * ( t**(n-i) ) * (1 - t)**i


def bezier_curve(points, nTimes=1000):
    """
       Given a set of control points, return the
       bezier curve defined by the control points.

       points should be a list of lists, or list of tuples
       such as [ [1,1], 
                 [2,3], 
                 [4,5], ..[Xn, Yn] ]
        nTimes is the number of time steps, defaults to 1000

        See http://processingjs.nihongoresources.com/bezierinfo/
    """

    nPoints = len(points)
    xPoints = np.array([p[0] for p in points])
    yPoints = np.array([p[1] for p in points])

    t = np.linspace(0.0, 1.0, nTimes)

    polynomial_array = np.array([ bernstein_poly(i, nPoints-1, t) for i in range(0, nPoints)   ])

    xvals = np.dot(xPoints, polynomial_array)
    yvals = np.dot(yPoints, polynomial_array)

    return xvals, yvals

def catmullRom(v0, v1, v2, v3, s):
		s1 = s;
		s2 = s*s;
		s3 = s2*s;

		f1 = -s3 + 2.0 * s2 - s;
		f2 = 3.0 * s3 - 5.0 * s2 + 2.0;
		f3 = -3.0 * s3 + 4.0 * s2 + s;
		f4 = s3 - s2;

		return (f1 * v0 + f2 * v1 + f3 * v2 + f4 * v3) / 2.0;


with open("data.csv", "w") as csvFile:
	csvFile.write("i,a,b,c,d,FILE\n")
	#csvFile.write("Height,Center,Standard Deviation,FILE\n")
	for i in range(0, 100):
		#vi = np.array([0.0,random.random()]);
		vi = np.array([0.0,random.random()]);
		v0 = np.array([0.25,random.random()]);
		v1 = np.array([0.5,random.random()]);
		v2 = np.array([0.75,random.random()]);
		v3 = np.array([1.0,random.random()]);
		fileName = "" + str(i) + ".csv"
		csvFile.write("" + str(vi[1]) + "," + str(v0[1]) + "," + str(v1[1])  + "," + str(v2[1])  + "," + str(v3[1]) + "," + fileName + "\n")
		#csvFile.write("" + str(a) + "," + str(b) + "," + str(c) + "," + fileName + "\n")
		with open(fileName, "w") as dataFile:
			for f in range(0, 200):
				x = 1.0*f/200;
				if (x < 0.25):
					sp = catmullRom(vi, vi, v0, v1, x*4.0)
				elif (x < 0.5):
					sp = catmullRom(vi, v0, v1, v2, (x-0.25)*4.0)
				elif (x < 0.75):
					sp = catmullRom(v0, v1, v2, v3, (x-0.5)*4.0)
				else:
					sp = catmullRom(v1, v2, v3, v3, (x-0.75)*4.0)
				#x = math.cos(2.0*3.14158*f/(200-1))
				#y = math.sin(2.0*3.14158*f/(200-1))
				dataFile.write(str(sp[0]) + "," + str(sp[1]) + "\n")
			#for f in range(0, 20):
			#	dataFile.write(str(1.0 + 0.25*f/20) + "," + str(0.5) + "\n")
			points = [v3,v2,v1,v0,vi]
			xvals, yvals = bezier_curve(points, nTimes=200)
				#x = math.cos(2.0*3.14158*f/(200-1))
				#y = math.sin(2.0*3.14158*f/(200-1))
			#for f in range(0, 200):
			#	dataFile.write(str(xvals[f] + 1.25) + "," + str(yvals[f]) + "\n")
