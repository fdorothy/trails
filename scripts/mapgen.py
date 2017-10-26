#/bin/bash python

import random
from random import shuffle
import logging
import json
import noise
import curses
import math
import numpy as np
import sets
import tiled

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

class Elevation(Layer):
  def __init__(self, size, name = "elevation"):
    self.angle = math.radians(0.0)
    self.scale = (1.0, 1.0)
    self.base = 0
    super(Elevation, self).__init__(size, name)

  def generate(self):
    super(Elevation, self).generate()
    for i in range(0,self.size[0]):
      for j in range(0,self.size[1]):
        u = np.array([i+1,j+1])
        u = rotate(u,-self.angle)
        u[0] *= 1.0/self.scale[0]
        u[1] *= 1.0/self.scale[1]
        z = noise.pnoise2(u[0], u[1], 4, base=self.base)
        #self.data[j,i] = int((z+1)*5)
        self.data[j,i] = z

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
      #(x-1, y-1),
      (x+0, y-1),
      #(x+1, y-1),
      (x-1, y),
      (x+1, y),
      #(x-1, y+1),
      (x+0, y+1),
      #(x+1, y+1),
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
    #z1 = int((1.0+z1)*5.0)
    z2 = self.elevation.data[p2[1],p2[0]]
    #z2 = int((1.0+z2)*5.0)
    path = self.data[p2[1],p2[0]]
    d = math.sqrt(float(p1[0]-p2[0])**2 + float(p1[1]-p2[1])**2 + (100000.0*float(z2-z1))**2)
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

def tile_id(x,y):
  return y*16+x+1

def tile4_idx(up, down, left, right):
  return (int)(up) + ((int)(down)<<1) + ((int)(left)<<2) + ((int)(right)<<3)

def main(size, scale, angle):
  elevation = Elevation(size)
  elevation.scale = scale
  elevation.angle = angle
  elevation.generate()

  # random points of interest within the map
  poi = []
  pad = 0.25
  inc = 0.2
  for i in range(int(size[0]*pad), int(size[0]*(1.0-pad)), int(size[0]*inc)):
    for j in range(int(size[1]*pad), int(size[1]*(1.0-pad)), int(size[1]*inc)):
      poi.append((int(i),int(j)))
  shuffle(poi)
  poi = poi[0:5]

  # random points of interest to the n, s, e and w
  edges = [
    (size[0]/2, 3),
    (size[0]/2, size[1]-3),
    (3, size[1]/2),
    (size[0]-3, size[1]/2)
  ]
  shuffle(edges)
  poi = edges + poi

  # connect each poi to closest non-visited poi
  path = Path(elevation, (0,0), (0,0))
  visited = sets.Set()
  nonvisited = sets.Set([i for i in range(len(poi))])
  while len(nonvisited) > 0:
    i = nonvisited.pop()
    closest = -1
    mind = 1e9
    visited.add(i)
    for j in nonvisited:
      if i != j:
        d = math.sqrt((poi[i][0]-poi[j][0])**2 + (poi[i][1]-poi[j][1])**2)
        if closest == -1:
          closest = j
          mind = d
        else:
          if d < mind:
            mind = d
            closest = j
    if closest != -1:
      path.start = poi[i]
      path.end = poi[closest]
      print "connecting %s to %s" % (str(path.start), str(path.end))
      path.generate()

  t = tiled.Tiled()
  t.width = size[0]
  t.height = size[1]
  ts = tiled.Tileset()
  ts.image = "woodland_ground.png"
  ts.name = "woodland_ground"
  ts.columns = 16
  ts.imageheight = 16*32
  ts.imagewidth = 16*32
  ts.tilecount = 16*16
  t.tilesets += [ts]

  # some tile indexes for our woodland tileset
  grass = [1, 17, 33, 49, 65]

  trail = {}
  # up down left right
  trail[tile4_idx(0,0,0,0)] = 0
  trail[tile4_idx(1,0,0,0)] = tile_id(5,8)
  trail[tile4_idx(0,1,0,0)] = tile_id(4,3)
  trail[tile4_idx(1,1,0,0)] = tile_id(1,1)
  trail[tile4_idx(0,0,1,0)] = tile_id(1,8)
  trail[tile4_idx(1,0,1,0)] = tile_id(2,1)
  trail[tile4_idx(0,1,1,0)] = tile_id(2,0)
  trail[tile4_idx(1,1,1,0)] = tile_id(3,3)
  trail[tile4_idx(0,0,0,1)] = tile_id(0,8)
  trail[tile4_idx(1,0,0,1)] = tile_id(2,3)
  trail[tile4_idx(0,1,0,1)] = tile_id(2,2)
  trail[tile4_idx(1,1,0,1)] = tile_id(1,3)
  trail[tile4_idx(0,0,1,1)] = tile_id(1,0)
  trail[tile4_idx(1,0,1,1)] = tile_id(1,4)
  trail[tile4_idx(0,1,1,1)] = tile_id(3,2)
  trail[tile4_idx(1,1,1,1)] = tile_id(1,2)
  print trail

  # fill with random grass
  tl = tiled.TileLayer()
  tl.name = "elevation"
  tl.width = size[0]
  tl.height = size[1]
  tl.data = []
  for x in range(size[0]*size[1]):
    tl.data.append(random.choice(grass))
  t.layers += [tl]

  # make the paths layer
  pl = tiled.TileLayer()
  pl.name = "paths"
  pl.width = size[0]
  pl.height = size[1]
  pl.data = []
  for y in range(size[1]):
    for x in range(size[0]):
      val = 0
      if (x > 0 and y > 0 and
          x < size[0]-1 and y < size[1]-1 and
          path.data[y,x] != 0):
        up = (path.data[y-1,x] != 0)
        down = (path.data[y+1,x] != 0)
        left = (path.data[y,x-1] != 0)
        right = (path.data[y,x+1] != 0)
        idx = tile4_idx(up,down,left,right)
        if trail.has_key(idx):
          val = trail[idx]
      pl.data.append(val)
  t.layers += [pl]

  data = t.to_json()

  f = open("map.json", "w")
  json.dump(data, f, sort_keys=True, indent=2)
  f.close()

if __name__ == '__main__':
  init_log()

  scale = (125.0, 50.0)
  angle = math.radians(-30.0)
  size = (100, 100)

  main(size, scale, angle)
