import subprocess
import time
import urllib.request
import os

CHROME = r'C:\Program Files\Google\Chrome\Application\chrome.exe'

def wait_for_url(url, timeout=15):
    start = time.time()
    while time.time() - start < timeout:
        try:
            with urllib.request.urlopen(url) as response:
                if response.status == 200:
                    return True
        except Exception:
            time.sleep(0.5)
    return False

def take_shot(url, output, width, height, scroll_y=0, delay=3):
    os.makedirs('screenshots', exist_ok=True)
    # Using chrome headless with virtual time budget to allow animation/preloader
    cmd = [
        CHROME,
        '--headless=new',
        f'--window-size={width},{height}',
        '--hide-scrollbars',
        '--disable-gpu',
        f'--virtual-time-budget={delay * 1000}',
        f'--screenshot={output}',
        url
    ]
    subprocess.run(cmd, check=True)
    print(f"Captured {output} at {width}x{height}")

def main():
    # Start preview server on 4173
    server = subprocess.Popen(['npx', 'vite', 'preview', '--port', '4173', '--host', '127.0.0.1'], shell=True)
    try:
        time.sleep(3)
        print("Capturing screenshots via headless Chrome...")
        # 1. Desktop 1440x900
        take_shot('http://127.0.0.1:4173', 'screenshots/desktop_1440x900.png', 1440, 900, delay=5)
        # 2. Mobile 390x844
        take_shot('http://127.0.0.1:4173', 'screenshots/mobile_390x844.png', 390, 844, delay=5)
    except Exception as e:
        print("Error:", e)
    finally:
        subprocess.run(['taskkill', '/F', '/T', '/PID', str(server.pid)], capture_output=True)

if __name__ == '__main__':
    main()
