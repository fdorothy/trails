#/bin/bash python

from random import shuffle
import logging
import json
import noise
import curses
import math
import numpy as np
import sets

global logger

def init_log():
  global logger
  logger = logging.getLogger(__file__)
  hdlr = logging.FileHandler(__file__ + ".log")
  formatter = logging.Formatter('%(asctime)s %(levelname)s %(message)s')
  hdlr.setFormatter(formatter)
  logger.addHandler(hdlr)
  logger.setLevel(logging.DEBUG)
  logger.info("mapgen init")

def rotate(u, theta):
  m = np.array([[np.cos(theta), -np.sin(theta)],
                [np.sin(theta), np.cos(theta)]])
  return np.dot(m, u)

class Layer(object):
  def __init__(self, size, name = "layer"):
    self.set_size(size)
    self.name = name

  def set_size(self, size):
    self.size = size

  def local_area(self, x, y):
    data = []
    for i in range(x-1,x+2):
      for j in range(y-1,y+2):
        data.append(self.data[j,i])
    return np.array(data)

  def generate(self):
    self.data = np.zeros((self.size[0], self.size[1]))

  def display(self, i, j):
    z = self.data[j,i]
    return (str(z))

class Elevation(Layer):
  def __init__(self, size, name = "elevation"):
    self.angle = math.radians(0.0)
    self.scale = (1.0, 1.0)
    super(Elevation, self).__init__(size, name)

  def generate(self):
    super(Elevation, self).generate()
    for i in range(0,self.size[0]):
      for j in range(0,self.size[1]):
        u = np.array([i+1,j+1])
        u = rotate(u,-self.angle)
        u[0] *= 1.0/self.scale[0]
        u[1] *= 1.0/self.scale[1]
        self.data[j,i] = noise.pnoise2(u[0], u[1])

  def display(self, i, j):
    z = self.data[j,i]
    z = int((z+1.0) * 5.0)
    return ('..', curses.color_pair(z))

class Contour(Layer):
  def __init__(self, elevation, val, name = "contour"):
    self.elevation = elevation
    self.val = val
    super(Contour, self).__init__(self.elevation.size, name)

  def generate(self):
    super(Contour, self).generate()
    for i in range(1, self.size[0]-1):
      for j in range(1, self.size[1]-1):
        local = self.elevation.local_area(i, j)
        if self.val > local.min() and self.val < local.max():
          self.data[j,i] = 1

  def display(self, i, j):
    if self.data[j,i]:
      return ('..', curses.color_pair(0))
    else:
      return None

class Path(Layer):
  def __init__(self, elevation, start, end, name = "path"):
    self.elevation = elevation
    self.start = start
    self.end = end
    self.data = None
    super(Path, self).__init__(self.elevation.size, name)

  def neighbors(self, pos):
    x,y = pos
    return [
      (x-1, y-1),
      (x, y-1),
      (x+1, y-1),
      (x-1, y),
      (x+1, y),
      (x-1, y+1),
      (x, y+1),
      (x+1, y+1)
    ]

  def lowest_score(self, openSet, fScore):
    mink = None
    minv = 0
    for k in openSet:
      v = fScore[k]
      if mink == None or v < minv:
        mink = k
        minv = v
    return (mink, minv)

  def dist_between(self, p1, p2):
    z1 = self.elevation.data[p1[1],p1[0]]
    z1 = int((1.0+z1)*5.0)
    z2 = self.elevation.data[p2[1],p2[0]]
    z2 = int((1.0+z2)*5.0)
    path = self.data[p2[1],p2[0]]
    d = math.sqrt(float(p1[0]-p2[0])**2 + float(p1[1]-p2[1])**2 + 10*float(z2-z1)**2)
    if path == 1:
      return d*0.75
    else:
      return d

  def heuristic_cost_estimate(self, start, end):
    return self.dist_between(start, end)

  def reconstruct_path(self, cameFrom, current):
    total_path = [current]
    while current in cameFrom:
      current = cameFrom[current]
      total_path.append(current)
    return total_path

  def generate(self):
    if self.data == None:
      super(Path, self).generate()
    closedSet = sets.Set([])
    start = (self.start[0], self.start[1])
    goal = (self.end[0], self.end[1])
    openSet = sets.Set([start])
    cameFrom = {}
    gScore = {}
    gScore[start] = 0
    fScore = {}
    fScore[start] = self.heuristic_cost_estimate(start, goal)

    while len(openSet) > 0:
      current, f = self.lowest_score(openSet, fScore)
      logger.info("visiting %d,%d" % (current[0], current[1]))
      logger.info("openSet = %s" % str(openSet))
      if current == goal:
        path = self.reconstruct_path(cameFrom, current)
        for (x,y) in path:
          if self.data[y,x] == 0:
            self.data[y,x] = 1
        self.data[path[0][1],path[0][0]] = 2
        self.data[path[-1][1],path[-1][0]] = 2
        logger.info("ok, path = %s" % str(path))
        return True
      openSet.remove(current)
      closedSet.add(current)
      for neighbor in self.neighbors(current):
        if (neighbor[0] >= 0 and neighbor[1] >= 0 and
            neighbor[0] < self.size[0] and neighbor[1] < self.size[1]):
          if neighbor in closedSet:
            continue
          openSet.add(neighbor)
          tentative_gScore = gScore[current] + self.dist_between(current, neighbor)
          if neighbor in gScore and tentative_gScore >= gScore[neighbor]:
            continue
          cameFrom[neighbor] = current
          gScore[neighbor] = tentative_gScore
          fScore[neighbor] = gScore[neighbor] + self.heuristic_cost_estimate(neighbor, goal)

    return False

  def display(self, i, j):
    z = self.data[j,i]
    if z == 1:
      x,c = self.elevation.display(i,j)
      return ('@ ', c)
    elif z == 2:
      x,c = self.elevation.display(i,j)
      return ('X ', c)
    else:
      return None

class World(object):
  def __init__(self, size):
    self.layers = []
    self.set_size(size)
    self.generate()

  def set_size(self, size):
    self.size = size
    for layer in self.layers:
      layer.set_size(size)

  def generate(self):
    for layer in self.layers:
      layer.generate()

def print_world(screen, world):
  curses.start_color()
  curses.use_default_colors()
  for i in range(1, 11):
    r,g,b = ((i-1)*100, (i-1)*100, (i-1)*100)
    if i < 3:
      b += 300 * i
    elif i == 3:
      r += 500
      g += 500
    elif i<6:
      g += 25 * i
    curses.init_color(i, r, g, b)
  for i in range(0, curses.COLORS):
    curses.init_pair(i, 0, i)

  (height,width) = screen.getmaxyx()
  min_x = 0
  min_y = 0
  max_x = min(width/2, world.size[0])
  max_y = min(height-1, world.size[1])
  logger.info("ok, drawing from (%d,%d) -> (%d,%d)" % (min_x, min_y, max_x, max_y))

  x = 0
  for i in range(min_x, max_x):
    for j in range(min_y, max_y):
      for layer in world.layers:
        v = layer.display(i,j)
        if v == None:
          pass
        elif len(v) == 1:
          screen.addstr(j, x, v[0])
        elif len(v) == 2:
          screen.addstr(j, x, v[0], v[1])
    x += 2

def main(scr):
  scr.clear()

  size = (50, 50)
  world = World(size)
  
  elevation = Elevation(size)
  elevation.scale = (20.0, 8.0)
  elevation.angle = math.radians(-30.0)
  elevation.generate()

  # random points of interest within the map
  poi = []
  pad = 0.25
  inc = 0.2
  for i in range(int(size[0]*pad), int(size[0]*(1.0-pad)), int(size[0]*inc)):
    for j in range(int(size[1]*pad), int(size[1]*(1.0-pad)), int(size[1]*inc)):
      poi.append((int(i),int(j)))
  shuffle(poi)
  poi = poi[0:2]

  # random points of interest to the n, s, e and w
  poi += [
    (size[0]/2, 0),
    (size[0]/2, size[1]-1),
    (0, size[1]/2),
    (size[0]-1, size[1]/2)
  ]

  path = Path(elevation, (0,0), (0,0))
  for i in range(0,len(poi)-1):
    for j in range(i+1,len(poi)):
      path.start = poi[i]
      path.end = poi[j]
      path.generate()

  world.layers.append(elevation)
  world.layers.append(path)

  print_world(scr, world)
  scr.refresh()
  scr.getch()

if __name__ == '__main__':
  init_log()
  curses.wrapper(main)
