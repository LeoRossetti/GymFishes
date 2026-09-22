import { expect, test, type Page } from '@playwright/test'

const email = process.env.E2E_EMAIL
const password = process.env.E2E_PASSWORD

/** A celebration may cover the screen after a register (spec §7); a tap closes it. */
async function dismissCelebration(page: Page) {
  // The register sheet is itself role="dialog" (aria-label "Registrar água") and lingers in the
  // DOM mid-exit-animation after submit; wait for that one to fully close first so it is never
  // mistaken for a celebration screen, whose aria-label is the celebration text instead.
  await expect(page.getByRole('dialog', { name: 'Registrar água' })).toBeHidden()
  const dialog = page.getByRole('dialog')
  const shown = await dialog.waitFor({ state: 'visible', timeout: 1500 }).then(
    () => true,
    () => false,
  )
  if (!shown) return
  const depois = dialog.getByRole('button', { name: 'Depois' })
  if (await depois.isVisible()) await depois.click()
  else await dialog.click({ position: { x: 10, y: 10 } })
  await expect(dialog).toBeHidden()
}

/** Collapsed entry rows showing 500 ml — tubes and pills have no aria-expanded. */
const rows500 = (page: Page) =>
  page.getByRole('button', { expanded: false }).filter({ hasText: '500 ml' })

test('entrar → registrar 500 ml → Hoje → Ranking → recarregar → limpar', async ({ page }) => {
  test.skip(!email || !password, 'Defina E2E_EMAIL e E2E_PASSWORD em .env.local')

  await page.goto('/entrar')
  await page.getByLabel('E-mail').fill(email!)
  await page.getByLabel('Senha').fill(password!)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Hoje' })).toBeVisible()
  const before = await rows500(page).count()

  await page.getByRole('button', { name: 'Registrar água' }).click()
  await page.getByRole('button', { name: '+500' }).click()
  await page.getByRole('button', { name: 'Registrar 500 ml' }).click()
  await dismissCelebration(page)
  await expect(rows500(page)).toHaveCount(before + 1)

  await page.getByRole('link', { name: 'Ranking' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Ranking' })).toBeVisible()
  const minhaLinha = page.getByRole('listitem').filter({ hasText: 'Você' })
  await expect(minhaLinha).toContainText(/\d+ ml|\d+(,\d+)? L/)

  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: 'Ranking' })).toBeVisible()
  await expect(minhaLinha).toContainText(/\d+ ml|\d+(,\d+)? L/)

  // Leave the account as we found it, so the run is idempotent.
  await page.getByRole('link', { name: 'Hoje' }).click()
  await expect(rows500(page)).toHaveCount(before + 1)
  await rows500(page).first().click()
  await page.getByRole('button', { name: 'Excluir', exact: true }).click()
  await page.getByRole('button', { name: 'Excluir mesmo?' }).click()
  await expect(rows500(page)).toHaveCount(before)
})
