export function mascararCPF(valor) {
  const digitos = valor.replace(/\D/g, '').slice(0, 11);
  return digitos
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function mascararRG(valor) {
  const caracteres = valor.replace(/[^0-9a-z]/gi, '').slice(0, 9).toUpperCase();
  if (caracteres.length <= 2) return caracteres;
  if (caracteres.length <= 5) return `${caracteres.slice(0, 2)}.${caracteres.slice(2)}`;
  if (caracteres.length <= 8) {
    return `${caracteres.slice(0, 2)}.${caracteres.slice(2, 5)}.${caracteres.slice(5)}`;
  }
  return `${caracteres.slice(0, 2)}.${caracteres.slice(2, 5)}.${caracteres.slice(5, 8)}-${caracteres.slice(8).toUpperCase()}`;
}
