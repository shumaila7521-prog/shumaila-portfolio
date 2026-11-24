import os
os.environ['U2NET_HOME'] = os.path.abspath('.rembg')
import imageio.v2 as iio
import numpy as np
from PIL import Image, ImageFilter
import rembg
from concurrent.futures import ThreadPoolExecutor
import time

def main():
    start_time = time.time()
    video_path = r'C:\Users\shumaila\.gemini\antigravity\brain\187e8f94-c3fe-4ae4-92b3-1975307b97c5\.user_uploaded\media_1794331254722_dd60fd49.mp4'
    print(f"Reading exact WAVE video: {video_path}")

    reader = iio.get_reader(video_path)
    raw_crops = []
    # Extract frames 20 to 95 (the complete, steady, full-body waving sequence)
    for idx, f in enumerate(reader):
        if 20 <= idx <= 95:
            im = Image.fromarray(f).resize((1920, 1080), Image.Resampling.LANCZOS)
            arr = np.array(im)
            crop = arr[:, 960-320:960+320] # 640x1080
            raw_crops.append(crop)
    reader.close()

    total = len(raw_crops)
    print(f"Extracted {total} frames for clean waving animation.")

    num_workers = 4
    sessions = [rembg.new_session('u2net_human_seg') for _ in range(num_workers)]

    os.makedirs('public/frames/hd', exist_ok=True)
    os.makedirs('public/frames/sd', exist_ok=True)

    def process_one(task):
        idx, worker_id = task
        crop_rgb = raw_crops[idx]
        session = sessions[worker_id % num_workers]

        img_pil = Image.fromarray(crop_rgb)
        mask = rembg.remove(img_pil, session=session, only_mask=True)
        mask_np = np.array(mask).astype(np.float32) / 255.0

        # Clean non-destructive threshold with soft edge smoothing
        alpha = np.clip((mask_np - 0.02) / 0.96, 0.0, 1.0)
        alpha_img = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius=0.75))

        rgba_hd = Image.merge('RGBA', (*img_pil.split(), alpha_img))
        rgba_hd.save(f"public/frames/hd/wave_{idx:03d}.webp", "WEBP", quality=92, method=4)

        # SD version (384x648)
        rgba_sd = rgba_hd.resize((384, 648), Image.Resampling.LANCZOS)
        rgba_sd.save(f"public/frames/sd/wave_{idx:03d}.webp", "WEBP", quality=90, method=4)

        if idx % 15 == 0 or idx == total - 1:
            print(f"Frame {idx+1}/{total} processed successfully.")

    with ThreadPoolExecutor(max_workers=num_workers) as executor:
        list(executor.map(process_one, [(i, i) for i in range(total)]))

    # Pad remaining indices up to 96
    for i in range(total, 96):
        src_hd = Image.open(f"public/frames/hd/wave_{total-1:03d}.webp")
        src_hd.save(f"public/frames/hd/wave_{i:03d}.webp", "WEBP", quality=92)
        src_sd = Image.open(f"public/frames/sd/wave_{total-1:03d}.webp")
        src_sd.save(f"public/frames/sd/wave_{i:03d}.webp", "WEBP", quality=90)

    elapsed = time.time() - start_time
    print(f"All {total} wave frames generated cleanly in {elapsed:.2f} seconds!")

if __name__ == '__main__':
    main()
