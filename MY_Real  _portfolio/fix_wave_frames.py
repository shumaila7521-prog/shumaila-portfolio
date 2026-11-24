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
    print("Starting clean wave frames generation...")

    wave_file = 'WAVE.MP4 - Copy.mp4'
    reader = iio.get_reader(wave_file)
    raw_frames = []
    # Read frames 24 to 95 (clean standing wave sequence)
    for idx, f in enumerate(reader):
        if 24 <= idx <= 95:
            # resize to 1920x1080
            im = Image.fromarray(f).resize((1920, 1080), Image.Resampling.LANCZOS)
            # Center crop 640 horizontal
            arr = np.array(im)
            crop = arr[:, 960-320:960+320]
            raw_frames.append(crop)
    reader.close()

    total = len(raw_frames)
    print(f"Loaded {total} clean wave frames (indices 24 to 95).")

    num_workers = 4
    sessions = [rembg.new_session('u2net_human_seg') for _ in range(num_workers)]

    os.makedirs('public/frames/hd', exist_ok=True)
    os.makedirs('public/frames/sd', exist_ok=True)

    def process_frame(task):
        idx, worker_id = task
        crop_rgb = raw_frames[idx]
        session = sessions[worker_id % num_workers]

        img_pil = Image.fromarray(crop_rgb)
        mask = rembg.remove(img_pil, session=session, only_mask=True)
        mask_np = np.array(mask).astype(np.float32) / 255.0

        # Clean threshold with soft blur (NO destructive minimum_filter!)
        alpha = np.clip((mask_np - 0.02) / 0.96, 0.0, 1.0)
        alpha_img = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius=0.8))

        rgba_hd = Image.merge('RGBA', (*img_pil.split(), alpha_img))
        rgba_hd.save(f"public/frames/hd/wave_{idx:03d}.webp", "WEBP", quality=90, method=4)

        # SD version (384x648)
        rgba_sd = rgba_hd.resize((384, 648), Image.Resampling.LANCZOS)
        rgba_sd.save(f"public/frames/sd/wave_{idx:03d}.webp", "WEBP", quality=88, method=4)

        if idx % 10 == 0 or idx == total - 1:
            print(f"Processed wave frame {idx}/{total}")

    print("Extracting with u2net_human_seg in parallel...")
    with ThreadPoolExecutor(max_workers=num_workers) as executor:
        list(executor.map(process_frame, [(i, i) for i in range(total)]))

    # Also fill remaining indices up to 96 if any so nothing breaks
    for i in range(total, 96):
        # copy wave_071 to wave_i
        src_hd = Image.open(f"public/frames/hd/wave_{total-1:03d}.webp")
        src_hd.save(f"public/frames/hd/wave_{i:03d}.webp", "WEBP", quality=90)
        src_sd = Image.open(f"public/frames/sd/wave_{total-1:03d}.webp")
        src_sd.save(f"public/frames/sd/wave_{i:03d}.webp", "WEBP", quality=88)

    elapsed = time.time() - start_time
    print(f"Completed clean wave frames in {elapsed:.2f} seconds!")

if __name__ == '__main__':
    main()
