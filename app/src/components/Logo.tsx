import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

export function Logo({ largura = 106, altura = 68 }: { largura?: number; altura?: number }) {
  return (
    <View style={[estilos.caixa, { width: largura, height: altura }]}>
      <Image source={require('../../assets/logo.png')} style={{ width: largura, height: altura }} resizeMode="contain" />
    </View>
  );
}

const estilos = StyleSheet.create({
  caixa: { alignItems: 'center', justifyContent: 'center' },
});
