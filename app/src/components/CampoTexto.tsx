import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { cores, fontes, raio } from '../theme';

interface Props extends TextInputProps {
  rotulo: string;
  erro?: string;
  dica?: string;
}

// Campo com rótulo, mensagem de erro e (para senhas) botão de mostrar/ocultar.
export function CampoTexto({ rotulo, erro, dica, secureTextEntry, style, ...resto }: Props) {
  const [oculto, setOculto] = useState(true);
  const ehSenha = !!secureTextEntry;

  return (
    <View style={estilos.grupo}>
      <Text style={estilos.rotulo}>{rotulo}</Text>
      <View style={[estilos.campo, !!erro && estilos.campoErro]}>
        <TextInput
          {...resto}
          style={[estilos.input, style]}
          placeholderTextColor={cores.placeholder}
          secureTextEntry={ehSenha && oculto}
          accessibilityLabel={rotulo}
        />
        {ehSenha && (
          <Pressable onPress={() => setOculto((o) => !o)} hitSlop={10} accessibilityLabel={oculto ? 'Mostrar senha' : 'Ocultar senha'}>
            <Ionicons name={oculto ? 'eye-outline' : 'eye-off-outline'} size={20} color={cores.placeholder} />
          </Pressable>
        )}
      </View>
      {erro ? <Text style={estilos.erro}>{erro}</Text> : dica ? <Text style={estilos.dica}>{dica}</Text> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: { marginBottom: 16 },
  rotulo: { fontFamily: fontes.semibold, fontSize: 13, color: cores.texto, marginBottom: 6 },
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    paddingHorizontal: 14,
    backgroundColor: cores.campo,
    borderWidth: 1,
    borderColor: cores.bordaCampo,
    borderRadius: raio.campo,
  },
  campoErro: { borderColor: cores.erro, backgroundColor: '#FFF5F5' },
  input: { flex: 1, fontFamily: fontes.regular, fontSize: 14, color: cores.texto },
  erro: { marginTop: 5, fontFamily: fontes.medium, fontSize: 12, color: cores.erro },
  dica: { marginTop: 5, fontFamily: fontes.regular, fontSize: 12, color: cores.textoSuave },
});
