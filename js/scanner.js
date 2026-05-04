// ============================================
// Scanner Module
// ============================================
const Scanner = {
  isScanning: false,
  target: null,

  start(target) {
    if (this.isScanning) this.stop();
    this.target = target;
    this.isScanning = true;

    const wrap = document.getElementById('scanner-' + target + '-wrap');
    const ph = document.getElementById('scan-ph-' + target);
    const vp = document.getElementById('scan-vp-' + target);

    if (!wrap || !ph || !vp) { Utils.toast('Contenedor del scanner no encontrado', 'err'); return; }

    ph.style.display = 'none';
    vp.style.display = 'flex';

    const startBtn = document.getElementById('btn-s' + target[0] + '-start');
    const stopBtn = document.getElementById('btn-s' + target[0] + '-stop');
    if (startBtn) startBtn.style.display = 'none';
    if (stopBtn) stopBtn.style.display = '';

    Quagga.init({
      inputStream: { name: 'Live', type: 'LiveStream', target: wrap, constraints: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } },
      decoder: { readers: ['ean_reader', 'ean_8_reader', 'code_128_reader', 'code_39_reader', 'upc_reader', 'upc_e_reader', 'isbn_reader'] },
      locate: true
    }, (err) => {
      if (err) { Utils.toast('No se pudo acceder a la cámara.', 'err'); this.stop(); return; }
      Quagga.start();
    });

    Quagga.offDetected();
    Quagga.onDetected((result) => {
      const code = result.codeResult.code;
      if (!code) return;
      this.stop();
      this.handleCode(code);
    });
  },

  stop() {
    if (!this.isScanning) return;
    try { Quagga.stop(); } catch (e) {}
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
    const stopBtn = document.getElementById('btn-s' + target[0] + '-stop');
    if (startBtn) startBtn.style.display = '';
    if (stopBtn) stopBtn.style.display = 'none';
    const wrap = document.getElementById('scanner-' + target + '-wrap');
    if (wrap) { ['video', 'canvas'].forEach(tag => { const el = wrap.querySelector(tag); if (el) el.remove(); }); }
  },

  handleCode(code) {
    if (!code) return;
    if (this.target === 'venta') {
      const resultBar = document.getElementById('scan-result-venta');
      if (resultBar) { resultBar.style.display = 'block'; resultBar.textContent = '✅ Código: ' + code; }
      Ventas.searchProduct(code);
    } else if (this.target === 'reg') {
      Inventario.setRegCode(code);
    }
  }
};

window.Scanner = Scanner;