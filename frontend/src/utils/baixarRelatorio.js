export async function baixarRelatorio(api, endpoint, formato, filtros) {
  const resposta = await api.get(endpoint, {
    params: { ...filtros, formato },
    responseType: 'blob',
  });
  const arquivo = new Blob([resposta.data], {
    type: formato === 'pdf' ? 'application/pdf' : 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(arquivo);
  const link = document.createElement('a');
  const nome = resposta.headers['content-disposition']
    ?.match(/filename="?([^";]+)"?/i)?.[1]
    || `relatorio-reservas.${formato}`;

  link.href = url;
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}