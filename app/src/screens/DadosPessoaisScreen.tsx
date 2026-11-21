import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Botao } from '../components/Botao';
import { CampoTexto } from '../components/CampoTexto';
import { useAuth } from '../contexts/AuthContext';
import { AppStackParams } from '../navigation/tipos';
import { api } from '../services/api';
import { cores, fontes, raio } from '../theme';

export function DadosPessoaisScreen({ navigation }: NativeStackScreenProps<AppStackParams, 'DadosPessoais'>) {
  const insets = useSafeAreaInsets();
  const { usuario } = useAuth();
  const [nome, setNome] = useState(usuario?.nome ?? '');
  const [telefone, setTelefone] = useState(usuario?.telefone ?? '');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [senhaNova, setSenhaNova] = useState('');

  async function salvarPerfil() {
    await api('/auth/me', { method: 'PATCH', body: { nome, telefone: telefone || null } });
  }
  async function salvarSenha() {
    await api('/auth/password', { method: 'PATCH', body: { senhaAtual, senhaNova } });
  }

  return (
    <View style={estilos.tela}>
      <View style={[estilos.topo, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} style={estilos.icone} accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={22} color={cores.texto} />
        </Pressable>
        <Text style={estilos.titulo}>Dados pessoais</Text>
      </View>
      <ScrollView contentContainerStyle={estilos.corpo}>
        <View style={estilos.card}>
          <CampoTexto rotulo="Nome" value={nome} onChangeText={setNome} />
          <CampoTexto rotulo="Telefone" value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" />
          <Botao titulo="Salvar dados" onPress={salvarPerfil} />
        </View>
        <View style={estilos.card}>
          <Text style={estilos.secao}>Alterar senha</Text>
          <CampoTexto rotulo="Senha atual" value={senhaAtual} onChangeText={setSenhaAtual} secureTextEntry />
          <CampoTexto rotulo="Nova senha" value={senhaNova} onChangeText={setSenhaNova} secureTextEntry />
          <Botao titulo="Alterar senha" onPress={salvarSenha} />
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  topo: { height: 64, backgroundColor: cores.superficie, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 12 },
  icone: { width: 42, height: 42, borderRadius: raio.botaoIcone, backgroundColor: cores.botaoIcone, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontFamily: fontes.bold, fontSize: 18, color: cores.texto },
  corpo: { padding: 20, gap: 12 },
  card: { backgroundColor: cores.superficie, borderRadius: raio.card, padding: 14 },
  secao: { marginBottom: 8, fontFamily: fontes.bold, fontSize: 16, color: cores.texto },
});
