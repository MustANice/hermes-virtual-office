from PIL import Image

im2 = Image.open('/root/.hermes/profiles/orion/cache/images/img_a737683fa9e2.jpg')
# Executive suite is in top-left
crop_exec = im2.crop((120, 90, 480, 360))
crop_exec.save('/root/projects/hermes-virtual-office/crop_exec.jpg')

im1 = Image.open('/root/.hermes/profiles/orion/cache/images/img_2a7ab1f0a353.jpg')
print("crop_exec saved!")
