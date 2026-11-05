export function mascararCpf(valor = '') {
  const digitos = String(valor).replace(/\D/g, '').slice(0, 11);
  return digitos
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function mascararRg(valor = '') {
  const caracteres = String(valor).replace(/[^0-9a-z]/gi, '').toUpperCase();
  const digitos = caracteres.replace(/\D/g, '').slice(0, 9);
  const possuiX = caracteres.endsWith('X') && digitos.length === 8;
  const bruto = `${digitos.slice(0, possuiX ? 8 : 9)}${possuiX ? 'X' : ''}`;

  return bruto
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2}\.\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{2}\.\d{3}\.\d{3})([\dX])$/, '$1-$2');
}
