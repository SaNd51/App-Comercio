// Tela provisória para abas que ainda serão construídas (Promoções, Vitrine).
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CabecalhoLoja } from '../components/CabecalhoLoja';
import { EstadoMensagem } from '../components/EstadoMensagem';
import { selecionarContagem, useCarrinho } from '../store/carrinho';
import { cores } from '../theme';

export function EmBreveScreen({ titulo, icone, onMenu, onCarrinho }: { titulo: string; icone: React.ComponentProps<typeof Ionicons>['name']; onMenu: () => void; onCarrinho: () => void }) {
  const contador = useCarrinho(selecionarContagem);
  return (
    <View style={estilos.tela}>
      <CabecalhoLoja contadorCarrinho={contador} onMenu={onMenu} onCarrinho={onCarrinho} />
      <EstadoMensagem icone={icone} titulo={`${titulo} em breve`} texto="Esta área será liberada em uma próxima versão." />
    </View>
  );
}

const estilos = StyleSheet.create({ tela: { flex: 1, backgroundColor: cores.fundo } });
