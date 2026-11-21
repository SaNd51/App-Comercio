// Controle de quantidade (− valor +). Mínimo e máximo configuráveis.
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { cores, fontes } from '../theme';

interface Props {
  valor: number;
  onChange: (novo: number) => void;
  min?: number;
  max?: number;
  compacto?: boolean;
}

export function SeletorQuantidade({ valor, onChange, min = 1, max = 999, compacto }: Props) {
  const tamanho = compacto ? 30 : 38;
  const botao = (nome: 'remove' | 'add', desabilitado: boolean, novo: number, rotulo: string) => (
    <Pressable
      onPress={() => onChange(novo)}
      disabled={desabilitado}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      style={[estilos.botao, { width: tamanho, height: tamanho }, desabilitado && { opacity: 0.4 }]}
    >
      <Ionicons name={nome} size={compacto ? 16 : 20} color={cores.texto} />
    </Pressable>
  );

  return (
    <View style={estilos.linha}>
      {botao('remove', valor <= min, valor - 1, 'Diminuir quantidade')}
      <Text style={[estilos.valor, compacto && { fontSize: 14, minWidth: 26 }]} accessibilityLiveRegion="polite">
        {valor}
      </Text>
      {botao('add', valor >= max, valor + 1, 'Aumentar quantidade')}
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center' },
  botao: { borderRadius: 12, backgroundColor: cores.atalho, alignItems: 'center', justifyContent: 'center' },
  valor: { minWidth: 34, textAlign: 'center', fontFamily: fontes.bold, fontSize: 16, color: cores.texto },
});
