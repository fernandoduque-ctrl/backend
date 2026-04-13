/** Validação de dígitos — algoritmos oficiais CPF/CNPJ (apenas números). */

export function onlyDigits(s: string): string {
  return (s || '').replace(/\D/g, '');
}

export function isValidCPF(raw: string): boolean {
  const cpf = onlyDigits(raw);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i], 10) * (10 - i);
  let d1 = (sum * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== parseInt(cpf[9], 10)) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i], 10) * (11 - i);
  let d2 = (sum * 10) % 11;
  if (d2 === 10) d2 = 0;
  return d2 === parseInt(cpf[10], 10);
}

export function isValidCNPJ(raw: string): boolean {
  const cnpj = onlyDigits(raw);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(cnpj[i], 10) * w1[i];
  const d1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (d1 !== parseInt(cnpj[12], 10)) return false;
  sum = 0;
  for (let i = 0; i < 13; i++) sum += parseInt(cnpj[i], 10) * w2[i];
  const d2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return d2 === parseInt(cnpj[13], 10);
}

/** Razão social: letras, números, espaço e pontuação básica corporativa */
export function isValidLegalName(name: string): boolean {
  if (!name || name.length < 2) return false;
  return /^[\p{L}\p{N}\s.,\-&/()]+$/u.test(name.trim());
}

export function suggestEmailFix(email: string): string | null {
  const fixes: Record<string, string> = {
    gmial: 'gmail',
    gmai: 'gmail',
    hotmial: 'hotmail',
    yaho: 'yahoo',
    outlok: 'outlook',
  };
  const at = email.indexOf('@');
  if (at < 0) return null;
  const domain = email.slice(at + 1).split('.')[0]?.toLowerCase();
  if (domain && fixes[domain]) {
    const rest = email.slice(at + 1).split('.').slice(1).join('.');
    return `${email.slice(0, at + 1)}${fixes[domain]}.${rest || 'com'}`;
  }
  return null;
}
