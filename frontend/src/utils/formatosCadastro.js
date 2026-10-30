export function formatarRg(valor) {
  const caracteres = valor.replace(/[^0-9a-z]/gi, '').toUpperCase().slice(0, 20);
  if (caracteres.length <= 2) return caracteres;
  if (caracteres.length <= 5) return `${caracteres.slice(0, 2)}.${caracteres.slice(2)}`;
  if (caracteres.length <= 8) return `${caracteres.slice(0, 2)}.${caracteres.slice(2, 5)}.${caracteres.slice(5)}`;
  return `${caracteres.slice(0, 2)}.${caracteres.slice(2, 5)}.${caracteres.slice(5, 8)}-${caracteres.slice(8)}`;
}

export function formatarDataNascimento(valor) {
  const digitos = valor.replace(/\D/g, '').slice(0, 8);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
}

export function dataNascimentoParaIso(valor) {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valor);
  if (!partes) return null;

  const [, dia, mes, ano] = partes;
  const data = new Date(0);
  data.setFullYear(Number(ano), Number(mes) - 1, Number(dia));
  if (
    data.getFullYear() !== Number(ano) ||
    data.getMonth() !== Number(mes) - 1 ||
    data.getDate() !== Number(dia)
  ) {
    return null;
  }

  return `${ano}-${mes}-${dia}`;
}

export function isoParaData(valor) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor || '');
  return partes ? `${partes[3]}/${partes[2]}/${partes[1]}` : '';
}

export function formatarDataHora(valor) {
  const digitos = valor.replace(/\D/g, '').slice(0, 12);
  const data = formatarDataNascimento(digitos.slice(0, 8));
  if (digitos.length <= 8) return data;
  const hora = digitos.slice(8);
  return `${data} ${hora.slice(0, 2)}${hora.length > 2 ? `:${hora.slice(2)}` : ''}`;
}

export function dataHoraParaIsoLocal(valor) {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/.exec(valor);
  if (!partes) return null;

  const [, dia, mes, ano, hora, minuto] = partes;
  const dataIso = dataNascimentoParaIso(`${dia}/${mes}/${ano}`);
  if (!dataIso || Number(hora) > 23 || Number(minuto) > 59) return null;
  return `${dataIso}T${hora}:${minuto}`;
}
