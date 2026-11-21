// Detalhe do produto: imagem, nome, descrição, preço, seletor de quantidade e "Adicionar ao carrinho".
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Botao } from '../components/Botao';
import { SeletorQuantidade } from '../components/SeletorQuantidade';
import { useToast } from '../contexts/ToastContext';
import { useAdicionarAoCarrinho } from '../hooks/useAdicionarAoCarrinho';
import { AppStackParams } from '../navigation/tipos';
import { ApiError, api } from '../services/api';
import { selecionarContagem, useCarrinho } from '../store/carrinho';
import { cores, fontes } from '../theme';
import { Produto } from '../types';
import { formatarPreco } from '../utils/formatar';

export function ProdutoDetalheScreen({ navigation, route }: NativeStackScreenProps<AppStackParams, 'ProdutoDetalhe'>) {
  const insets = useSafeAreaInsets();
  const { mostrar } = useToast();
  const adicionar = useAdicionarAoCarrinho();
  const contador = useCarrinho(selecionarContagem);

  // Começa com os dados da lista (aparece na hora) e atualiza com a API.
  const [produto, setProduto] = useState<Produto>(route.params.produto);
  const [quantidade, setQuantidade] = useState(1);

  useEffect(() => {
    let ativo = true;
    api<{ produto: Produto }>(`/products/${route.params.produto.id}`)
      .then((r) => {
        if (!ativo) return;
        setProduto(r.produto);
        setQuantidade((q) => Math.max(1, Math.min(q, r.produto.estoque || 1)));
      })
      .catch((e) => {
        if (ativo && e instanceof ApiError && e.status === 404) {
          mostrar('Este produto não está mais disponível.', 'erro');
          navigation.goBack();
        }
      });
    return () => {
      ativo = false;
    };
  }, [route.params.produto.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const esgotado = produto.estoque <= 0;
  const total = (produto.precoEfetivo ?? produto.preco) * quantidade;

  function aoAdicionar() {
    if (adicionar(produto, quantidade)) navigation.goBack();
  }

  return (
    <View style={estilos.tela}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={[estilos.topo, { paddingTop: insets.top + 8 }]}>
          <View style={estilos.barra}>
            <Pressable onPress={() => navigation.goBack()} style={estilos.botaoIcone} accessibilityLabel="Voltar">
              <Ionicons name="chevron-back" size={22} color={cores.texto} />
            </Pressable>
            <Pressable onPress={() => navigation.navigate('Carrinho')} style={estilos.botaoIcone} accessibilityLabel={`Carrinho, ${contador} itens`}>
              <Ionicons name="cart-outline" size={22} color={cores.texto} />
              {contador > 0 && (
                <View style={estilos.selo}>
                  <Text style={estilos.seloTexto}>{contador > 99 ? '99+' : contador}</Text>
                </View>
              )}
            </Pressable>
          </View>
          <View style={estilos.foto}>
            {produto.imagemUrl ? (
              <Image source={{ uri: produto.imagemUrl }} style={estilos.imagem} resizeMode="contain" />
            ) : (
              <Ionicons name="image-outline" size={72} color={cores.ponto} />
            )}
          </View>
        </View>

        <View style={estilos.corpo}>
          <Text style={estilos.categoria}>{produto.categoria.nome.toUpperCase()}</Text>
          <Text style={estilos.nome}>{produto.nome}</Text>

          <View style={estilos.preco}>
            <Text style={estilos.moeda}>R$</Text>
            <Text style={estilos.valor}>{formatarPreco(produto.preco)}</Text>
          </View>

          {esgotado ? (
            <Text style={[estilos.estoque, { color: cores.erro }]}>Produto esgotado</Text>
          ) : produto.estoque <= 5 ? (
            <Text style={[estilos.estoque, { color: cores.primariaTexto }]}>
              {produto.estoque === 1 ? 'Última unidade!' : `Restam apenas ${produto.estoque} unidades`}
            </Text>
          ) : null}

          {!!produto.descricao && (
            <>
              <Text style={estilos.secao}>Descrição</Text>
              <Text style={estilos.descricao}>{produto.descricao}</Text>
            </>
          )}
        </View>
      </ScrollView>

      <View style={[estilos.rodape, { paddingBottom: insets.bottom + 12 }]}>
        <SeletorQuantidade valor={quantidade} onChange={setQuantidade} min={1} max={Math.max(1, produto.estoque)} />
        <View style={{ flex: 1 }}>
          <Botao
            titulo={esgotado ? 'Produto esgotado' : `Adicionar · R$ ${formatarPreco(total)}`}
            onPress={aoAdicionar}
            desabilitado={esgotado}
          />
        </View>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  topo: { backgroundColor: cores.superficie, paddingHorizontal: 20, paddingBottom: 16 },
  barra: { flexDirection: 'row', justifyContent: 'space-between' },
  botaoIcone: { width: 42, height: 42, borderRadius: 14, backgroundColor: cores.botaoIcone, alignItems: 'center', justifyContent: 'center' },
  selo: { position: 'absolute', top: -1, right: -3, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: cores.primaria, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  seloTexto: { color: '#fff', fontFamily: fontes.bold, fontSize: 10 },
  foto: { height: 260, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  imagem: { width: '100%', height: '100%' },
  corpo: { paddingHorizontal: 20, paddingTop: 20 },
  categoria: { fontFamily: fontes.bold, fontSize: 11, letterSpacing: 0.8, color: cores.textoSuave },
  nome: { marginTop: 6, fontFamily: fontes.bold, fontSize: 22, lineHeight: 28, color: cores.texto },
  preco: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 12 },
  moeda: { fontFamily: fontes.medium, fontSize: 14, color: cores.primaria },
  valor: { fontFamily: fontes.bold, fontSize: 34, color: cores.primaria },
  estoque: { marginTop: 6, fontFamily: fontes.semibold, fontSize: 12 },
  secao: { marginTop: 22, fontFamily: fontes.bold, fontSize: 14, color: cores.texto },
  descricao: { marginTop: 6, fontFamily: fontes.regular, fontSize: 13, lineHeight: 20, color: cores.textoSuave },
  rodape: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 12, backgroundColor: cores.superficie, borderTopWidth: 1, borderTopColor: cores.bordaNav },
});
