// Formulário de produto (admin): cadastro e edição.
// Campos: nome, categoria, preço, estoque, descrição, imagem (link) e status ativo/inativo.
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Botao } from '../components/Botao';
import { CampoPreco } from '../components/CampoPreco';
import { CampoTexto } from '../components/CampoTexto';
import { useToast } from '../contexts/ToastContext';
import { AppStackParams } from '../navigation/tipos';
import { api } from '../services/api';
import { cores, fontes, raio } from '../theme';
import { Categoria } from '../types';
import { errosPorCampo, mensagemDeErro } from '../utils/erros';
import { ErrosProduto, validarProduto } from '../utils/validarProduto';

export function ProdutoFormScreen({ navigation, route }: NativeStackScreenProps<AppStackParams, 'ProdutoForm'>) {
  const insets = useSafeAreaInsets();
  const { mostrar } = useToast();
  const produto = route.params?.produto;
  const editando = !!produto;

  const [nome, setNome] = useState(produto?.nome ?? '');
  const [categoriaId, setCategoriaId] = useState<string | null>(produto?.categoriaId ?? null);
  const [preco, setPreco] = useState(produto?.preco ?? 0); // centavos
  const [estoque, setEstoque] = useState(produto ? String(produto.estoque) : '');
  const [descricao, setDescricao] = useState(produto?.descricao ?? '');
  const [imagemUrl, setImagemUrl] = useState(produto?.imagemUrl ?? '');
  const [ativo, setAtivo] = useState(produto ? produto.status === 'ativo' : true);

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriasErro, setCategoriasErro] = useState(false);
  const [erros, setErros] = useState<ErrosProduto>({});
  const [imagemFalhou, setImagemFalhou] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  function carregarCategorias() {
    setCategoriasErro(false);
    api<{ categorias: Categoria[] }>('/categories')
      .then((r) => setCategorias(r.categorias))
      .catch(() => setCategoriasErro(true));
  }
  useEffect(carregarCategorias, []);

  const limpar = (campo: keyof ErrosProduto) => setErros((e) => ({ ...e, [campo]: undefined }));

  async function salvar() {
    const e = validarProduto({ nome, preco, categoriaId, estoque, descricao, imagemUrl });
    setErros(e);
    if (Object.keys(e).length > 0) {
      mostrar('Confira os campos destacados.', 'erro');
      return;
    }

    setSalvando(true);
    const corpo = {
      nome: nome.trim(),
      preco, // centavos
      categoriaId,
      descricao: descricao.trim(),
      imagemUrl: imagemUrl.trim() || null,
      estoque: estoque.trim() === '' ? 0 : Number(estoque),
      status: ativo ? 'ativo' : 'inativo',
    };
    try {
      if (editando) await api(`/products/${produto!.id}`, { method: 'PUT', body: corpo });
      else await api('/products', { method: 'POST', body: corpo });
      mostrar(editando ? 'Produto atualizado.' : 'Produto cadastrado.', 'sucesso');
      navigation.goBack();
    } catch (err) {
      const porCampo = errosPorCampo(err);
      setErros({
        nome: porCampo.nome,
        preco: porCampo.preco,
        categoriaId: porCampo.categoriaId,
        estoque: porCampo.estoque,
        descricao: porCampo.descricao,
        imagemUrl: porCampo.imagemUrl,
      });
      mostrar(mensagemDeErro(err), 'erro');
      setSalvando(false);
    }
  }

  async function excluir() {
    setExcluindo(true);
    try {
      const r = await api<{ acao: 'removido' | 'inativado' }>(`/products/${produto!.id}`, { method: 'DELETE' });
      mostrar(r.acao === 'inativado' ? 'Produto já estava em pedidos: foi inativado em vez de excluído.' : 'Produto excluído.', r.acao === 'inativado' ? 'info' : 'sucesso');
      navigation.goBack();
    } catch (err) {
      mostrar(mensagemDeErro(err), 'erro');
      setExcluindo(false);
      setConfirmandoExclusao(false);
    }
  }

  const urlParaPreview = /^https?:\/\/\S+$/i.test(imagemUrl.trim()) ? imagemUrl.trim() : null;

  return (
    <KeyboardAvoidingView style={estilos.tela} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[estilos.topo, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} style={estilos.voltar} accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={22} color={cores.texto} />
        </Pressable>
        <Text style={estilos.titulo}>{editando ? 'Editar produto' : 'Novo produto'}</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32 }} keyboardShouldPersistTaps="handled">
        <CampoTexto
          rotulo="Nome"
          value={nome}
          onChangeText={(t) => { setNome(t); limpar('nome'); }}
          erro={erros.nome}
          placeholder="Ex.: Açúcar refinado 1 kg"
          maxLength={120}
        />

        <View style={estilos.grupo}>
          <Text style={estilos.rotulo}>Categoria</Text>
          {categoriasErro ? (
            <Pressable onPress={carregarCategorias}>
              <Text style={estilos.erroTexto}>Não foi possível carregar as categorias. Toque para tentar de novo.</Text>
            </Pressable>
          ) : categorias.length === 0 ? (
            <ActivityIndicator color={cores.primaria} style={{ alignSelf: 'flex-start' }} />
          ) : (
            <View style={estilos.chips}>
              {categorias.map((c) => {
                const sel = c.id === categoriaId;
                return (
                  <Pressable key={c.id} onPress={() => { setCategoriaId(c.id); limpar('categoriaId'); }} style={[estilos.chip, sel && estilos.chipAtivo]} accessibilityRole="button" accessibilityState={{ selected: sel }}>
                    <Text style={[estilos.chipTexto, sel && { color: cores.primaria }]}>{c.nome}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
          {!!erros.categoriaId && <Text style={estilos.erroTexto}>{erros.categoriaId}</Text>}
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1.2 }}>
            <CampoPreco rotulo="Preço" centavos={preco} onChange={(c) => { setPreco(c); limpar('preco'); }} erro={erros.preco} />
          </View>
          <View style={{ flex: 1 }}>
            <CampoTexto
              rotulo="Estoque"
              value={estoque}
              onChangeText={(t) => { setEstoque(t.replace(/\D/g, '').slice(0, 7)); limpar('estoque'); }}
              erro={erros.estoque}
              placeholder="0"
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View style={estilos.grupo}>
          <Text style={estilos.rotulo}>Descrição</Text>
          <TextInput
            value={descricao}
            onChangeText={(t) => { setDescricao(t); limpar('descricao'); }}
            placeholder="Detalhes do produto (opcional)"
            placeholderTextColor={cores.placeholder}
            multiline
            textAlignVertical="top"
            maxLength={1000}
            style={[estilos.area, !!erros.descricao && estilos.areaErro]}
            accessibilityLabel="Descrição"
          />
          {!!erros.descricao && <Text style={estilos.erroTexto}>{erros.descricao}</Text>}
        </View>

        <CampoTexto
          rotulo="Imagem (link)"
          value={imagemUrl}
          onChangeText={(t) => { setImagemUrl(t); setImagemFalhou(false); limpar('imagemUrl'); }}
          erro={erros.imagemUrl}
          dica="Cole o endereço de uma imagem (https://...). Opcional."
          placeholder="https://..."
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {urlParaPreview && (
          <View style={estilos.preview}>
            {imagemFalhou ? (
              <Text style={estilos.erroTexto}>Não foi possível carregar esta imagem.</Text>
            ) : (
              <Image source={{ uri: urlParaPreview }} style={{ width: '100%', height: '100%' }} resizeMode="contain" onError={() => setImagemFalhou(true)} />
            )}
          </View>
        )}

        <View style={estilos.status}>
          <View style={{ flex: 1 }}>
            <Text style={estilos.statusTitulo}>{ativo ? 'Produto ativo' : 'Produto inativo'}</Text>
            <Text style={estilos.statusDica}>
              {ativo ? 'Aparece na loja para os clientes.' : 'Fica escondido dos clientes.'}
            </Text>
          </View>
          <Switch value={ativo} onValueChange={setAtivo} trackColor={{ false: cores.ponto, true: cores.sucesso }} thumbColor="#fff" accessibilityLabel="Produto ativo" />
        </View>

        <View style={{ marginTop: 20 }}>
          <Botao titulo={editando ? 'Salvar alterações' : 'Cadastrar produto'} onPress={salvar} carregando={salvando} desabilitado={excluindo} />
        </View>

        {editando &&
          (confirmandoExclusao ? (
            <View style={estilos.confirmacao}>
              <Text style={estilos.confirmacaoTexto}>
                Excluir este produto? Se ele já estiver em pedidos, será apenas inativado.
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable onPress={() => setConfirmandoExclusao(false)} disabled={excluindo} style={[estilos.botaoSec, { flex: 1 }]}>
                  <Text style={estilos.botaoSecTexto}>Manter</Text>
                </Pressable>
                <Pressable onPress={excluir} disabled={excluindo} style={[estilos.botaoPerigo, { flex: 1 }]}>
                  {excluindo ? <ActivityIndicator color="#fff" /> : <Text style={estilos.botaoPerigoTexto}>Sim, excluir</Text>}
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable onPress={() => setConfirmandoExclusao(true)} style={{ alignItems: 'center', padding: 16 }} hitSlop={8}>
              <Text style={estilos.excluirLink}>Excluir produto</Text>
            </Pressable>
          ))}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12, backgroundColor: cores.superficie },
  voltar: { width: 42, height: 42, borderRadius: 14, backgroundColor: cores.botaoIcone, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontFamily: fontes.bold, fontSize: 18, color: cores.texto },
  grupo: { marginBottom: 16 },
  rotulo: { fontFamily: fontes.semibold, fontSize: 13, color: cores.texto, marginBottom: 6 },
  erroTexto: { marginTop: 5, fontFamily: fontes.medium, fontSize: 12, color: cores.erro },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, height: 36, borderRadius: 999, backgroundColor: cores.superficie, borderWidth: 1, borderColor: cores.bordaCard, alignItems: 'center', justifyContent: 'center' },
  chipAtivo: { backgroundColor: cores.primariaClara, borderColor: cores.primaria },
  chipTexto: { fontFamily: fontes.semibold, fontSize: 12, color: cores.textoMuted },
  area: { minHeight: 96, padding: 14, backgroundColor: cores.campo, borderWidth: 1, borderColor: cores.bordaCampo, borderRadius: raio.campo, fontFamily: fontes.regular, fontSize: 14, color: cores.texto },
  areaErro: { borderColor: cores.erro, backgroundColor: '#FFF5F5' },
  preview: { height: 140, marginBottom: 16, borderRadius: raio.campo, backgroundColor: cores.superficie, borderWidth: 1, borderColor: cores.bordaCard, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 8 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: cores.superficie, borderWidth: 1, borderColor: cores.bordaCard, borderRadius: raio.card },
  statusTitulo: { fontFamily: fontes.semibold, fontSize: 14, color: cores.texto },
  statusDica: { marginTop: 2, fontFamily: fontes.regular, fontSize: 12, color: cores.textoSuave },
  confirmacao: { marginTop: 16, gap: 12 },
  confirmacaoTexto: { fontFamily: fontes.semibold, fontSize: 13, color: cores.texto, textAlign: 'center' },
  botaoSec: { height: 48, borderRadius: raio.campo, borderWidth: 1.5, borderColor: cores.bordaCampo, backgroundColor: cores.superficie, alignItems: 'center', justifyContent: 'center' },
  botaoSecTexto: { fontFamily: fontes.bold, fontSize: 14, color: cores.textoMuted },
  botaoPerigo: { height: 48, borderRadius: raio.campo, backgroundColor: cores.erro, alignItems: 'center', justifyContent: 'center' },
  botaoPerigoTexto: { fontFamily: fontes.bold, fontSize: 14, color: '#fff' },
  excluirLink: { fontFamily: fontes.semibold, fontSize: 13, color: cores.erro, textDecorationLine: 'underline' },
});
