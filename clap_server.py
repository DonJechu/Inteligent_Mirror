from flask import Flask, jsonify
from flask_cors import CORS
import pyaudio
import numpy as np
import time
from scipy.signal import butter, lfilter
import threading

app = Flask(__name__)
CORS(app)  # Permitir requests desde React

# ============
# CONFIGURACIÓN
# ============
RATE = 44100
CHUNK = 2048
THRESHOLD = 9000
LOWCUT = 1600
HIGHCUT = 2300
DOUBLE_CLAP_WINDOW = 0.45

# ===================
# FILTRO DE FRECUENCIA
# ===================
def bandpass_filter(data, lowcut, highcut, fs):
    b, a = butter(2, [lowcut/(fs/2), highcut/(fs/2)], btype='band')
    return lfilter(b, a, data)

# ================
# DETECTOR DE CLAPS
# ================
class ClapDetector:
    def __init__(self, device_index=-1):
        self.p = pyaudio.PyAudio()
        if device_index == -1:
            self.device = self.p.get_default_input_device_info()['index']
        else:
            self.device = device_index
        self.stream = None
        self.last_clap_time = 0
        self.double_clap_detected = False
        self.running = False

    def start(self):
        self.stream = self.p.open(format=pyaudio.paInt16,
                                  channels=1,
                                  rate=RATE,
                                  input=True,
                                  input_device_index=self.device,
                                  frames_per_buffer=CHUNK)
        self.running = True

    def stop(self):
        self.running = False
        if self.stream:
            self.stream.stop_stream()
            self.stream.close()
        self.p.terminate()

    def detect_clap(self):
        data = np.frombuffer(self.stream.read(CHUNK, exception_on_overflow=False), dtype=np.int16)
        filtered = bandpass_filter(data, LOWCUT, HIGHCUT, RATE)
        peak = np.max(np.abs(filtered))
        return peak > THRESHOLD

    def detect_double_clap(self):
        now = time.time()
        if self.detect_clap():
            if now - self.last_clap_time <= DOUBLE_CLAP_WINDOW:
                self.last_clap_time = 0
                return True
            self.last_clap_time = now
        return False

    def run_detection_loop(self):
        while self.running:
            if self.detect_double_clap():
                self.double_clap_detected = True
                print("🎉 Double clap detected!")
            time.sleep(1/120)

# Instancia global del detector
detector = None
detection_thread = None

@app.route('/start', methods=['GET'])
def start_detection():
    global detector, detection_thread
    if detector is None:
        detector = ClapDetector(device_index=-1)
        detector.start()
        detection_thread = threading.Thread(target=detector.run_detection_loop, daemon=True)
        detection_thread.start()
        return jsonify({"status": "started"})
    return jsonify({"status": "already_running"})

@app.route('/check', methods=['GET'])
def check_clap():
    global detector
    if detector and detector.double_clap_detected:
        detector.double_clap_detected = False
        return jsonify({"clap_detected": True})
    return jsonify({"clap_detected": False})

@app.route('/stop', methods=['GET'])
def stop_detection():
    global detector
    if detector:
        detector.stop()
        detector = None
        return jsonify({"status": "stopped"})
    return jsonify({"status": "not_running"})

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=False)