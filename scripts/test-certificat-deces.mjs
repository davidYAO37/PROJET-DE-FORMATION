export default async function run(page, ui) {
  const unauthenticated = await page.request.get('http://localhost:3000/api/certificatDeces?patientId=invalid');
  if (unauthenticated.status() !== 401) throw new Error('API accessible sans authentification');
  if (!process.env.TEST_EMAIL || !process.env.TEST_PASSWORD) throw new Error('TEST_EMAIL et TEST_PASSWORD requis');
  await page.locator('input[type=email]').fill(process.env.TEST_EMAIL);
  await page.locator('input[type=password]').fill(process.env.TEST_PASSWORD);
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
  await page.waitForURL('**/dashboard', { timeout: 30000 });
  await page.goto('http://localhost:3000/pages/servicemedecin/tmedecin');
  await page.getByRole('button', { name: 'Dossiers Patient', exact: true }).first().click();
  await page.getByText('Certificat de décès', { exact: true }).click();
  await page.getByRole('heading', { name: 'Nouveau certificat' }).waitFor();
  const snapshot = await ui.snapshot({ full: true });
  if (!snapshot.includes('Date du décès') || !snapshot.includes('Enregistrer et valider')) throw new Error('Formulaire incomplet');
  return { unauthenticatedStatus: unauthenticated.status(), formulaireAccessible: true };
}
