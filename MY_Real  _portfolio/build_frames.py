import os
os.environ['U2NET_HOME'] = os.path.abspath('.rembg')
import glob
import json
import math
import time
from concurrent.futures import ThreadPoolExecutor
import numpy as np
from PIL import Image, ImageFilter
import rembg
import imageio.v2 as iio
import scipy.ndimage

def get_video_file(patterns):
    for p in patterns:
        matches = glob.glob(p)
        if matches:
            return matches[0]
    return None

def extract_frames_from_video(video_path, target_size=(1920, 1080)):
    print(f"Reading video: {video_path}")
    reader = iio.get_reader(video_path)
    frames = []
    for f in reader:
        im = Image.fromarray(f)
        if im.size != target_size:
            im = im.resize(target_size, Image.Resampling.LANCZOS)
        frames.append(np.array(im))
    reader.close()
    print(f"Extracted {len(frames)} frames at {target_size}")
    return frames

def get_bg_color(frame):
    h, w, _ = frame.shape
    corners = [
        frame[0:30, 0:30],
        frame[0:30, w-30:w],
        frame[h-30:h, 0:30],
        frame[h-30:h, w-30:w]
    ]
    bg = np.mean([np.mean(c, axis=(0, 1)) for c in corners], axis=0)
    return bg

def rgb_to_hex(rgb):
    return '#{:02x}{:02x}{:02x}'.format(int(round(rgb[0])), int(round(rgb[1])), int(round(rgb[2])))

def find_torso_cx(frame, bg):
    diff = np.max(np.abs(frame.astype(np.float32) - bg), axis=-1)
    torso_region = (diff > 18)[380:700, :]
    xs = np.where(torso_region)[1]
    if len(xs) > 0:
        return float(np.mean(xs))
    return 1920.0 / 2.0

def process_cropped_cutout(crop_rgb, session, bg, is_wave_or_rot=False):
    # crop_rgb is 640x1080
    img_pil = Image.fromarray(crop_rgb)
    raw_mask = rembg.remove(img_pil, session=session, only_mask=True)
    mask_np = np.array(raw_mask).astype(np.float32) / 255.0

    # 1. alpha = clip((mask-0.08)/0.84)
    alpha = np.clip((mask_np - 0.08) / 0.84, 0.0, 1.0)

    # 2. MinFilter 9 and GaussianBlur 1.1
    alpha = scipy.ndimage.minimum_filter(alpha, size=9)
    alpha_img = Image.fromarray((alpha * 255.0).astype(np.uint8))
    alpha_img = alpha_img.filter(ImageFilter.GaussianBlur(radius=1.1))
    alpha = np.array(alpha_img).astype(np.float32) / 255.0

    # 3. For wave and rot remove pixels within 20 of background colour between y 520 and 1000
    if is_wave_or_rot:
        y_slice = slice(520, 1000)
        color_diff = np.max(np.abs(crop_rgb[y_slice, :, :3].astype(np.float32) - bg), axis=-1)
        leg_gap = color_diff <= 20.0
        alpha[y_slice, :][leg_gap] = 0.0

    # 4. Un-mix background colour: C = (I - (1 - a) * bg) / a
    I = crop_rgb.astype(np.float32)
    bg_3d = bg.reshape(1, 1, 3).astype(np.float32)
    a_3d = np.expand_dims(alpha, axis=-1)
    
    safe_a = np.maximum(a_3d, 1e-4)
    C = (I - (1.0 - a_3d) * bg_3d) / safe_a
    C = np.clip(C, 0.0, 255.0)

    zero_mask = (a_3d < 0.01)
    C[zero_mask.repeat(3, axis=-1)] = 0.0
    
    # 5. UnsharpMask radius 1.4 percent 70 on RGB
    c_img = Image.fromarray(C.astype(np.uint8), mode='RGB')
    c_sharp = c_img.filter(ImageFilter.UnsharpMask(radius=1.4, percent=70))

    rgba_img = Image.merge('RGBA', (*c_sharp.split(), Image.fromarray((alpha * 255.0).astype(np.uint8))))
    return rgba_img, alpha

def main():
    os.makedirs('public/frames/hd', exist_ok=True)
    os.makedirs('public/frames/sd', exist_ok=True)
    os.makedirs('src/lib', exist_ok=True)

    wave_file = get_video_file(['*WAVE*.mp4', '*wave*.mp4'])
    run_file = get_video_file(['*RUN_RIGHT*.mp4', '*run_right*.mp4'])
    rot_file = get_video_file(['*TURN_360*.mp4', '*turn_360*.mp4', '*360*.mp4'])

    print(f"Inputs:\n  Wave: {wave_file}\n  Run: {run_file}\n  360: {rot_file}")

    wave_frames = extract_frames_from_video(wave_file)
    run_frames = extract_frames_from_video(run_file)
    rot_frames = extract_frames_from_video(rot_file)

    bg = get_bg_color(wave_frames[0])
    bg_hex = rgb_to_hex(bg)
    print(f"Detected BG Color: {bg_hex} {bg}")

    # Process rotc_NNN (About section uncut, 800x1080, quality 90)
    print("\n--- Processing rotc_NNN frames ---")
    N_rotc = len(rot_frames)
    for idx, f in enumerate(rot_frames):
        cx = find_torso_cx(f, bg)
        x1 = max(0, min(1920 - 800, int(round(cx - 400))))
        x2 = x1 + 800
        cropped = Image.fromarray(f[:, x1:x2])
        cropped.save(f"public/frames/hd/rotc_{idx:03d}.webp", "WEBP", quality=90)
        sd_crop = cropped.resize((480, 648), Image.Resampling.LANCZOS)
        sd_crop.save(f"public/frames/sd/rotc_{idx:03d}.webp", "WEBP", quality=90)

    # Initialize rembg sessions for worker threads
    num_workers = 4
    sessions = [rembg.new_session('u2net_human_seg') for _ in range(num_workers)]

    # Pre-crop all frames to 640x1080 centered at torso
    def crop_640(frame):
        cx = find_torso_cx(frame, bg)
        x1 = max(0, min(1920 - 640, int(round(cx - 320))))
        x2 = x1 + 640
        return frame[:, x1:x2]

    wave_crops = [crop_640(f) for f in wave_frames]
    rot_crops = [crop_640(f) for f in rot_frames]
    run_crops = [crop_640(f) for f in run_frames]

    # Process wave cutouts
    print("\n--- Processing wave_NNN cutouts ---")
    N_wave = len(wave_crops)
    wave_results = [None] * N_wave

    def worker_wave(task):
        idx, thread_id = task
        session = sessions[thread_id % num_workers]
        rgba, alpha = process_cropped_cutout(wave_crops[idx], session, bg, is_wave_or_rot=True)
        rgba.save(f"public/frames/hd/wave_{idx:03d}.webp", "WEBP", quality=88, method=4)
        sd_crop = rgba.resize((384, 648), Image.Resampling.LANCZOS)
        sd_crop.save(f"public/frames/sd/wave_{idx:03d}.webp", "WEBP", quality=88, method=4)
        wave_results[idx] = (rgba, alpha)
        if idx % 20 == 0 or idx == N_wave - 1:
            print(f"Wave frame {idx}/{N_wave} done")

    with ThreadPoolExecutor(max_workers=num_workers) as ex:
        list(ex.map(worker_wave, [(i, i) for i in range(N_wave)]))

    # Measure standing height in wave_000
    _, wave_alpha0 = wave_results[0]
    ys = np.where(wave_alpha0 > 0.1)[0]
    wave_head_y = float(ys.min()) if len(ys) > 0 else 100
    wave_feet_y = float(ys.max()) if len(ys) > 0 else 1000
    h_wave = wave_feet_y - wave_head_y
    print(f"Wave frame 0: head_y={wave_head_y}, feet_y={wave_feet_y}, height={h_wave}")

    # Process rot cutouts
    print("\n--- Processing rot_NNN cutouts ---")
    N_rot = len(rot_crops)
    rot_results = [None] * N_rot

    def worker_rot(task):
        idx, thread_id = task
        session = sessions[thread_id % num_workers]
        rgba, alpha = process_cropped_cutout(rot_crops[idx], session, bg, is_wave_or_rot=True)
        rgba.save(f"public/frames/hd/rot_{idx:03d}.webp", "WEBP", quality=88, method=4)
        sd_crop = rgba.resize((384, 648), Image.Resampling.LANCZOS)
        sd_crop.save(f"public/frames/sd/rot_{idx:03d}.webp", "WEBP", quality=88, method=4)
        rot_results[idx] = (rgba, alpha)
        if idx % 20 == 0 or idx == N_rot - 1:
            print(f"Rot frame {idx}/{N_rot} done")

    with ThreadPoolExecutor(max_workers=num_workers) as ex:
        list(ex.map(worker_rot, [(i, i) for i in range(N_rot)]))

    # Process run frame 0 first to find standing height & scale
    session0 = sessions[0]
    rgba_run0, alpha_run0 = process_cropped_cutout(run_crops[0], session0, bg, is_wave_or_rot=False)
    ys0 = np.where(alpha_run0 > 0.1)[0]
    run_head_y = float(ys0.min()) if len(ys0) > 0 else 100
    run_feet_y = float(ys0.max()) if len(ys0) > 0 else 1000
    h_run = run_feet_y - run_head_y
    scale_feet = (h_wave / h_run) if h_run > 0 else 1.0
    print(f"Run standing height: {h_run}, Wave standing height: {h_wave}, Scale factor: {scale_feet:.4f}")

    # Process run cutouts
    print("\n--- Processing run_NNN cutouts ---")
    N_run = len(run_crops)
    run_results = [None] * N_run

    def worker_run(task):
        idx, thread_id = task
        session = sessions[thread_id % num_workers]
        rgba, alpha = process_cropped_cutout(run_crops[idx], session, bg, is_wave_or_rot=False)

        # Scale about feet so standing height matches wave video
        if abs(scale_feet - 1.0) > 0.005:
            new_w = int(round(640 * scale_feet))
            new_h = int(round(1080 * scale_feet))
            res = rgba.resize((new_w, new_h), Image.Resampling.LANCZOS)
            canvas = Image.new('RGBA', (640, 1080), (0, 0, 0, 0))
            paste_x = int(round((640 - new_w) / 2.0))
            paste_y = int(round(run_feet_y - (run_feet_y * scale_feet)))
            canvas.paste(res, (paste_x, paste_y), res)
            rgba = canvas

        rgba.save(f"public/frames/hd/run_{idx:03d}.webp", "WEBP", quality=88, method=4)
        sd_crop = rgba.resize((384, 648), Image.Resampling.LANCZOS)
        sd_crop.save(f"public/frames/sd/run_{idx:03d}.webp", "WEBP", quality=88, method=4)
        run_results[idx] = (rgba, alpha)
        if idx % 30 == 0 or idx == N_run - 1:
            print(f"Run frame {idx}/{N_run} done")

    with ThreadPoolExecutor(max_workers=num_workers) as ex:
        list(ex.map(worker_run, [(i, i) for i in range(N_run)]))

    # Sequence Analysis
    print("\n--- Sequence Analysis ---")
    run_rgba_list = [r[0] for r in run_results]
    f0_arr = np.array(run_rgba_list[0]).astype(np.float32)

    # 1. Run start (first frame that differs from frame 0)
    startFrom = 1
    for i in range(1, N_run):
        diff = np.mean(np.abs(np.array(run_rgba_list[i]).astype(np.float32) - f0_arr))
        if diff > 5.0:
            startFrom = i
            break
    print(f"Run startFrom (differs from frame 0): {startFrom}")

    # 2. Seamless loop: pair a,b with 12 <= b - a <= 36 that look most alike
    best_diff = float('inf')
    best_a, best_b = startFrom + 8, startFrom + 28
    for a in range(startFrom + 4, N_run - 14):
        a_arr = np.array(run_rgba_list[a]).astype(np.float32)
        for b in range(a + 12, min(a + 37, N_run)):
            b_arr = np.array(run_rgba_list[b]).astype(np.float32)
            d = np.mean(np.abs(b_arr - a_arr))
            if d < best_diff:
                best_diff = d
                best_a, best_b = a, b
    
    loopFrom = best_a
    loopLen = best_b - best_a
    print(f"Seamless loop: loopFrom={loopFrom}, loopLen={loopLen} (diff={best_diff:.2f})")

    # 3. Where start blends into loop
    loop_f0 = np.array(run_rgba_list[loopFrom]).astype(np.float32)
    min_blend_diff = float('inf')
    startTo = loopFrom
    for k in range(startFrom, loopFrom + 1):
        d = np.mean(np.abs(np.array(run_rgba_list[k]).astype(np.float32) - loop_f0))
        if d < min_blend_diff:
            min_blend_diff = d
            startTo = k
    loopEntry = 0
    print(f"Start blend: startTo={startTo}, loopEntry={loopEntry}")

    # 4. Side profile frames of 360 (narrowest torso in each half)
    half = N_rot // 2
    rot_torso_widths = []
    for idx in range(N_rot):
        alpha = rot_results[idx][1]
        torso_mask = (alpha[380:700, :] > 0.1)
        xs = np.where(torso_mask)[1]
        width = (xs.max() - xs.min()) if len(xs) > 0 else 999
        rot_torso_widths.append(width)

    idx1 = int(np.argmin(rot_torso_widths[:half]))
    idx2 = half + int(np.argmin(rot_torso_widths[half:]))
    print(f"Narrowest torso frames: {idx1} (w={rot_torso_widths[idx1]}), {idx2} (w={rot_torso_widths[idx2]})")

    # Decide which faces right by comparing with right-facing run frame
    run_right_ref = np.array(run_rgba_list[loopFrom]).astype(np.float32)
    rot_c1 = np.array(rot_results[idx1][0]).astype(np.float32)
    rot_c2 = np.array(rot_results[idx2][0]).astype(np.float32)

    d1 = np.mean(np.abs(rot_c1 - run_right_ref))
    d2 = np.mean(np.abs(rot_c2 - run_right_ref))

    if d1 < d2:
        right_idx = idx1
        left_idx = idx2
    else:
        right_idx = idx2
        left_idx = idx1
    print(f"Decided: right={right_idx}, left={left_idx}")

    # Write frames.js
    frames_js_content = f"""// Auto-generated by build_frames.py
export const SEQ = {{
  run: {N_run},
  wave: {N_wave},
  rot: {N_rot},
  rotc: {N_rotc}
}};

export const RUN = {{
  stand: 0,
  startFrom: {startFrom},
  startTo: {startTo},
  loopFrom: {loopFrom},
  loopLen: {loopLen},
  loopEntry: {loopEntry}
}};

export const ROT = {{
  front: 0,
  end: {N_rot - 1},
  left: {left_idx},
  right: {right_idx}
}};

export const BG = "{bg_hex}";
"""
    with open('src/lib/frames.js', 'w', encoding='utf-8') as f:
        f.write(frames_js_content)
    print("\nSuccessfully wrote src/lib/frames.js!")

if __name__ == '__main__':
    main()
