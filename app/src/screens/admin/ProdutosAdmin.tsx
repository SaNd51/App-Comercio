// Painel Admin → Produtos: busca, filtro por categoria e por status, switch ativar/desativar,
// "Novo produto" e edição ao tocar na linha. Produtos inativos não aparecem para os clientes.
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { ChipsFiltro } from '../../components/ChipsFiltro';
import { EstadoMensagem } from '../../components/EstadoMensagem';
import { useToast } from '../../contexts/ToastContext';
import { useDebounce } from '../../hooks/useDebounce';
import { useListaPaginada } from '../../hooks/useListaPaginada';
import { AppStackParams } from '../../navigation/tipos';
import { api } from '../../services/api';
import { cores, fontes, raio } from '../../theme';
import { Categoria, ListaProdutos, Produto } from '../../types';
import { mensagemDeErro } from '../../utils/erros';
import { formatarPreco } from '../../utils/formatar';

type StatusFiltro = 'todos' | 'ativo' | 'inativo';
const OPCOES_STATUS: { valor: StatusFiltro; rotulo: string }[] = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'ativo', rotulo: 'Ativos' },
  { valor: 'inativo', rotulo: 'Inativos' },
];

export function ProdutosAdmin() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParams>>();
  const { mostrar } = useToast();

  const [busca, setBusca] = useState('');
  const buscaDebounced = useDebounce(busca.trim(), 400);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFiltro>('todos');
  const [ocupados, setOcupados] = useState<string[]>([]); // produtos com troca de status em andamento

  useEffect(() => {
    api<{ categorias: Categoria[] }>('/categories')
      .then((r) => setCategorias(r.categorias))
      .catch(() => {});
  }, []);

  const buscarPagina = useCallback(
    async (pagina: number) => {
      const r = await api<ListaProdutos>('/products', {
        query: { search: buscaDebounced, category: categoriaId, status, page: pagina, limit: 20 },
      });
      return { itens: r.itens, totalPaginas: r.paginacao.totalPaginas };
    },
    [buscaDebounced, categoriaId, status],
  );
  const lista = useListaPaginada<Produto>(buscarPagina);

  // Atualiza a tela na hora e desfaz se a API recusar.
  async function alternar(p: Produto) {
    if (ocupados.includes(p.id)) return;
    const novo = p.status === 'ativo' ? 'inativo' : 'ativo';
    const trocar = (s: Produto['status']) => lista.setItens((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: s } : x)));

    setOcupados((o) => [...o, p.id]);
    trocar(novo);
    try {
      await api(`/products/${p.id}/status`, { method: 'PATCH', body: { status: novo } });
      mostrar(novo === 'ativo' ? 'Produto ativado.' : 'Produto desativado: some da loja para os clientes.', 'sucesso');
    } catch (e) {
      trocar(p.status);
      mostrar(mensagemDeErro(e), 'erro');
    } finally {
      setOcupados((o) => o.filter((id) => id !== p.id));
    }
  }

  const filtrando = !!buscaDebounced || !!categoriaId || status !== 'todos';

  return (
    <View style={{ flex: 1 }}>
      <View style={estilos.barra}>
        <View style={estilos.busca}>
          <Ionicons name="search-outline" size={19} color={cores.placeholder} />
          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar produto"
            placeholderTextColor={cores.placeholder}
            style={estilos.buscaInput}
            autoCorrect={false}
            accessibilityLabel="Buscar produto"
          />
          {!!busca && (
            <Pressable onPress={() => setBusca('')} hitSlop={10} accessibilityLabel="Limpar busca">
              <Ionicons name="close-circle" size={18} color={cores.placeholder} />
            </Pressable>
          )}
        </View>
        <Pressable onPress={() => navigation.navigate('ProdutoForm', {})} style={estilos.novo} accessibilityRole="button" accessibilityLabel="Novo produto">
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={estilos.novoTexto}>Novo</Text>
        </Pressable>
      </View>

      <ChipsFiltro<string | null>
        opcoes={[{ valor: null, rotulo: 'Todas as categorias' }, ...categorias.map((c) => ({ valor: c.id as string | null, rotulo: c.nome }))]}
        valor={categoriaId}
        onChange={setCategoriaId}
      />
      <View style={{ height: 8 }} />
      <ChipsFiltro<StatusFiltro> opcoes={OPCOES_STATUS} valor={status} onChange={setStatus} />

      <FlatList
        data={lista.estado === 'ok' ? lista.itens : []}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 32, flexGrow: 1 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        refreshControl={<RefreshControl refreshing={lista.atualizando} onRefresh={() => lista.recarregar('refresh')} tintColor={cores.primaria} colors={[cores.primaria]} />}
        onEndReached={lista.carregarMais}
        onEndReachedThreshold={0.4}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <LinhaProduto
            produto={item}
            ocupado={ocupados.includes(item.id)}
            onEditar={() => navigation.navigate('ProdutoForm', { produto: item })}
            onAlternar={() => alternar(item)}
          />
        )}
        ListEmptyComponent={
          lista.estado === 'carregando' ? (
            <ActivityIndicator size="large" color={cores.primaria} style={{ marginTop: 40 }} />
          ) : lista.estado === 'erro' ? (
            <EstadoMensagem icone="cloud-offline-outline" titulo="Não foi possível carregar" texto={lista.mensagemErro} acao={{ rotulo: 'Tentar de novo', onPress: () => lista.recarregar() }} />
          ) : (
            <EstadoMensagem
              icone="cube-outline"
              titulo={filtrando ? 'Nenhum produto com esses filtros' : 'Nenhum produto cadastrado'}
              texto={filtrando ? undefined : 'Toque em "Novo" para cadastrar o primeiro.'}
              acao={
                filtrando
                  ? { rotulo: 'Limpar filtros', onPress: () => { setBusca(''); setCategoriaId(null); setStatus('todos'); } }
                  : undefined
              }
            />
          )
        }
        ListFooterComponent={lista.carregandoMais ? <ActivityIndicator color={cores.primaria} style={{ marginVertical: 16 }} /> : undefined}
      />
    </View>
  );
}

function LinhaProduto({ produto, ocupado, onEditar, onAlternar }: { produto: Produto; ocupado: boolean; onEditar: () => void; onAlternar: () => void }) {
  const ativo = produto.status === 'ativo';
  return (
    <Pressable onPress={onEditar} style={[estilos.linha, !ativo && { opacity: 0.75 }]} accessibilityRole="button" accessibilityLabel={`Editar ${produto.nome}`}>
      <View style={estilos.miniatura}>
        {produto.imagemUrl ? (
          <Image source={{ uri: produto.imagemUrl }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
        ) : (
          <Ionicons name="image-outline" size={22} color={cores.ponto} />
        )}
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <Text style={estilos.nome} numberOfLines={2}>{produto.nome}</Text>
        <Text style={estilos.detalhe} numberOfLines={1}>
          {produto.categoria.nome} · R$ {formatarPreco(produto.preco)}
        </Text>
        <Text style={[estilos.detalhe, produto.estoque <= 0 && { color: cores.erro, fontFamily: fontes.semibold }]}>
          {produto.estoque <= 0 ? 'Sem estoque' : `Estoque: ${produto.estoque}`}
          {!ativo ? '  ·  Inativo' : ''}
        </Text>
      </View>

      <Switch
        value={ativo}
        onValueChange={onAlternar}
        disabled={ocupado}
        trackColor={{ false: cores.ponto, true: cores.sucesso }}
        thumbColor="#fff"
        accessibilityLabel={ativo ? 'Desativar produto' : 'Ativar produto'}
      />
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  barra: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 },
  busca: { flex: 1, height: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, backgroundColor: cores.campo, borderWidth: 1, borderColor: cores.bordaCampo, borderRadius: raio.campo },
  buscaInput: { flex: 1, fontFamily: fontes.regular, fontSize: 13, color: cores.texto, padding: 0 },
  novo: { height: 44, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: cores.primaria, borderRadius: raio.campo },
  novoTexto: { fontFamily: fontes.bold, fontSize: 13, color: '#fff' },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, backgroundColor: cores.superficie, borderWidth: 1, borderColor: cores.bordaCard, borderRadius: raio.card },
  miniatura: { width: 56, height: 56, borderRadius: 12, backgroundColor: cores.fundo, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  nome: { fontFamily: fontes.semibold, fontSize: 13, lineHeight: 18, color: cores.texto },
  detalhe: { fontFamily: fontes.regular, fontSize: 11, color: cores.textoSuave },
});
