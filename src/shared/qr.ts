import qrcode from 'qrcode-generator';

// O padrão da lib só olha o byte baixo de cada caractere; acentos precisam de UTF-8.
qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];

function qrObj(texto: string) {
  const qr = qrcode(0, 'M');
  qr.addData(texto, 'Byte');
  qr.make();
  return qr;
}

/** SVG escalável (nível M, margem 0). */
export function qrSvg(texto: string): string {
  return qrObj(texto).createSvgTag({ cellSize: 4, margin: 0, scalable: true });
}

/** PNG em dataURL, fundo branco e quiet zone de 4 módulos. */
export function qrPng(texto: string, px = 1024): string {
  const qr = qrObj(texto);
  const n = qr.getModuleCount();
  const q = 4;
  const cell = px / (n + q * 2);
  const c = document.createElement('canvas');
  c.width = c.height = px;
  const x = c.getContext('2d')!;
  x.fillStyle = '#fff';
  x.fillRect(0, 0, px, px);
  x.fillStyle = '#000';
  for (let r = 0; r < n; r++) {
    for (let k = 0; k < n; k++) {
      if (qr.isDark(r, k)) x.fillRect(Math.floor((k + q) * cell), Math.floor((r + q) * cell), Math.ceil(cell), Math.ceil(cell));
    }
  }
  return c.toDataURL('image/png');
}
