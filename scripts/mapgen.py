#/bin/bash python

import logging
import json
import noise
import curses
import math
import numpy as np

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
    return (str(z) + '.', curses.color_pair(z))

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
      return ('..', curses.color_pair(1))
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

  contour = Contour(elevation, 0.0)
  contour.generate()

  world.layers.append(elevation)
  world.layers.append(contour)

  print_world(scr, world)
  scr.refresh()
  scr.getch()

if __name__ == '__main__':
  init_log()
  curses.wrapper(main)
