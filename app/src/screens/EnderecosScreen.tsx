import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Botao } from '../components/Botao';
import { CampoTexto } from '../components/CampoTexto';
import { AppStackParams } from '../navigation/tipos';
import { api } from '../services/api';
import { cores, fontes, raio } from '../theme';
import { Endereco } from '../types';

const vazio = { apelido: 'Casa', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '', referencia: '' };

export function EnderecosScreen({ navigation }: NativeStackScreenProps<AppStackParams, 'Enderecos'>) {
  const insets = useSafeAreaInsets();
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [form, setForm] = useState(vazio);
  const [editarId, setEditarId] = useState<string | null>(null);
  const [novo, setNovo] = useState(false);

  async function carregar() {
    const r = await api<{ enderecos: Endereco[] }>('/addresses');
    setEnderecos(r.enderecos);
  }
  useEffect(() => { carregar().catch(() => {}); }, []);

  async function salvar() {
    const dados = { ...form, cep: form.cep.replace(/\D/g, '') };
    if (editarId) await api(`/addresses/${editarId}`, { method: 'PUT', body: dados });
    else await api('/addresses', { method: 'POST', body: dados });
    setNovo(false);
    setEditarId(null);
    setForm(vazio);
    await carregar();
  }

  async function excluir(id: string) {
    await api(`/addresses/${id}`, { method: 'DELETE' });
    await carregar();
  }

  async function principal(id: string) {
    await api(`/addresses/${id}/principal`, { method: 'PATCH' });
    await carregar();
  }

  return (
    <View style={estilos.tela}>
      <View style={[estilos.topo, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} style={estilos.icone} accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={22} color={cores.texto} />
        </Pressable>
        <Text style={estilos.titulo}>Meus endereços</Text>
      </View>
      <ScrollView contentContainerStyle={estilos.corpo}>
        {enderecos.map((endereco) => (
          <View key={endereco.id} style={estilos.card}>
            <View style={{ flex: 1 }}>
              <Text style={estilos.apelido}>{endereco.apelido}{endereco.principal ? ' · Principal' : ''}</Text>
              <Text style={estilos.texto}>{endereco.logradouro}, {endereco.numero}{endereco.complemento ? `, ${endereco.complemento}` : ''}</Text>
              <Text style={estilos.texto}>{endereco.bairro} · {endereco.cidade}/{endereco.uf} · CEP {endereco.cep}</Text>
            </View>
            <Pressable
              onPress={() => {
                setEditarId(endereco.id);
                setNovo(false);
                setForm({
                  apelido: endereco.apelido,
                  cep: endereco.cep,
                  logradouro: endereco.logradouro,
                  numero: endereco.numero,
                  complemento: endereco.complemento,
                  bairro: endereco.bairro,
                  cidade: endereco.cidade,
                  uf: endereco.uf,
                  referencia: endereco.referencia,
                });
              }}
              hitSlop={8}
            >
              <Ionicons name="create-outline" size={20} color={cores.textoMuted} />
            </Pressable>
            <Pressable onPress={() => principal(endereco.id)} disabled={endereco.principal} hitSlop={8}>
              <Ionicons name={endereco.principal ? 'star' : 'star-outline'} size={20} color={endereco.principal ? cores.primaria : cores.navInativo} />
            </Pressable>
            <Pressable onPress={() => excluir(endereco.id)} hitSlop={8}>
              <Ionicons name="trash-outline" size={20} color={cores.erro} />
            </Pressable>
          </View>
        ))}

        {(novo || editarId) && (
          <View style={estilos.formulario}>
            <CampoTexto rotulo="Apelido" value={form.apelido} onChangeText={(v) => setForm((a) => ({ ...a, apelido: v }))} />
            <CampoTexto rotulo="CEP" value={form.cep} onChangeText={(v) => setForm((a) => ({ ...a, cep: v }))} keyboardType="number-pad" />
            <CampoTexto rotulo="Rua" value={form.logradouro} onChangeText={(v) => setForm((a) => ({ ...a, logradouro: v }))} />
            <CampoTexto rotulo="Número" value={form.numero} onChangeText={(v) => setForm((a) => ({ ...a, numero: v }))} />
            <CampoTexto rotulo="Complemento" value={form.complemento} onChangeText={(v) => setForm((a) => ({ ...a, complemento: v }))} />
            <CampoTexto rotulo="Bairro" value={form.bairro} onChangeText={(v) => setForm((a) => ({ ...a, bairro: v }))} />
            <CampoTexto rotulo="Cidade" value={form.cidade} onChangeText={(v) => setForm((a) => ({ ...a, cidade: v }))} />
            <CampoTexto rotulo="UF" value={form.uf} onChangeText={(v) => setForm((a) => ({ ...a, uf: v.slice(0, 2).toUpperCase() }))} />
            <CampoTexto rotulo="Ponto de referência" value={form.referencia} onChangeText={(v) => setForm((a) => ({ ...a, referencia: v }))} />
            <Botao titulo="Salvar endereço" onPress={salvar} />
          </View>
        )}
        {!novo && !editarId && enderecos.length < 5 && (
          <Botao titulo="Adicionar endereço" onPress={() => { setForm(vazio); setNovo(true); }} />
        )}
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  topo: { height: 64, backgroundColor: cores.superficie, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 12 },
  icone: { width: 42, height: 42, borderRadius: 14, backgroundColor: cores.botaoIcone, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontFamily: fontes.bold, fontSize: 18, color: cores.texto },
  corpo: { padding: 20, gap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: cores.superficie, borderRadius: raio.card, borderWidth: 1, borderColor: cores.bordaCard, padding: 14 },
  apelido: { fontFamily: fontes.bold, fontSize: 14, color: cores.texto },
  texto: { marginTop: 3, fontFamily: fontes.regular, fontSize: 11, color: cores.textoSuave },
  formulario: { backgroundColor: cores.superficie, borderRadius: raio.card, padding: 14, gap: 4 },
});
