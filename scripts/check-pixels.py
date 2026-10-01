from PIL import Image
im = Image.open('/root/projects/hermes-virtual-office/current-live.png')
print('Dimensions:', im.size)
print('Top left pixel (100, 100):', im.getpixel((100, 100)))
print('Center pixel (720, 450):', im.getpixel((720, 450)))
print('Void area pixel (100, 450):', im.getpixel((100, 450)))
print('Near bottom pixel (720, 800):', im.getpixel((720, 800)))
