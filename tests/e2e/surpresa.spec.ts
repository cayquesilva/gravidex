import { expect, test, type Page } from '@playwright/test';
import { FRENTES } from '../../src/shared/config';

test.use({ viewport: { width: 390, height: 844 } });

const BEBE = 'Tem um bebê a caminho!';
const RECADO = 'Você vai ser incrível nesse papel. Te amamos!';

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

const virar = (page: Page) => page.locator('.cartinha').click();

for (const [m, gesto] of Object.entries(GESTOS)) {
  test(`${m}: o gesto abre o lacre e a cartinha vira capa → recado → promoção`, async ({ page }) => {
    await page.goto(`./?p=titia&n=${encodeURIComponent('Conceição')}&m=${m}&f=2&x=${encodeURIComponent(RECADO)}`);
    const aviso = page.locator('.so-leitor');
    // nada revela o papel nem o bebê antes de abrir (fora a raspadinha, que fica sob o canvas)
    await expect(page.locator('.lacre')).toBeVisible();
    await expect(page.locator('.revelacao')).toHaveText('');
    await expect(aviso).toHaveText('');
    if (m !== 'raspar') await expect(page.locator('body')).not.toContainText(/Titia|bebê/);

    await gesto(page);

    // presentes e envelope: a cartinha vai para a camada; raspadinha: fica no próprio cartão, sem a película
    const carta = page.locator(m === 'raspar' ? '.raspa-card.raspado .cartinha' : '.revelacao .cartinha');
    await expect(carta).toBeVisible();
    // capa: saudação + texto pronto
    await expect(carta).toHaveAttribute('data-etapa', 'capa');
    const ativo = (sel: string) => carta.locator(`.face:not(.verso) .painel.ativo ${sel}`);
    await expect(ativo('.frente-saudacao')).toHaveText('Querida Conceição,');
    await expect(ativo('.frente-texto')).toHaveText(FRENTES[2].texto);
    await expect(aviso).toContainText(FRENTES[2].texto);
    await expect(page.locator('.confete')).toHaveCount(0);
    if (m === 'raspar') await expect(page.locator('.raspa-canvas')).toHaveCSS('opacity', '0');

    // recado dos pais, no verso
    await virar(page);
    await expect(carta).toHaveAttribute('data-etapa', 'recado');
    await expect(carta).toHaveClass(/mostra-verso/);
    await expect(carta.locator('.verso .painel.ativo .recado-texto')).toHaveText(RECADO);
    await expect(aviso).toHaveText(RECADO);
    await expect(page.locator('.confete')).toHaveCount(0);

    // promoção, de novo na frente (giro acumulado de 360°)
    await virar(page);
    await expect(carta).toHaveAttribute('data-etapa', 'promocao');
    await expect(carta).not.toHaveClass(/mostra-verso/);
    await expect(page.locator('.cartinha-giro')).toHaveAttribute('style', /--giro: 360deg/);
    await expect(ativo('.msg-parabens')).toHaveText('Parabéns, Conceição!');
    await expect(ativo('.msg-pre')).toHaveText('Você foi promovida a');
    await expect(ativo('.msg-titulo')).toHaveText('Titia');
    await expect(ativo('.msg-bebe')).toHaveText(BEBE);
    await expect(aviso).toContainText(BEBE);
    await expect(page.locator('.confete')).toHaveCount(44);

    // continua girando e volta para a capa; o confete não repete
    await virar(page);
    await expect(carta).toHaveAttribute('data-etapa', 'capa');
    await virar(page);
    await virar(page);
    await expect(carta).toHaveAttribute('data-etapa', 'promocao');
    await expect(page.locator('.confete')).toHaveCount(44);
    // a página não rola
    const rola = await page.evaluate(() => document.documentElement.scrollHeight > innerHeight + 1);
    expect(rola).toBe(false);
  });
}

test('teclado: Enter/Espaço avançam cada gesto e viram a cartinha', async ({ page }) => {
  for (const [m, sel, vezes] of [['laco', '.laco-botao', 4], ['tampa', '.tampa', 3], ['envelope', '.selo', 5], ['raspar', '.raspa-canvas', 4]] as const) {
    await page.goto(`./?p=vovo-o&m=${m}&k=${Date.now()}`);
    await page.locator(sel).focus();
    // tecla até abrir (a raspadinha pode abrir antes, conforme a altura do cartão); para quando o foco sai do gesto
    for (let i = 0; i < vezes; i++) {
      if (!(await page.locator(sel).evaluate((el) => el === document.activeElement))) break;
      await page.keyboard.press(i % 2 ? 'Space' : 'Enter');
    }
    // o foco vai para a cartinha, que vira com Enter
    await expect(page.locator('.cartinha'), m).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('.so-leitor'), m).toContainText(BEBE);
  }
  await page.goto(`./?p=vovo-o&m=segurar&k=${Date.now()}`);
  await page.locator('.presente').focus();
  await page.keyboard.down('Space');
  await page.waitForTimeout(2100);
  await page.keyboard.up('Space');
  await expect(page.locator('.cartinha')).toBeFocused();
  await page.keyboard.press('Space');
  await expect(page.locator('.so-leitor')).toContainText(BEBE);
});

test('soltar cedo não abre; recarregar depois de aberto mostra direto o verso', async ({ page }) => {
  await page.goto('./?p=vovo-a&m=laco');
  const c = await centro(page, '.laco-botao');
  await page.mouse.move(c.x, c.y);
  await page.mouse.down();
  await page.mouse.move(c.x + 120, c.y, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(800);
  await expect(page.locator('.revelacao')).toHaveText('');

  await GESTOS.laco(page);
  await expect(page.locator('.cartinha')).toBeVisible();
  await page.reload();
  await expect(page.locator('.cartinha')).toHaveAttribute('data-etapa', 'promocao');
  await expect(page.locator('.so-leitor')).toContainText(BEBE);
  await expect(page.locator('.lacre')).toHaveCount(0);
  await expect(page.locator('.confete')).toHaveCount(0);
});

test('raspadinha aberta continua como cartão raspado ao recarregar', async ({ page }) => {
  await page.goto('./?p=titio&m=raspar');
  await GESTOS.raspar(page);
  await expect(page.locator('.raspa-card.raspado')).toBeVisible();
  await page.reload();
  const card = page.locator('.revelacao .raspa-card.raspado');
  await expect(card.locator('.cartinha')).toHaveAttribute('data-etapa', 'promocao');
  await expect(card.locator('.frente .painel.ativo .msg-titulo')).toHaveText('Titio');
  await expect(page.locator('.raspa-canvas')).toHaveCount(0);
});

test('sem recado e sem nome: capa sem saudação e vai direto para a promoção', async ({ page }) => {
  await page.goto('./?p=titio&m=laco');
  await GESTOS.laco(page);
  const carta = page.locator('.cartinha');
  await expect(carta).toHaveAttribute('data-etapa', 'capa');
  await expect(carta.locator('.frente-saudacao')).toHaveCount(0);
  await expect(carta.locator('.painel.recado')).toHaveCount(0);
  await virar(page);
  await expect(carta).toHaveAttribute('data-etapa', 'promocao');
  await expect(carta.locator('.verso .painel.ativo .msg-parabens')).toHaveText('Parabéns!');
  await expect(page.locator('.confete')).toHaveCount(44);
});

test.describe('movimento reduzido', () => {
  test.use({ reducedMotion: 'reduce' });
  test('sem confete, sem brilhos, sem tremor e sem giro', async ({ page }) => {
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
    await virar(page);
    await expect(page.locator('.verso')).toHaveCSS('opacity', '1');
    await expect(page.locator('.cartinha-giro')).toHaveCSS('transform', 'none');
    await expect(page.locator('.so-leitor')).toContainText(BEBE);
    await expect(page.locator('.confete')).toHaveCount(0);
  });
});

test('parâmetros inválidos caem no padrão (vovó + laço)', async ({ page }) => {
  await page.goto('./?p=xyz&m=abc&f=99&n=%3Cimg%20src%3Dx%3E');
  await expect(page.locator('.laco-botao')).toBeVisible();
  await GESTOS.laco(page);
  await expect(page.locator('.frente .frente-saudacao')).toHaveText('Querida <img src=x>,');
  await expect(page.locator('.frente .frente-texto')).toHaveText(FRENTES[0].texto);
  await expect(page.locator('.frente .msg-titulo')).toHaveText('Vovó');
  await expect(page.locator('.frente .msg-parabens')).toHaveText('Parabéns, <img src=x>!');
  await expect(page.locator(':is(.frente-saudacao, .msg-parabens) img')).toHaveCount(0);
});

test('primo e prima: saudação e promoção com o gênero certo', async ({ page }) => {
  for (const [p, nome, querido, verbo, titulo] of [
    ['primo', 'Caio', 'Querido', 'promovido', 'Primo'],
    ['prima', 'Lia', 'Querida', 'promovida', 'Prima'],
  ] as const) {
    await page.goto(`./?p=${p}&n=${nome}&m=laco`);
    await GESTOS.laco(page);
    await expect(page.locator('.frente .frente-saudacao')).toHaveText(`${querido} ${nome},`);
    await virar(page);
    await expect(page.locator('.verso .painel.ativo .msg-pre')).toHaveText(`Você foi ${verbo} a`);
    await expect(page.locator('.verso .painel.ativo .msg-titulo')).toHaveText(titulo);
  }
});
