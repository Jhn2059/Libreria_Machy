const Scanner = {
  isScanning: false,
  target: null,
  _detectedHandler: null, // ✅ FIX: guardar referencia del handler

  start(target) {
    if (this.isScanning) this.stop();
    this.target = target;

    const wrap = document.getElementById('scanner-' + target + '-wrap');
    const ph   = document.getElementById('scan-ph-' + target);
    const vp   = document.getElementById('scan-vp-' + target);

    if (!wrap || !ph || !vp) { Utils.toast('Contenedor del scanner no encontrado', 'err'); return; }

    ph.style.display = 'none';
    vp.style.display = 'flex';
    this.isScanning  = true;

    const startBtn = document.getElementById('btn-s' + target[0] + '-start');
    const stopBtn  = document.getElementById('btn-s' + target[0] + '-stop');
    if (startBtn) startBtn.style.display = 'none';
    if (stopBtn)  stopBtn.style.display  = '';

    // ✅ FIX: delay para que el DOM esté pintado antes de adjuntar video
    setTimeout(() => {
      Quagga.init({
        inputStream: {
          name: 'Live', type: 'LiveStream', target: wrap,
          constraints: {
            facingMode: { ideal: 'environment' }, // ✅ FIX: { ideal } en vez de string
            width:  { min: 640, ideal: 1280 },
            height: { min: 480, ideal: 720 }
          }
        },
        decoder: {
          readers: ['ean_reader','ean_8_reader','code_128_reader','code_39_reader','upc_reader','upc_e_reader']
        },
        locate: true,
        numOfWorkers: navigator.hardwareConcurrency || 2,
        frequency: 10
      }, (err) => {
        if (err) {
          console.error('Quagga init error:', err);
          const msg = (err.name === 'NotAllowedError' || (err.message||'').includes('Permission'))
            ? '🚫 Permiso de cámara denegado. Habilítalo en ajustes del navegador.'
            : '📷 No se pudo acceder a la cámara: ' + (err.message || err);
          Utils.toast(msg, 'err');
          this.stop();
          return;
        }

        // ✅ FIX PRINCIPAL: onDetected va DENTRO del callback de init, no afuera
        if (this._detectedHandler) Quagga.offDetected(this._detectedHandler);

        this._detectedHandler = (result) => {
          const code = result.codeResult && result.codeResult.code;
          if (!code) return;

          // ✅ FIX: umbral de confianza — descartar lecturas dudosas
          const errors = (result.codeResult.decodedCodes || [])
            .filter(c => c.error !== undefined).map(c => c.error);
          if (errors.length > 0) {
            const avg = errors.reduce((a, b) => a + b, 0) / errors.length;
            if (avg > 0.25) return;
          }

          // ✅ FIX: guardar target ANTES de stop() porque stop() lo pone a null
          const currentTarget = this.target;
          this.stop();
          this.handleCode(code, currentTarget);
        };

        Quagga.onDetected(this._detectedHandler);
        Quagga.start();
      });
    }, 200);
  },

  stop() {
    if (!this.isScanning) return;
    try {
      if (this._detectedHandler) {
        Quagga.offDetected(this._detectedHandler); // ✅ FIX: quitar handler específico
        this._detectedHandler = null;
      }
      Quagga.stop();
    } catch (e) {}
    this.isScanning = false;
    const prev = this.target;
    this.target = null;
    if (prev === 'venta') this.restoreUI('venta');
    else if (prev === 'reg') this.restoreUI('reg');
  },

  restoreUI(target) {
    const ph = document.getElementById('scan-ph-' + target);
    const vp = document.getElementById('scan-vp-' + target);
    if (ph) ph.style.display = 'flex';
    if (vp) vp.style.display = 'none';
    const startBtn = document.getElementById('btn-s' + target[0] + '-start');
    const stopBtn  = document.getElementById('btn-s' + target[0] + '-stop');
    if (startBtn) startBtn.style.display = '';
    if (stopBtn)  stopBtn.style.display  = 'none';
    const wrap = document.getElementById('scanner-' + target + '-wrap');
    if (wrap) wrap.querySelectorAll('video, canvas').forEach(el => el.remove()); // ✅ FIX
  },

  // ✅ FIX: recibe target como parámetro (this.target ya está null al llamar stop())
  handleCode(code, target) {
    if (!code) return;
    if (target === 'venta') {
      const resultBar = document.getElementById('scan-result-venta');
      if (resultBar) { resultBar.style.display = 'block'; resultBar.textContent = '✅ Código: ' + code; }
      Ventas.searchProduct(code);
    } else if (target === 'reg') {
      Inventario.setRegCode(code);
    }
  }
};

window.Scanner = Scanner;
