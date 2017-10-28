#/bin/bash python

from PIL import Image
from PIL import ImageDraw

import random
from random import shuffle
import json
import noise
import curses
import math
import numpy as np
import sets
import tiled

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
      if current == goal:
        path = self.reconstruct_path(cameFrom, current)
        for (x,y) in path:
          if self.data[y,x] == 0:
            self.data[y,x] = 1
        self.data[path[0][1],path[0][0]] = 2
        self.data[path[-1][1],path[-1][0]] = 2
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

# indexes organized like..
#  0 1 2
#  3   4
#  5 6 7
def tile_n_idx(vals):
  acc = 0
  for i in range(len(vals)):
    acc += (int)(vals[i])<<i
  return acc

def neighbors(x,y,data,width,height):
  return [
    data[max([0,y-1]),x],
    data[min([height-1,y+1]),x],
    data[y,max([0,x-1])],
    data[y,min([width-1,x+1])]
  ]

def main(size, scale, angle, edge_mask, name, seed):
  elevation = Elevation(size)
  elevation.base = seed
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
  edges = []
  if edge_mask[0]:
    edges.append((size[0]/2, 0, "top"))
  if edge_mask[1]:
    edges.append((size[0]/2, size[1]-1, "bottom"))
  if edge_mask[2]:
    edges.append((0, size[1]/2, "left"))
  if edge_mask[3]:
    edges.append((size[0]-1, size[1]/2, "right"))
  poi = [(e[0], e[1]) for e in edges] + poi

  # connect each poi to closest non-visited poi
  path = Path(elevation, (0,0), (0,0))
  visited = sets.Set()
  nonvisited = sets.Set([i for i in range(len(poi))])
  connections = []
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
      connections.append((poi[i], poi[closest]))
      print "connecting %s to %s" % (str(path.start), str(path.end))
      path.generate()

  t = tiled.Tiled()
  t.width = size[0]
  t.height = size[1]
  ts = tiled.Tileset()
  ts.image = "../images/woodland_ground.png"
  ts.name = "woodland_ground"
  ts.columns = 16
  ts.imageheight = 16*32
  ts.imagewidth = 16*32
  ts.tilecount = 16*16
  t.tilesets += [ts]

  # some tile indexes for our woodland tileset
  grass = [1, 17, 33, 49, 65]
  grass_decor = {
    1: [tile_id(5,7)],
    2: [tile_id(3,8),tile_id(4,8)],
    3: [tile_id(12,0),tile_id(13,0)],
    4: [tile_id(14,0),tile_id(15,0)],
    5: [tile_id(12,1),tile_id(13,1)],
    6: [tile_id(14,1),tile_id(15,1)]
  }

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

  water = {}
  # up down left right
  water[tile4_idx(1,0,1,0)] = tile_id(7,6)
  water[tile4_idx(0,1,1,0)] = tile_id(7,4)
  water[tile4_idx(1,1,1,0)] = tile_id(7,5)
  water[tile4_idx(1,0,0,1)] = tile_id(5,6)
  water[tile4_idx(0,1,0,1)] = tile_id(5,4)
  water[tile4_idx(1,1,0,1)] = tile_id(5,5)
  water[tile4_idx(1,0,1,1)] = tile_id(6,6)
  water[tile4_idx(0,1,1,1)] = tile_id(6,4)
  water[tile4_idx(1,1,1,1)] = tile_id(6,5)
  water_ul = tile_id(5,2)
  water_ur = tile_id(6,2)
  water_dl = tile_id(5,3)
  water_dr = tile_id(6,3)

  # grass decoration layer (flowers and such)
  grass_decor_layer = tiled.TileLayer()
  grass_decor_layer.name = "grass_decor"
  grass_decor_layer.width = size[0]
  grass_decor_layer.height = size[1]
  grass_decor_layer.data = []

  # fill in the steppes (hills and water)
  steppes = elevation.data.copy()
  min_z = steppes.min()
  max_z = steppes.max()
  for x in range(size[0]):
    for y in range(size[1]):
      z = steppes[y,x]
      steppes[y,x] = 1+int(5*(z-min_z)/(max_z-min_z))

  # fill with random grass
  tl = tiled.TileLayer()
  tl.name = "ground"
  tl.width = size[0]
  tl.height = size[1]
  tl.data = []
  prob = 0.1
  for y in range(size[1]):
    for x in range(size[0]):
      tl.data.append(random.choice(grass))
      if random.randint(0,100)/100.0 < prob:
        elev = steppes[y,x]
        grass_decor_layer.data.append(random.choice(grass_decor[int(elev)]))
      else:
        grass_decor_layer.data.append(0)
  t.layers += [tl,grass_decor_layer]

  # fill in the water
  for y in range(size[1]):
    for x in range(size[0]):
      if steppes[y,x] == 1:
        vals = neighbors(x,y,steppes,size[0],size[1])
        idx = tile4_idx(*[v == 1 for v in vals])
        pos = x+y*size[0]
        if water.has_key(idx):
          tl.data[pos] = water[idx]
        if tl.data[pos] == water[15]:
          if (x > 0 and y > 0 and
              x < size[0]-1 and y < size[1]-1):
            if steppes[y-1,x-1]!=1:
              tl.data[pos] = water_ul
            elif steppes[y-1,x+1]!=1:
              tl.data[pos] = water_ur
            elif steppes[y+1,x-1]!=1:
              tl.data[pos] = water_dl
            elif steppes[y+1,x+1]!=1:
              tl.data[pos] = water_dr

  # make the paths layer
  pl = tiled.TileLayer()
  pl.name = "paths"
  pl.width = size[0]
  pl.height = size[1]
  pl.data = []
  for y in range(size[1]):
    for x in range(size[0]):
      val = 0
      if path.data[y,x] != 0:
        n = neighbors(x,y,path.data,size[0],size[1])
        n = [i != 0 for i in n]
        idx = tile_n_idx(n)
        if trail.has_key(idx):
          val = trail[idx]
          grass_decor_layer.data[x+y*size[0]] = 0
      pl.data.append(val)
  t.layers += [pl]

  # make some sign posts / structures
  sl = tiled.TileLayer()
  sl.name = "signs"
  sl.width = size[0]
  sl.height = size[1]
  sl.data = [0]*(size[0]*size[1])
  marker = [
    tile_id(0,7),
    tile_id(1,7),
    tile_id(2,7),
    tile_id(3,7),
    tile_id(4,7),
    tile_id(13,12)
  ]
  idx = 0
  visited = sets.Set()
  for c in connections:
    for p in c:
      if not p in visited:
        x = random.randint(-3,3)+p[0]
        x = min([max([x,0]),size[0]-1])
        y = random.randint(-3,3)+p[1]
        y = min([max([y,0]),size[1]-1])
        sl.data[x+y*size[0]] = marker[idx]
        idx=idx+1
        if idx >= len(marker):
          idx = 0
        visited.add(p)
  t.layers += [sl]

  # make the minimap png
  img = Image.open("../assets/images/map.png")
  draw = ImageDraw.Draw(img)

  color = (200, 200, 120, 255)
  for y in range(3,img.height-3):
    for x in range(3,img.width-3):
      # if there is a path in this area then
      # draw it on the minimap
      x0 = x*size[0]/img.width
      y0 = y*size[1]/img.height
      z = steppes[y0,x0]
      if (steppes[y0+1,x0] < z or
          steppes[y0,x0+1] < z or
          steppes[y0-1,x0] < z or
          steppes[y0,x0-1] < z):
        draw.point((x,y),color)

  color = (128, 128, 128, 255)
  # for c in connections:
  #   x0 = c[0][0]*img.width/size[0]
  #   y0 = c[0][1]*img.height/size[1]
  #   x1 = c[1][0]*img.width/size[0]
  #   y1 = c[1][1]*img.height/size[1]
  #   draw.line([(x0,y0),(x1,y1)],color)
  #   # draw.line([(x0-2,y0-2),(x0+2,y0+2)],color)
  #   # draw.line([(x0+2,y0-2),(x0-2,y0+2)],color)
  #   # draw.line([(x1-2,y1-2),(x1+2,y1+2)],color)
  #   # draw.line([(x1+2,y1-2),(x1-2,y1+2)],color)
  for x in range(img.width-1):
    for y in range(img.height-1):
      x0 = int(size[0]*x/img.width)
      y0 = int(size[1]*y/img.height)
      x1 = int(size[0]*(x+1)/img.width)
      y1 = int(size[1]*(y+1)/img.height)
      if x1 <= x0:
        x1 = x0+1
      if y1 <= y0:
        y1 = y0+1
      chunk = path.data[y0:y1,x0:x1]
      if 1 in chunk:
        draw.point((x,y), color)

  img.save("../assets/images/minimaps/%s.png" % name, "PNG")

  # setup rectangles for path exits on the corners
  exits = tiled.ObjectGroup()
  exits.name = "exits"
  objid = 1
  for edge in edges:
    obj = tiled.Object()
    obj.name = "exit %s" % str(edge[2])
    obj.mytype = "exit"
    obj.x = (edge[0]-5)*32
    obj.y = (edge[1]-5)*32
    obj.width = 10*32
    obj.height = 10*32
    obj.properties["tooltip"] = "follow this path?"
    obj.propertytypes["tooltip"] = "string"
    obj.myid = objid
    exits.objects.append(obj)
    objid += 1
  t.layers += [exits]
    

  # set the minimap in the json file
  t.properties["minimap"] = "assets/images/minimaps/%s.png" % name
  t.propertytypes["minimap"] = "string"

  data = t.to_json()

  f = open("../assets/maps/%s.json" % name, "w")
  json.dump(data, f, sort_keys=True, indent=2)
  f.close()

if __name__ == '__main__':
  scale = (125.0, 50.0)
  angle = math.radians(-30.0)
  size = (100, 100)
  edges = [1, 1, 1, 1]

  base = random.randint(0,1024)
  main(size, scale, angle, edges, "sample", base)
