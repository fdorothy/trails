import math
import mapgen
import random

if __name__ == '__main__':
  scale = (125.0, 50.0)
  angle = math.radians(-30.0)
  size = (100, 100)

  # up down left right
  variants = {
    'x': [1, 1, 1, 1],
    'ud': [1, 1, 0, 0],
    'lr': [0, 0, 1, 1],
    'c_ul': [1, 0, 1, 0],
    'c_ur': [1, 0, 0, 1],
    'c_bl': [0, 1, 1, 0],
    'c_br': [0, 1, 0, 1],
    't_u': [1, 0, 1, 1],
    't_d': [0, 1, 1, 1],
    't_l': [1, 1, 1, 0],
    't_r': [1, 1, 0, 1],
    'd_u': [1, 0, 0, 0],
    'd_d': [0, 1, 0, 0],
    'd_l': [0, 0, 1, 0],
    'd_r': [0, 0, 0, 1],
  }

  for (name,edges) in variants.iteritems():
    seed = random.randint(0,1000)
    mapgen.main(size, scale, angle, edges, name, seed)
