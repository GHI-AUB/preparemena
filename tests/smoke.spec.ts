import { expect, test } from '@playwright/test'

test('regional overview renders metrics, map panel, and digest', async ({ page }) => {
  await page.goto('/?view=overview')
  await expect(page.getByRole('heading', { name: 'Regional overview' })).toBeVisible()
  await expect(page.locator('.metric').first()).toBeVisible()
  await expect(page.getByText('Preparedness across MENA')).toBeVisible()
  await expect(page.getByText('What changed')).toBeVisible()
  await expect(page.locator('.map-year input[type=range]')).toBeVisible()
})

test('priority table navigates to country profile and back button returns', async ({ page }) => {
  await page.goto('/?view=overview')
  await page.locator('.priority-table tbody tr').first().click()
  await expect(page.getByRole('heading', { name: 'Country profile' })).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('heading', { name: 'Regional overview' })).toBeVisible()
})

test('country picker filters and switches country', async ({ page }) => {
  await page.goto('/?view=country&country=LBN')
  const input = page.locator('.country-combobox input')
  await input.click()
  await input.fill('jord')
  await page.locator('.combo-list li').first().click()
  await expect(page.locator('.country-identity h2')).toHaveText('Jordan')
})

test('compare overlay adds a second country to the radar', async ({ page }) => {
  await page.goto('/?view=country&country=LBN')
  await page.locator('.inline-select select').selectOption('JOR')
  await expect(page.locator('svg .radar-series.compare').first()).toBeVisible()
  await expect(page.locator('.radar-legend')).toContainText('Jordan')
})

test('context, about, and methodology workspaces render', async ({ page }) => {
  await page.goto('/?view=context')
  await expect(page.getByRole('heading', { name: 'Context & pressures' })).toBeVisible()
  await page.goto('/?view=about')
  await expect(page.locator('main h2').first()).toBeVisible()
  await page.goto('/?view=methodology')
  await expect(page.locator('main h1, main h2').first()).toBeVisible()
})

test('dark mode toggle flips the theme token', async ({ page }) => {
  await page.goto('/?view=overview')
  await page.getByRole('button', { name: 'Switch to dark mode' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})

test('arabic toggle switches direction and translates navigation', async ({ page }) => {
  await page.goto('/?view=overview')
  await page.getByRole('button', { name: 'العربية' }).click()
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page.locator('.sidebar')).toContainText('نظرة إقليمية عامة')
})

test('csv export links carry data', async ({ page }) => {
  await page.goto('/?view=overview')
  await expect(page.locator('.export-link').first()).toHaveAttribute('href', /blob:/)
})
