import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { cores, fontes, raio } from '../theme';

interface Props {
  titulo: string;
  onPress: () => void;
  carregando?: boolean;
  desabilitado?: boolean;
}

export function Botao({ titulo, onPress, carregando, desabilitado }: Props) {
  const inativo = carregando || desabilitado;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={inativo}
      style={({ pressed }) => [estilos.botao, inativo && estilos.inativo, pressed && { opacity: 0.85 }]}
    >
      {carregando ? <ActivityIndicator color="#fff" /> : <Text style={estilos.texto}>{titulo}</Text>}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  botao: { height: 50, borderRadius: raio.campo, backgroundColor: cores.primaria, alignItems: 'center', justifyContent: 'center' },
  inativo: { opacity: 0.6 },
  texto: { color: '#fff', fontFamily: fontes.bold, fontSize: 15 },
});
