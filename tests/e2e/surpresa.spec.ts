import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

const BEBE = 'Tem um bebê a caminho!';

async function centro(page: Page, sel: string) {
  const b = (await page.locator(sel).boundingBox())!;
  return { x: b.x + b.width / 2, y: b.y + b.height / 2, b };
}

const GESTOS: Record<string, (page: Page) => Promise<void>> = {
  async segurar(page) {
    const c = await centro(page, '.presente');
    await page.mouse.move(c.x, c.y);
    await page.mouse.down();
    await page.waitForTimeout(2100);
    await page.mouse.up();
  },
  async laco(page) {
    const c = await centro(page, '.laco-botao');
    await page.mouse.move(c.x, c.y);
    await page.mouse.down();
    await page.mouse.move(c.x + 215, c.y, { steps: 12 });
    await page.mouse.up();
  },
  async tampa(page) {
    const c = await centro(page, '.tampa');
    await page.mouse.move(c.x, c.y);
    await page.mouse.down();
    await page.mouse.move(c.x, c.y - 160, { steps: 12 });
    await page.mouse.up();
  },
  async envelope(page) {
    for (let i = 0; i < 5; i++) await page.locator('.selo').click();
  },
  async raspar(page) {
    await page.waitForTimeout(100);
    const { b } = await centro(page, '.raspa-canvas');
    await page.mouse.move(b.x + 10, b.y + 10);
    await page.mouse.down();
    for (let y = b.y + 10; y < b.y + b.height; y += 30) {
      await page.mouse.move(b.x + b.width - 10, y, { steps: 4 });
      await page.mouse.move(b.x + 10, y + 15, { steps: 4 });
    }
    await page.mouse.up();
  },
};

for (const [m, gesto] of Object.entries(GESTOS)) {
  test(`${m}: o gesto abre o lacre e revela a mensagem`, async ({ page }) => {
    await page.goto(`./?p=titia&n=${encodeURIComponent('Conceição')}&m=${m}`);
    const revelacao = page.locator('.revelacao');
    // nada revela o papel nem o bebê antes de abrir (fora a raspadinha, que fica sob o canvas)
    await expect(page.locator('.lacre')).toBeVisible();
    await expect(revelacao).toHaveText('');
    if (m !== 'raspar') await expect(page.locator('body')).not.toContainText(/Titia|bebê/);

    await gesto(page);

    await expect(revelacao.getByText(BEBE)).toBeVisible();
    await expect(revelacao).toContainText('Conceição, você foi promovida a');
    await expect(revelacao.locator('.msg-titulo')).toHaveText('Titia');
    await expect(revelacao.locator('.confete')).toHaveCount(44);
    // a página não rola
    const rola = await page.evaluate(() => document.documentElement.scrollHeight > innerHeight + 1);
    expect(rola).toBe(false);
  });
}

test('teclado: Enter/Espaço avançam cada gesto', async ({ page }) => {
  for (const [m, sel, vezes] of [['laco', '.laco-botao', 4], ['tampa', '.tampa', 3], ['envelope', '.selo', 5], ['raspar', '.raspa-canvas', 4]] as const) {
    await page.goto(`./?p=vovo-o&m=${m}&k=${Date.now()}`);
    await page.locator(sel).focus();
    for (let i = 0; i < vezes; i++) await page.keyboard.press(i % 2 ? 'Space' : 'Enter');
    await expect(page.getByText(BEBE), m).toBeVisible();
  }
  await page.goto(`./?p=vovo-o&m=segurar&k=${Date.now()}`);
  await page.locator('.presente').focus();
  await page.keyboard.down('Space');
  await page.waitForTimeout(2100);
  await page.keyboard.up('Space');
  await expect(page.getByText(BEBE)).toBeVisible();
});

test('soltar cedo não abre; recarregar depois de aberto mostra direto a mensagem', async ({ page }) => {
  await page.goto('./?p=vovo-a&m=laco');
  const c = await centro(page, '.laco-botao');
  await page.mouse.move(c.x, c.y);
  await page.mouse.down();
  await page.mouse.move(c.x + 120, c.y, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(800);
  await expect(page.locator('.revelacao')).toHaveText('');

  await GESTOS.laco(page);
  await expect(page.getByText(BEBE)).toBeVisible();
  await page.reload();
  await expect(page.getByText(BEBE)).toBeVisible();
  await expect(page.locator('.lacre')).toHaveCount(0);
  await expect(page.locator('.confete')).toHaveCount(0);
});

test.describe('movimento reduzido', () => {
  test.use({ reducedMotion: 'reduce' });
  test('sem confete, sem brilhos e sem tremor', async ({ page }) => {
    await page.goto('./?p=titio&m=segurar');
    await expect(page.locator('.brilho')).toHaveCount(0);
    const c = await centro(page, '.presente');
    await page.mouse.move(c.x, c.y);
    await page.mouse.down();
    await page.waitForTimeout(900);
    const tf = await page.locator('.presente').evaluate((el) => el.style.transform);
    expect(tf).toMatch(/rotate\(0deg\)/);
    await page.waitForTimeout(1200);
    await page.mouse.up();
    await expect(page.getByText(BEBE)).toBeVisible();
    await expect(page.locator('.confete')).toHaveCount(0);
  });
});

test('parâmetros inválidos caem no padrão (vovó + laço)', async ({ page }) => {
  await page.goto('./?p=xyz&m=abc&n=%3Cimg%20src%3Dx%3E');
  await expect(page.locator('.laco-botao')).toBeVisible();
  await GESTOS.laco(page);
  await expect(page.locator('.msg-titulo')).toHaveText('Vovó');
  await expect(page.locator('.msg-pre')).toHaveText('<img src=x>, você foi promovida a');
  await expect(page.locator('.revelacao img')).toHaveCount(0);
});
