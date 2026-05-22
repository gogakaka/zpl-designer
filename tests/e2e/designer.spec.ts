import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => indexedDB.deleteDatabase('zpl-designer'));
  await page.reload();
  await expect(page.locator('.brand')).toBeVisible();
});

test('앱이 로드되고 ZPL 코드가 출력된다', async ({ page }) => {
  await expect(page.locator('.brand')).toContainText('ZPL Designer');
  await expect(page.getByTestId('zpl-output')).toContainText('^XA');
  await expect(page.getByTestId('zpl-output')).toContainText('^XZ');
});

test('텍스트 요소를 추가하면 ZPL에 ^FD가 생긴다', async ({ page }) => {
  await page.getByTitle('텍스트 추가').click();
  await expect(page.getByTestId('zpl-output')).toContainText('^FD');
  await expect(page.getByTestId('zpl-output')).toContainText('^A0N');
});

test('바코드 요소를 추가하면 ZPL에 ^BC가 생긴다', async ({ page }) => {
  await page.getByTitle('바코드 추가').click();
  await expect(page.getByTestId('zpl-output')).toContainText('^BC');
  await expect(page.getByTestId('zpl-output')).toContainText('^BY');
});

test('QR 코드 요소를 추가하면 ZPL에 ^BQ가 생긴다', async ({ page }) => {
  await page.getByTitle('QR/2D 추가').click();
  await expect(page.getByTestId('zpl-output')).toContainText('^BQ');
});

test('템플릿을 불러오면 디자인 요소가 채워진다', async ({ page }) => {
  await page.getByRole('button', { name: '열기 / 템플릿' }).click();
  await page.getByText('배송 라벨', { exact: true }).click();
  await expect(page.getByTestId('zpl-output')).toContainText('^BC');
  await expect(page.getByTestId('zpl-output')).toContainText('^GB');
});

test('실행취소로 추가한 요소가 제거된다', async ({ page }) => {
  await page.getByTitle('박스 추가').click();
  await expect(page.getByTestId('zpl-output')).toContainText('^GB');
  await page.keyboard.press('Control+z');
  await expect(page.getByTestId('zpl-output')).not.toContainText('^GB');
});

test('TSPL 생성기로 전환할 수 있다', async ({ page }) => {
  await page.getByTitle('텍스트 추가').click();
  await page.locator('.bottom-head select').selectOption('tspl');
  await expect(page.getByTestId('zpl-output')).toContainText('SIZE');
  await expect(page.getByTestId('zpl-output')).toContainText('PRINT');
});
