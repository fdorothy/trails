class TileLayer(object):
  def __init__(self):
    self.data = []
    self.width = 0
    self.height = 0
    self.visible = True
    self.x = 0
    self.y = 0
    self.name = "layer"
    self.opacity = 1.0
    self.mytype = "tilelayer"
    self.properties = {}
    self.propertytypes = {}

  def to_json(self):
    return {
      "data": self.data,
      "width": self.width,
      "height": self.height,
      "visible": self.visible,
      "x": self.x,
      "y": self.y,
      "name": self.name,
      "opacity": self.opacity,
      "type": self.mytype,
      "properties": self.properties,
      "propertytypes": self.propertytypes
    }

class Object(object):
  def __init__(self):
    self.width = 32
    self.height = 32
    self.myid = 1
    self.name = "object"
    self.rotation = 0
    self.mytype = "obj"
    self.visible = True
    self.x = 0
    self.y = 0
    self.properties = {}
    self.propertytypes = {}

  def to_json(self):
    return {
      "width": self.width,
      "height": self.height,
      "id": self.myid,
      "name": self.name,
      "rotation": self.rotation,
      "type": self.mytype,
      "visible": self.visible,
      "x": self.x,
      "y": self.y,
      "properties": self.properties,
      "propertytypes": self.propertytypes
    }

class ObjectGroup(object):
  def __init__(self):
    self.name = "objectlayer"
    self.opacity = 1.0
    self.mytype = "objectgroup"
    self.properties = {}
    self.propertytypes = {}
    self.x = 0
    self.y = 0
    self.draworder = "topdown"
    self.objects = []
    self.visible = True

  def to_json(self):
    return {
      "objects": [o.to_json() for o in self.objects],
      "draworder": self.draworder,
      "visible": self.visible,
      "x": self.x,
      "y": self.y,
      "name": self.name,
      "opacity": self.opacity,
      "type": self.mytype,
      "properties": self.properties,
      "propertytypes": self.propertytypes
    }

class Tileset(object):
  def __init__(self):
    self.columns = 8
    self.firstgid = 1
    self.image = "tiles.png"
    self.imageheight = 192
    self.imagewidth = 256
    self.margin = 0
    self.name = "tiles"
    self.spacing = 0
    self.tilecount = 48
    self.tileheight = 32
    self.tiles = {}
    self.tilewidth = 32

  def to_json(self):
    return {
      "columns": self.columns,
      "firstgid": self.firstgid,
      "image": self.image,
      "imageheight": self.imageheight,
      "imagewidth": self.imagewidth,
      "margin": self.margin,
      "name": self.name,
      "spacing": self.spacing,
      "tilecount": self.tilecount,
      "tileheight": self.tileheight,
      "tileheight": self.tileheight,
      "tilewidth": self.tilewidth,
      "tiles": self.tiles
    }

class Tiled(object):
  def __init__(self):
    self.tileheight = 32
    self.tilewidth = 32
    self.tilesets = []
    self.width = 128
    self.height = 128
    self.version = 1
    self.layers = []
    self.nextobjectid = 1
    self.mytype = "map"
    self.orientation = "orthogonal"
    self.properties = {}
    self.propertytypes = {}
    self.renderorder = "right-down"
    self.tiledversion  = "1.0.1"

  def to_json(self):
    return {
      "height": self.height,
      "width": self.width,
      "tileheight": self.tileheight,
      "tilewidth": self.tilewidth,
      "tilesets": [t.to_json() for t in self.tilesets],
      "layers": [l.to_json() for l in self.layers],
      "nextobjectid": self.nextobjectid,
      "version": self.version,
      "type": self.mytype,
      "orientation": self.orientation,
      "properties": self.properties,
      "propertytypes": self.propertytypes,
      "renderorder": self.renderorder,
      "tiledversion": self.tiledversion
    }

if __name__ == '__main__':
  import json

  # make a sample Tiled json file
  t = Tiled()
  ts = Tileset()
  t.tilesets += [ts]

  tl = TileLayer()
  tl.width = 128
  tl.height = 128
  tl.data = [1]*(128*128)
  t.layers += [tl]
  data = t.to_json()
  print json.dumps(data, sort_keys=True, indent=2)
