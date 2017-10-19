from PIL import Image
from PIL import ImageDraw

def bounds2d(i, j, w, h, s):
  x0 = (i%w)*s
  y0 = j*s
  return [x0,y0,x0+s,y0+s]

def bounds1d(i, w, h, s):
  x0 = (i%w)*s
  y0 = (i/w)*s
  return [x0,y0,x0+s,y0+s]

if __name__ == '__main__':
  w = 20
  h = 20
  s = 32
  img = Image.new('RGBA', (w*s, h*s), (0,0,0,0))
  pixels = img.load()

  # fill first 5 boxes with gradients
  colors = [
    (0, 0, 80, 255),
    (100, 100, 0, 255),
    (100, 120, 100, 255),
    (150, 170, 150, 255),
    (150, 200, 150, 255),
    (200, 220, 200, 255),
    (220, 220, 220, 255),
    (255, 255, 255, 255)
  ]
  draw = ImageDraw.Draw(img)
  for i in range(len(colors)):
    draw.rectangle(bounds1d(i, w, h, s), colors[i])

  # 9-tile for cliffs
  minb = bounds2d(0,1,w,h,s)
  maxb = bounds2d(2,3,w,h,s)
  pad = [s/2,s/2,s/2,s/2]
  box = [minb[0]+pad[0], minb[1]+pad[1],
         maxb[2]-pad[2], maxb[3]-pad[3]]
  draw.line((box[0],box[1],box[2],box[1]), fill=(128,128,128,255))
  draw.line((box[2],box[1],box[2],box[3]), fill=(128,128,128,255))
  draw.line((box[0],box[3],box[2],box[3]), fill=(128,128,128,255))
  draw.line((box[0],box[1],box[0],box[3]), fill=(128,128,128,255))

  img.save("tiles.png", "PNG")
