import React, { useContext, useEffect, useState } from 'react';
import { Camera, LockKeyhole, Upload } from 'lucide-react';
import { AuthContext } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';

const TAMANHO_MAXIMO_AVATAR = 5 * 1024 * 1024;
const TIPOS_AVATAR = ['image/jpeg', 'image/png'];

function urlDoAvatar(url, baseURL) {
  if (!url) return '';
  try {
    return new URL(url, baseURL).toString();
  } catch {
    return '';
  }
}

function mensagemErro(error) {
  const detalhe = error.response?.data?.detail;
  if (typeof detalhe === 'string') return detalhe;
  if (Array.isArray(detalhe)) return detalhe[0]?.msg || 'Verifique os dados informados.';
  return 'Não foi possível atualizar o perfil.';
}

export default function MeuPerfil({ voltar }) {
  const { user, api, atualizarUsuario } = useContext(AuthContext);
  const [nome, setNome] = useState(user.nome || '');
  const [cpf, setCpf] = useState(user.cpf || '');
  const [rg, setRg] = useState(user.rg || '');
  const [dataNascimento, setDataNascimento] = useState(user.data_nascimento || '');
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregandoPerfil, setCarregandoPerfil] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [alterandoSenha, setAlterandoSenha] = useState(false);

  useEffect(() => {
    let ativo = true;
    api.get('/api/auth/me')
      .then(resposta => {
        if (!ativo) return;
        atualizarUsuario(resposta.data);
        setNome(resposta.data.nome);
        setCpf(resposta.data.cpf || '');
        setRg(resposta.data.rg || '');
        setDataNascimento(resposta.data.data_nascimento || '');
      })
      .catch(() => {
        if (ativo) setErro('Não foi possível carregar os dados do perfil.');
      })
      .finally(() => {
        if (ativo) setCarregandoPerfil(false);
      });
    return () => {
      ativo = false;
    };
  }, [api]);

  useEffect(() => {
    if (!preview) return undefined;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const selecionarAvatar = (evento) => {
    const arquivo = evento.target.files?.[0];
    setErro('');
    if (!arquivo) return;
    if (!TIPOS_AVATAR.includes(arquivo.type)) {
      setErro('Selecione uma imagem PNG ou JPEG.');
      evento.target.value = '';
      return;
    }
    if (arquivo.size > TAMANHO_MAXIMO_AVATAR) {
      setErro('A imagem deve ter no máximo 5 MiB.');
      evento.target.value = '';
      return;
    }
    setAvatar(arquivo);
    setPreview(URL.createObjectURL(arquivo));
  };

  const salvarPerfil = async (evento) => {
    evento.preventDefault();
    setErro('');
    setSucesso('');
    setSalvando(true);
    const dados = new FormData();
    dados.append('nome', nome);
    dados.append('cpf', cpf);
    dados.append('rg', rg);
    dados.append('data_nascimento', dataNascimento);
    if (avatar) dados.append('avatar', avatar);

    try {
      const resposta = await api.patch('/api/perfil/me', dados);
      atualizarUsuario(resposta.data);
      setNome(resposta.data.nome);
      setCpf(resposta.data.cpf || '');
      setRg(resposta.data.rg || '');
      setDataNascimento(resposta.data.data_nascimento || '');
      setAvatar(null);
      setPreview('');
      setSucesso('Perfil atualizado com sucesso.');
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  };

  const alterarSenha = async (evento) => {
    evento.preventDefault();
    setErro('');
    setSucesso('');
    if (novaSenha !== confirmarSenha) {
      setErro('A nova senha e a confirmação devem ser iguais.');
      return;
    }
    setAlterandoSenha(true);
    try {
      const resposta = await api.post('/api/auth/alterar-senha', {
        senha_atual: senhaAtual,
        nova_senha: novaSenha,
      });
      atualizarUsuario({ deve_trocar_senha: resposta.data.deve_trocar_senha });
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      setSucesso('Senha alterada com sucesso.');
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setAlterandoSenha(false);
    }
  };

  const imagem = preview || urlDoAvatar(user.avatar_url, api.defaults.baseURL);
  const ultimaAtividade = user.ultima_atividade
    ? new Date(user.ultima_atividade).toLocaleString('pt-BR')
    : 'Ainda não registrada';

  return (
    <section className="profile-view" aria-labelledby="profile-title">
      {!user.deve_trocar_senha && (
        <button type="button" className="profile-back-button" onClick={voltar}>
          Voltar ao menu
        </button>
      )}
      <h2 id="profile-title">Meu perfil</h2>
      {user.deve_trocar_senha && (
        <p className="feedback feedback-error" role="alert">
          Sua senha foi redefinida. Atualize os dados cadastrais e escolha uma nova senha para continuar.
        </p>
      )}
      {erro && <p className="feedback feedback-error" role="alert">{erro}</p>}
      {sucesso && <p className="feedback feedback-success" role="status">{sucesso}</p>}

      {carregandoPerfil ? (
        <LoadingSpinner label="Carregando perfil..." />
      ) : (
      <>
      <form className="profile-form" onSubmit={salvarPerfil}>
        <div className="profile-avatar-control">
          {imagem ? (
            <img className="profile-avatar-image" src={imagem} alt={`Foto de ${nome || 'perfil'}`} />
          ) : (
            <span className="profile-avatar-fallback" aria-hidden="true">
              {nome.charAt(0).toUpperCase() || 'U'}
            </span>
          )}
          <input
            id="profile-avatar"
            type="file"
            className="profile-file-input"
            accept="image/png,image/jpeg"
            onChange={selecionarAvatar}
          />
          <label htmlFor="profile-avatar" className="profile-avatar-upload">
            <Camera size={18} aria-hidden="true" />
            <span>{avatar ? 'Trocar foto' : 'Enviar foto'}</span>
            <Upload size={15} aria-hidden="true" />
          </label>
          <small>PNG ou JPEG, até 5 MiB.</small>
        </div>

        <div className="profile-readonly-field">
          <span>E-mail</span>
          <strong>{user.email}</strong>
          <small>O e-mail não pode ser alterado por esta tela.</small>
        </div>
        <label htmlFor="profile-cpf">
          CPF
          <input
            id="profile-cpf"
            name="cpf"
            inputMode="numeric"
            autoComplete="off"
            value={cpf}
            onChange={evento => setCpf(evento.target.value)}
            maxLength={14}
            required
          />
        </label>
        <label htmlFor="profile-rg">
          RG
          <input
            id="profile-rg"
            name="rg"
            autoComplete="off"
            value={rg}
            onChange={evento => setRg(evento.target.value)}
            maxLength={30}
            required
          />
        </label>
        <label htmlFor="profile-birth-date">
          Data de nascimento
          <input
            id="profile-birth-date"
            name="data_nascimento"
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            value={dataNascimento}
            onChange={evento => setDataNascimento(evento.target.value)}
            required
          />
        </label>
        <label htmlFor="profile-name">
          Nome
          <input
            id="profile-name"
            name="nome"
            autoComplete="name"
            value={nome}
            onChange={evento => setNome(evento.target.value)}
            maxLength={100}
            required
          />
        </label>
        <div className="profile-readonly-field">
          <span>Perfil</span>
          <strong>{user.perfil}</strong>
        </div>
        <p className="profile-activity">
          <strong>Última atividade:</strong> {ultimaAtividade}
        </p>
        <button type="submit" disabled={salvando} aria-busy={salvando}>
          {salvando ? <LoadingSpinner label="Salvando perfil..." inline /> : 'Salvar dados e foto'}
        </button>
      </form>
      <form className="profile-form profile-password-form" onSubmit={alterarSenha}>
        <h3><LockKeyhole size={18} aria-hidden="true" /> Alterar senha</h3>
        <label htmlFor="current-password">
          Senha atual ou temporária
          <input id="current-password" type="password" autoComplete="current-password" value={senhaAtual} onChange={evento => setSenhaAtual(evento.target.value)} required />
        </label>
        <label htmlFor="new-password">
          Nova senha
          <input id="new-password" type="password" autoComplete="new-password" minLength={12} maxLength={72} value={novaSenha} onChange={evento => setNovaSenha(evento.target.value)} required />
          <small>Use pelo menos 12 caracteres, com letras e números.</small>
        </label>
        <label htmlFor="confirm-password">
          Confirmar nova senha
          <input id="confirm-password" type="password" autoComplete="new-password" minLength={12} maxLength={72} value={confirmarSenha} onChange={evento => setConfirmarSenha(evento.target.value)} required />
        </label>
        <button type="submit" disabled={alterandoSenha} aria-busy={alterandoSenha}>
          {alterandoSenha ? <LoadingSpinner label="Alterando senha..." inline /> : 'Atualizar senha'}
        </button>
      </form>
      </>
        )}
    </section>
  );
}