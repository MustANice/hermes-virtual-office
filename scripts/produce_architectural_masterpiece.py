import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

def create_architectural_masterpiece():
    # 1. Load source images
    img1_path = '/root/.hermes/profiles/orion/cache/images/img_2a7ab1f0a353.jpg' # Style Reference
    img2_path = '/root/.hermes/profiles/orion/cache/images/img_a737683fa9e2.jpg' # Target Image (7-room base composition)

    im1_bgr = cv2.imread(img1_path)
    im2_bgr = cv2.imread(img2_path)

    # 2. Color Transfer in LAB space (Reinhard method) to infuse IMAGE 1's warm, clean, premium palette into IMAGE 2
    im1_lab = cv2.cvtColor(im1_bgr, cv2.COLOR_BGR2LAB).astype(np.float32)
    im2_lab = cv2.cvtColor(im2_bgr, cv2.COLOR_BGR2LAB).astype(np.float32)

    # Calculate mean and standard deviation for each channel
    l1_mean, l1_std = im1_lab[:, :, 0].mean(), im1_lab[:, :, 0].std()
    a1_mean, a1_std = im1_lab[:, :, 1].mean(), im1_lab[:, :, 1].std()
    b1_mean, b1_std = im1_lab[:, :, 2].mean(), im1_lab[:, :, 2].std()

    l2_mean, l2_std = im2_lab[:, :, 0].mean(), im2_lab[:, :, 0].std()
    a2_mean, a2_std = im2_lab[:, :, 1].mean(), im2_lab[:, :, 1].std()
    b2_mean, b2_std = im2_lab[:, :, 2].mean(), im2_lab[:, :, 2].std()

    # Apply statistical color transfer (weighted so we retain structural contrast while adopting IMAGE 1's warm tones)
    alpha = 0.65 # Balance between target structure and reference warmth
    
    # Center and scale
    l_res = ((im2_lab[:, :, 0] - l2_mean) * (l1_std / max(l2_std, 1e-5))) * alpha + (im2_lab[:, :, 0] * (1 - alpha))
    # Normalize luminance slightly to keep bright, airy corporate feel
    l_res = l_res + (l1_mean - l2_mean) * 0.4
    
    a_res = ((im2_lab[:, :, 1] - a2_mean) * (a1_std / max(a2_std, 1e-5)) + a1_mean) * alpha + (im2_lab[:, :, 1] * (1 - alpha))
    b_res = ((im2_lab[:, :, 2] - b2_mean) * (b1_std / max(b2_std, 1e-5)) + b1_mean) * alpha + (im2_lab[:, :, 2] * (1 - alpha))

    # Clip to valid ranges
    l_res = np.clip(l_res, 0, 255)
    a_res = np.clip(a_res, 0, 255)
    b_res = np.clip(b_res, 0, 255)

    transferred_lab = np.dstack([l_res, a_res, b_res]).astype(np.uint8)
    transferred_bgr = cv2.cvtColor(transferred_lab, cv2.COLOR_LAB2BGR)

    # 3. Micro-contrast enhancement using CLAHE on luminance
    lab_enhanced = cv2.cvtColor(transferred_bgr, cv2.COLOR_BGR2LAB)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(16, 16))
    lab_enhanced[:, :, 0] = clahe.apply(lab_enhanced[:, :, 0])
    transferred_bgr = cv2.cvtColor(lab_enhanced, cv2.COLOR_LAB2BGR)

    # 4. Bilateral filtering for noise removal with sharp edge preservation
    filtered_bgr = cv2.bilateralFilter(transferred_bgr, d=7, sigmaColor=35, sigmaSpace=35)

    # 5. Unsharp masking for crisp architectural mullions, slats, and glass reflections
    gaussian = cv2.GaussianBlur(filtered_bgr, (0, 0), sigmaX=1.5)
    sharpened = cv2.addWeighted(filtered_bgr, 1.45, gaussian, -0.45, 0)

    # 6. Upscale to 2K (2560 x 1440) using Lanczos-4 interpolation for presentation-grade sharpness
    upscaled = cv2.resize(sharpened, (2560, 1440), interpolation=cv2.INTER_LANCZOS4)

    # Convert to RGB PIL Image for final photographic tone curve polishing
    upscaled_rgb = cv2.cvtColor(upscaled, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(upscaled_rgb)

    # Enhance color saturation subtly to bring out natural oak and cognac leather
    color_enhancer = ImageEnhance.Color(pil_img)
    pil_img = color_enhancer.enhance(1.12)

    # Enhance contrast subtly
    contrast_enhancer = ImageEnhance.Contrast(pil_img)
    pil_img = contrast_enhancer.enhance(1.08)

    # Enhance sharpness
    sharp_enhancer = ImageEnhance.Sharpness(pil_img)
    pil_img = sharp_enhancer.enhance(1.20)

    output_path = '/root/projects/hermes-virtual-office/final_architectural_redesign_master.png'
    pil_img.save(output_path, 'PNG', quality=95, optimize=True)
    print(f"Successfully created 2K Master Architectural Visualisation at {output_path}!")

if __name__ == '__main__':
    create_architectural_masterpiece()
