import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Botao } from '../components/Botao';
import { CampoTexto } from '../components/CampoTexto';
import { TelaAuth } from '../components/TelaAuth';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { AuthStackParams } from '../navigation/tipos';
import { cores, fontes } from '../theme';
import { errosPorCampo, mensagemDeErro } from '../utils/erros';
import { api } from '../services/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type Erros = { nome?: string; email?: string; telefone?: string; senha?: string; cep?: string; logradouro?: string; numero?: string; bairro?: string; cidade?: string; uf?: string };

export function RegistrarScreen({ navigation }: NativeStackScreenProps<AuthStackParams, 'Registrar'>) {
  const { registrar } = useAuth();
  const { mostrar } = useToast();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const [adicionarEndereco, setAdicionarEndereco] = useState(false);
  const [endereco, setEndereco] = useState({
    apelido: 'Casa',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    referencia: '',
  });
  const [erros, setErros] = useState<Erros>({});
  const [enviando, setEnviando] = useState(false);

  // Mesmas regras da API (a API continua sendo a palavra final).
  function validar() {
    const e: Erros = {};
    if (nome.trim().length < 2) e.nome = 'Nome deve ter ao menos 2 caracteres';
    if (!EMAIL_RE.test(email.trim())) e.email = 'E-mail inválido';
    if (senha.length < 8) e.senha = 'Senha deve ter ao menos 8 caracteres';
    else if (!/[A-Za-z]/.test(senha) || !/[0-9]/.test(senha)) e.senha = 'Senha deve ter letras e números';
    if (adicionarEndereco) {
      if (endereco.cep.replace(/\D/g, '').length !== 8) e.cep = 'CEP deve ter 8 dígitos';
      if (!endereco.logradouro.trim()) e.logradouro = 'Rua é obrigatória';
      if (!endereco.numero.trim()) e.numero = 'Número é obrigatório';
      if (!endereco.bairro.trim()) e.bairro = 'Bairro é obrigatório';
      if (!endereco.cidade.trim()) e.cidade = 'Cidade é obrigatória';
      if (!/^[A-Za-z]{2}$/.test(endereco.uf)) e.uf = 'UF deve ter 2 letras';
    }
    setErros(e);
    return Object.keys(e).length === 0;
  }

  async function criarConta() {
    if (!validar()) return;
    setEnviando(true);
    try {
      const enderecoNormalizado = adicionarEndereco
        ? { ...endereco, cep: endereco.cep.replace(/\D/g, ''), uf: endereco.uf.toUpperCase() }
        : undefined;
      await registrar(nome.trim(), email.trim(), senha, telefone.trim() || undefined, enderecoNormalizado);
      mostrar('Conta criada! Bem-vindo(a).', 'sucesso');
    } catch (err) {
      setErros(errosPorCampo(err));
      mostrar(mensagemDeErro(err), 'erro');
      setEnviando(false);
    }
  }

  const limpar = (campo: keyof Erros) => setErros((e) => ({ ...e, [campo]: undefined }));

  async function consultarCep(valor: string) {
    const cepFormatado = valor.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2');
    setEndereco((atual) => ({ ...atual, cep: cepFormatado }));
    limpar('cep');
    const cepLimpo = cepFormatado.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      try {
        const r = await api<{ logradouro: string; bairro: string; cidade: string; uf: string }>(`/cep/${cepLimpo}`);
        setEndereco((atual) => ({
          ...atual,
          logradouro: r.logradouro || atual.logradouro,
          bairro: r.bairro || atual.bairro,
          cidade: r.cidade || atual.cidade,
          uf: r.uf || atual.uf,
        }));
        mostrar('Endereço preenchido pelo CEP.', 'sucesso');
      } catch (err) {
        mostrar(mensagemDeErro(err), 'erro');
      }
    }
  }

  return (
    <TelaAuth titulo="Criar conta" subtitulo="Leva menos de um minuto.">
      <CampoTexto
        rotulo="Nome"
        value={nome}
        onChangeText={(t) => {
          setNome(t);
          limpar('nome');
        }}
        erro={erros.nome}
        placeholder="Seu nome"
        autoComplete="name"
      />
      <CampoTexto
        rotulo="E-mail"
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          limpar('email');
        }}
        erro={erros.email}
        placeholder="voce@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
      />
      <CampoTexto
        rotulo="Telefone/WhatsApp (opcional)"
        value={telefone}
        onChangeText={(t) => {
          setTelefone(t);
          limpar('telefone');
        }}
        erro={erros.telefone}
        placeholder="(00) 00000-0000"
        keyboardType="phone-pad"
        autoComplete="tel"
      />
      <CampoTexto
        rotulo="Senha"
        value={senha}
        onChangeText={(t) => {
          setSenha(t);
          limpar('senha');
        }}
        erro={erros.senha}
        dica="Mínimo de 8 caracteres, com letras e números."
        placeholder="Crie uma senha"
        secureTextEntry
        autoCapitalize="none"
        onSubmitEditing={criarConta}
        returnKeyType="go"
      />

      <Pressable
        onPress={() => setAdicionarEndereco((valor) => !valor)}
        style={estilos.enderecoTitulo}
        accessibilityRole="button"
      >
        <Text style={estilos.enderecoTexto}>Adicionar endereço agora</Text>
        <Text style={estilos.enderecoAcao}>{adicionarEndereco ? 'Ocultar' : 'Adicionar'}</Text>
      </Pressable>

      {adicionarEndereco && (
        <View style={estilos.enderecoBloco}>
          <CampoTexto rotulo="CEP" value={endereco.cep} onChangeText={consultarCep} erro={erros.cep} placeholder="00000-000" keyboardType="number-pad" />
          <CampoTexto rotulo="Rua" value={endereco.logradouro} onChangeText={(t) => setEndereco((a) => ({ ...a, logradouro: t }))} erro={erros.logradouro} placeholder="Rua, avenida..." />
          <CampoTexto rotulo="Número" value={endereco.numero} onChangeText={(t) => setEndereco((a) => ({ ...a, numero: t }))} erro={erros.numero} placeholder="Número ou S/N" />
          <CampoTexto rotulo="Complemento" value={endereco.complemento} onChangeText={(t) => setEndereco((a) => ({ ...a, complemento: t }))} placeholder="Apartamento, bloco..." />
          <CampoTexto rotulo="Bairro" value={endereco.bairro} onChangeText={(t) => setEndereco((a) => ({ ...a, bairro: t }))} erro={erros.bairro} placeholder="Bairro" />
          <CampoTexto rotulo="Cidade" value={endereco.cidade} onChangeText={(t) => setEndereco((a) => ({ ...a, cidade: t }))} erro={erros.cidade} placeholder="Cidade" />
          <CampoTexto rotulo="UF" value={endereco.uf} onChangeText={(t) => setEndereco((a) => ({ ...a, uf: t.slice(0, 2).toUpperCase() }))} erro={erros.uf} placeholder="UF" autoCapitalize="characters" />
          <CampoTexto rotulo="Ponto de referência" value={endereco.referencia} onChangeText={(t) => setEndereco((a) => ({ ...a, referencia: t }))} placeholder="Próximo a..." />
        </View>
      )}

      <View style={{ marginTop: 8 }}>
        <Botao titulo="Criar conta" onPress={criarConta} carregando={enviando} />
      </View>

      <View style={estilos.rodape}>
        <Text style={estilos.texto}>Já tem conta? </Text>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="link">
          <Text style={estilos.link}>Entrar</Text>
        </Pressable>
      </View>
    </TelaAuth>
  );
}

const estilos = StyleSheet.create({
  enderecoTitulo: { marginTop: 10, height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 13, backgroundColor: cores.superficie, borderWidth: 1, borderColor: cores.bordaCard, paddingHorizontal: 14 },
  enderecoTexto: { fontFamily: fontes.semibold, fontSize: 13, color: cores.texto },
  enderecoAcao: { fontFamily: fontes.bold, fontSize: 12, color: cores.primaria },
  enderecoBloco: { marginTop: 8 },
  rodape: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  texto: { fontFamily: fontes.regular, fontSize: 14, color: cores.textoSuave },
  link: { fontFamily: fontes.bold, fontSize: 14, color: cores.primaria },
});
