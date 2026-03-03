from PIL import Image
import numpy as np

img = Image.fromarray(np.zeros((100,100,3),dtype=np.uint8))
img.save(r'c:\Users\saran\Desktop\sentinal-ai\backend\test_unknown.jpg')
print('created test_unknown.jpg')
