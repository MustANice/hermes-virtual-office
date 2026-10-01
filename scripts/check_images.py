from PIL import Image

im1 = Image.open('/root/.hermes/profiles/orion/cache/images/img_2a7ab1f0a353.jpg')
im2 = Image.open('/root/.hermes/profiles/orion/cache/images/img_a737683fa9e2.jpg')

print("im1 size:", im1.size)
print("im2 size:", im2.size)
