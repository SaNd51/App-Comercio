// Cartão de produto (Figma): foto, nome, categoria, preço grande em vermelho e botão "+".
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { cores, fontes, raio } from '../theme';
import { Produto } from '../types';
import { formatarPreco } from '../utils/formatar';

interface Props {
  produto: Produto;
  onPress: (p: Produto) => void;
  onAdicionar: (p: Produto) => void;
  onFavoritar?: (p: Produto) => void;
}

export function ProdutoCard({ produto, onPress, onAdicionar, onFavoritar }: Props) {
  const { width } = useWindowDimensions();
  const largura = (width - 20 * 2 - 12) / 2; // 2 colunas, margem 20 e espaço 12
  const esgotado = produto.estoque <= 0;

  return (
    <Pressable
      onPress={() => onPress(produto)}
      style={[estilos.card, { width: largura }]}
      accessibilityRole="button"
      accessibilityLabel={`${produto.nome}, R$ ${formatarPreco(produto.precoEfetivo ?? produto.preco)}`}
    >
      {produto.emOferta && (
        <View style={estilos.seloOferta}>
          <Text style={estilos.seloOfertaTexto}>OFERTA</Text>
        </View>
      )}
      {onFavoritar && (
        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            onFavoritar(produto);
          }}
          hitSlop={8}
          style={estilos.favorito}
          accessibilityLabel={produto.favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <Ionicons name={produto.favorito ? 'heart' : 'heart-outline'} size={20} color={produto.favorito ? cores.primaria : cores.textoMuted} />
        </Pressable>
      )}
      <View style={estilos.foto}>
        {produto.imagemUrl ? (
          <Image source={{ uri: produto.imagemUrl }} style={estilos.imagem} resizeMode="contain" />
        ) : (
          <Ionicons name="image-outline" size={40} color={cores.ponto} />
        )}
      </View>

      <Text style={estilos.nome} numberOfLines={2}>
        {produto.nome}
      </Text>
      <Text style={estilos.categoria} numberOfLines={1}>
        {esgotado ? 'Esgotado' : (produto.unidade || produto.categoria.nome)}
      </Text>

      <View style={estilos.rodape}>
        <View style={estilos.preco}>
          <Text style={estilos.moeda}>R$</Text>
          <View>
            {produto.emOferta && (
              <Text style={estilos.precoAntigo}>R$ {formatarPreco(produto.preco)}</Text>
            )}
            <Text style={estilos.valor}>{formatarPreco(produto.precoEfetivo ?? produto.preco)}</Text>
          </View>
        </View>
        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            onAdicionar(produto);
          }}
          disabled={esgotado}
          style={[estilos.mais, esgotado && { backgroundColor: cores.ponto }]}
          accessibilityLabel={`Adicionar ${produto.nome} à cesta`}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </Pressable>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  card: { height: 238, overflow: 'hidden', backgroundColor: cores.superficie, borderWidth: 1, borderColor: cores.bordaCard, borderRadius: raio.card, padding: 11, marginBottom: 12 },
  seloOferta: { position: 'absolute', top: 8, left: 8, zIndex: 2, height: 20, borderRadius: 6, paddingHorizontal: 7, backgroundColor: cores.primariaClara, justifyContent: 'center' },
  seloOfertaTexto: { fontFamily: fontes.bold, fontSize: 9, color: cores.primariaTexto },
  favorito: { position: 'absolute', top: 8, right: 8, zIndex: 2, width: 30, height: 30, borderRadius: 15, backgroundColor: cores.superficie, alignItems: 'center', justifyContent: 'center' },
  foto: { height: 122, alignItems: 'center', justifyContent: 'center' },
  imagem: { width: '100%', height: '100%' },
  nome: { marginTop: 10, minHeight: 32, fontFamily: fontes.semibold, fontSize: 11, lineHeight: 16, color: cores.texto },
  categoria: { marginTop: 6, fontFamily: fontes.regular, fontSize: 11, color: cores.textoSuave },
  rodape: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  preco: { flexDirection: 'row', alignItems: 'baseline', gap: 3, flexShrink: 1 },
  precoAntigo: { fontFamily: fontes.regular, fontSize: 9, color: cores.textoSuave, textDecorationLine: 'line-through' },
  moeda: { fontFamily: fontes.medium, fontSize: 11, color: cores.primaria },
  valor: { fontFamily: fontes.bold, fontSize: 22, color: cores.primaria },
  mais: { width: 34, height: 34, borderRadius: raio.botaoMais, backgroundColor: cores.primaria, alignItems: 'center', justifyContent: 'center' },
});
