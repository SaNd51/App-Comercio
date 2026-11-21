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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginScreen({ navigation }: NativeStackScreenProps<AuthStackParams, 'Login'>) {
  const { login } = useAuth();
  const { mostrar } = useToast();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erros, setErros] = useState<{ email?: string; senha?: string }>({});
  const [enviando, setEnviando] = useState(false);

  function validar() {
    const e: { email?: string; senha?: string } = {};
    if (!email.trim()) e.email = 'Informe seu e-mail';
    else if (!EMAIL_RE.test(email.trim())) e.email = 'E-mail inválido';
    if (!senha) e.senha = 'Informe sua senha';
    setErros(e);
    return Object.keys(e).length === 0;
  }

  async function entrar() {
    if (!validar()) return;
    setEnviando(true);
    try {
      await login(email.trim(), senha);
      // Sucesso: o navegador troca de pilha sozinho (cliente → Início, admin → Painel Admin).
    } catch (err) {
      setErros(errosPorCampo(err));
      mostrar(mensagemDeErro(err), 'erro');
      setEnviando(false);
    }
  }

  return (
    <TelaAuth titulo="Entrar" subtitulo="Acesse sua conta para fazer pedidos.">
      <CampoTexto
        rotulo="E-mail"
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          setErros((e) => ({ ...e, email: undefined }));
        }}
        erro={erros.email}
        placeholder="voce@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
      />
      <CampoTexto
        rotulo="Senha"
        value={senha}
        onChangeText={(t) => {
          setSenha(t);
          setErros((e) => ({ ...e, senha: undefined }));
        }}
        erro={erros.senha}
        placeholder="Sua senha"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="password"
        onSubmitEditing={entrar}
        returnKeyType="go"
      />

      <View style={{ marginTop: 8 }}>
        <Botao titulo="Entrar" onPress={entrar} carregando={enviando} />
      </View>

      <View style={estilos.rodape}>
        <Text style={estilos.texto}>Não tem conta? </Text>
        <Pressable onPress={() => navigation.navigate('Registrar')} hitSlop={10} accessibilityRole="link">
          <Text style={estilos.link}>Criar conta</Text>
        </Pressable>
      </View>
    </TelaAuth>
  );
}

const estilos = StyleSheet.create({
  rodape: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  texto: { fontFamily: fontes.regular, fontSize: 14, color: cores.textoSuave },
  link: { fontFamily: fontes.bold, fontSize: 14, color: cores.primaria },
});
