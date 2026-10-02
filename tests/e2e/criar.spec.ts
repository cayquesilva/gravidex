import { expect, test } from '@playwright/test';

test('4 pessoas → 4 QR distintos, estado sobrevive ao reload, impressão 2×2', async ({ page }) => {
  await page.addInitScript(() => { (window as unknown as { print: () => void }).print = () => { document.body.dataset.impresso = '1'; }; });
  await page.goto('./criar/');

  // http://localhost não é https → aviso e ações desativadas
  await expect(page.locator('#base-aviso')).toBeVisible();
  await expect(page.locator('#imprimir')).toBeDisabled();

  await page.locator('#base').fill('https://surpresa.netlify.app/');
  await expect(page.locator('#base-aviso')).toBeHidden();
  await expect(page.locator('.cartao')).toHaveCount(4);
  await expect(page.locator('.cartao .qr svg')).toHaveCount(4);

  const nomes = ['Conceição', 'João Pedro', 'Ana', 'Beto'];
  for (const [i, n] of nomes.entries()) await page.locator('.pessoa .nome').nth(i).fill(n);
  const svgs = await page.locator('.cartao .qr').evaluateAll((els) => els.map((e) => e.innerHTML));
  expect(new Set(svgs).size).toBe(4);

  // nada no cartão revela papel nem bebê
  for (const txt of await page.locator('.cartao').allTextContents()) {
    expect(txt).not.toMatch(/Vov[óô]|Titi[ao]|beb[êe]/i);
  }

  await page.locator('.mec[data-mec="envelope"]').click();
  await page.locator('#por-pessoa').check();
  await page.locator('.pessoa').nth(1).locator('select').nth(1).selectOption('raspar');

  await page.reload();
  await expect(page.locator('#base')).toHaveValue('https://surpresa.netlify.app/');
  await expect(page.locator('.pessoa .nome').nth(0)).toHaveValue('Conceição');
  await expect(page.locator('.mec[data-mec="envelope"]')).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('#por-pessoa')).toBeChecked();
  await expect(page.locator('.etiqueta').nth(1)).toHaveText('Vovô · Raspadinha');
  await expect(page.locator('.etiqueta').nth(0)).toHaveText('Vovó · Selo de cera');

  // nome repetido com o mesmo papel → aviso amarelo
  await page.locator('#add').click();
  await page.locator('.pessoa .nome').nth(4).fill('ana');
  await expect(page.locator('#dup-aviso')).toBeVisible();
  await expect(page.locator('#imprimir')).toBeEnabled();

  await page.locator('#imprimir').click();
  await expect(page.locator('body')).toHaveAttribute('data-impresso', '1');
  await expect(page.locator('.folha')).toHaveCount(2);
  await expect(page.locator('.folha').first().locator('.pc')).toHaveCount(4);
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('main')).toBeHidden();
  await expect(page.locator('.pc').first()).toBeVisible();
  const box = (await page.locator('.pc').first().boundingBox())!;
  expect(box.width / box.height).toBeCloseTo(80 / 115, 2);
  await page.emulateMedia({ media: 'screen' });

  // lista vazia bloqueia
  for (let i = 0; i < 5; i++) await page.locator('.remover').first().click();
  await expect(page.locator('#vazio-aviso')).toBeVisible();
  await expect(page.locator('#imprimir')).toBeDisabled();
});
