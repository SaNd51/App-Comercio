// Checkout com Pix: QR Code + "Pix Copia e Cola" (botão de copiar), resumo e status do pedido.
// Enquanto aguarda pagamento, consulta o status a cada 8 s (o admin confirma o Pix na loja).
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Botao } from '../components/Botao';
import { EstadoMensagem } from '../components/EstadoMensagem';
import { SeloStatus } from '../components/SeloStatus';
import { useToast } from '../contexts/ToastContext';
import { AppStackParams } from '../navigation/tipos';
import { api } from '../services/api';
import { cores, fontes, raio } from '../theme';
import { Pedido } from '../types';
import { mensagemDeErro } from '../utils/erros';
import { formatarData, formatarPreco } from '../utils/formatar';
import { codigoPedido } from '../utils/pedido';

const INTERVALO_MS = 8000;

export function CheckoutScreen({ navigation, route }: NativeStackScreenProps<AppStackParams, 'Checkout'>) {
  const insets = useSafeAreaInsets();
  const { mostrar } = useToast();
  const { pedidoId } = route.params;

  const [pedido, setPedido] = useState<Pedido | null>(route.params.pedido ?? null);
  const [erro, setErro] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const statusAnterior = useRef(pedido?.status);

  const carregar = useCallback(
    async (silencioso = false) => {
      try {
        const r = await api<{ pedido: Pedido }>(`/orders/${pedidoId}`);
        setPedido(r.pedido);
        setErro('');
      } catch (e) {
        if (!silencioso) setErro(mensagemDeErro(e));
      }
    },
    [pedidoId],
  );

  useEffect(() => {
    carregar(!!route.params.pedido); // com dados da navegação, a atualização é silenciosa
  }, [carregar, route.params.pedido]);

  // Atualiza sozinho enquanto o pagamento não é confirmado.
  const status = pedido?.status;
  useEffect(() => {
    if (status !== 'aguardando_pagamento') return;
    const t = setInterval(() => carregar(true), INTERVALO_MS);
    return () => clearInterval(t);
  }, [status, carregar]);

  // Avisa quando o pagamento é confirmado.
  useEffect(() => {
    if (statusAnterior.current === 'aguardando_pagamento' && status === 'pago') {
      mostrar('Pagamento confirmado! Obrigado.', 'sucesso');
    }
    statusAnterior.current = status;
  }, [status, mostrar]);

  async function copiar() {
    if (!pedido) return;
    try {
      await Clipboard.setStringAsync(pedido.pixPayload);
      mostrar('Código Pix copiado!', 'sucesso');
    } catch {
      mostrar('Não foi possível copiar. Selecione o código e copie manualmente.', 'erro');
    }
  }

  async function cancelar() {
    setCancelando(true);
    try {
      const r = await api<{ pedido: Pedido }>(`/orders/${pedidoId}/cancel`, { method: 'POST' });
      setPedido(r.pedido);
      mostrar('Pedido cancelado.', 'info');
    } catch (e) {
      mostrar(mensagemDeErro(e), 'erro');
      carregar(true); // o status pode ter mudado (ex.: acabou de ser pago)
    } finally {
      setCancelando(false);
      setConfirmando(false);
    }
  }

  const topo = (
    <View style={[estilos.topo, { paddingTop: insets.top + 8 }]}>
      <Pressable onPress={() => navigation.navigate('Abas')} style={estilos.voltar} accessibilityLabel="Voltar ao início">
        <Ionicons name="chevron-back" size={22} color={cores.texto} />
      </Pressable>
      <Text style={estilos.titulo}>{pedido?.status === 'aguardando_pagamento' ? 'Pagamento' : 'Pedido'}</Text>
      <View style={{ width: 42 }} />
    </View>
  );

  if (!pedido) {
    return (
      <View style={estilos.tela}>
        {topo}
        {erro ? (
          <EstadoMensagem icone="cloud-offline-outline" titulo="Não foi possível carregar" texto={erro} acao={{ rotulo: 'Tentar de novo', onPress: () => carregar() }} />
        ) : (
          <ActivityIndicator size="large" color={cores.primaria} style={{ marginTop: 64 }} />
        )}
      </View>
    );
  }

  const aguardando = pedido.status === 'aguardando_pagamento';

  return (
    <View style={estilos.tela}>
      {topo}
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24 }}>
        <View style={estilos.cabecalho}>
          <View>
            <Text style={estilos.codigo}>Pedido {codigoPedido(pedido.id)}</Text>
            <Text style={estilos.data}>{formatarData(pedido.criadoEm)}</Text>
          </View>
          <SeloStatus status={pedido.status} />
        </View>

        {aguardando && (
          <View style={estilos.cartao}>
            <Text style={estilos.instrucao}>Escaneie o QR Code no app do seu banco</Text>
            <View style={estilos.qr}>
              <QRCode value={pedido.pixPayload} size={200} ecl="M" />
            </View>

            <View style={estilos.valor}>
              <Text style={estilos.moeda}>R$</Text>
              <Text style={estilos.valorNumero}>{formatarPreco(pedido.total)}</Text>
            </View>

            <Text style={estilos.rotulo}>Pix Copia e Cola</Text>
            <View style={estilos.codigoBox}>
              <Text style={estilos.codigoTexto} selectable numberOfLines={4}>
                {pedido.pixPayload}
              </Text>
            </View>
            <Botao titulo="Copiar código Pix" onPress={copiar} />

            <Text style={estilos.passos}>
              1. Abra o app do seu banco{'\n'}2. Escolha Pix → Pix Copia e Cola (ou Ler QR Code){'\n'}3. Confira o valor e confirme o pagamento
            </Text>
            <View style={estilos.aguarde}>
              <ActivityIndicator size="small" color={cores.textoSuave} />
              <Text style={estilos.aguardeTexto}>Aguardando a confirmação da loja…</Text>
            </View>
          </View>
        )}

        {pedido.status === 'pago' && (
          <View style={[estilos.cartao, { alignItems: 'center' }]}>
            <Ionicons name="checkmark-circle" size={56} color={cores.sucesso} />
            <Text style={estilos.msgTitulo}>Pagamento confirmado</Text>
            <Text style={estilos.msgTexto}>
              {pedido.tipoEntrega === 'entrega'
                ? 'Entrega em andamento. Acompanhe as próximas etapas abaixo.'
                : 'Seu pedido está confirmado. Retire na loja quando estiver pronto.'}
            </Text>
            {pedido.statusEntrega && (
              <Text style={[estilos.msgTexto, { marginTop: 8, color: cores.primaria, fontFamily: fontes.bold }]}>
                Estado: {pedido.statusEntrega.replaceAll('_', ' ')}
              </Text>
            )}
          </View>
        )}

        {pedido.status === 'cancelado' && (
          <View style={[estilos.cartao, { alignItems: 'center' }]}>
            <Ionicons name="close-circle" size={56} color={cores.navInativo} />
            <Text style={estilos.msgTitulo}>Pedido cancelado</Text>
            <Text style={estilos.msgTexto}>Este pedido não está mais ativo. Você pode fazer um novo pedido quando quiser.</Text>
          </View>
        )}

        <Text style={estilos.secao}>Resumo do pedido</Text>
        <View style={estilos.cartao}>
          {pedido.itens.map((i, idx) => (
            <View key={i.id} style={[estilos.linhaItem, idx > 0 && estilos.divisor]}>
              <Text style={estilos.itemNome} numberOfLines={2}>
                {i.quantidade}× {i.nome}
              </Text>
              <Text style={estilos.itemValor}>R$ {formatarPreco(i.subtotal)}</Text>
            </View>
          ))}
          {pedido.subtotal > 0 && (
            <View style={[estilos.linhaItem, estilos.divisor]}>
              <Text style={estilos.totalRotulo}>Subtotal</Text>
              <Text style={estilos.totalValor}>R$ {formatarPreco(pedido.subtotal)}</Text>
            </View>
          )}
          {pedido.taxaEntrega > 0 && (
            <View style={[estilos.linhaItem, estilos.divisor]}>
              <Text style={estilos.totalRotulo}>Taxa de entrega</Text>
              <Text style={estilos.totalValor}>R$ {formatarPreco(pedido.taxaEntrega)}</Text>
            </View>
          )}
          <View style={[estilos.linhaItem, estilos.divisor]}>
            <Text style={estilos.totalRotulo}>Total</Text>
            <Text style={estilos.totalValor}>R$ {formatarPreco(pedido.total)}</Text>
          </View>
        </View>

        <View style={{ marginTop: 20, gap: 12 }}>
          <Pressable onPress={() => navigation.navigate('Abas')} style={estilos.secundario} accessibilityRole="button">
            <Text style={estilos.secundarioTexto}>Voltar ao início</Text>
          </Pressable>

          {aguardando &&
            (confirmando ? (
              <View style={estilos.confirmacao}>
                <Text style={estilos.confirmacaoTexto}>Cancelar este pedido?</Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Pressable onPress={() => setConfirmando(false)} style={[estilos.secundario, { flex: 1 }]} disabled={cancelando}>
                    <Text style={estilos.secundarioTexto}>Manter</Text>
                  </Pressable>
                  <Pressable onPress={cancelar} style={[estilos.perigo, { flex: 1 }]} disabled={cancelando}>
                    {cancelando ? <ActivityIndicator color="#fff" /> : <Text style={estilos.perigoTexto}>Sim, cancelar</Text>}
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable onPress={() => setConfirmando(true)} hitSlop={8} style={{ alignItems: 'center', padding: 8 }}>
                <Text style={estilos.cancelarLink}>Cancelar pedido</Text>
              </Pressable>
            ))}
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12, backgroundColor: cores.superficie },
  voltar: { width: 42, height: 42, borderRadius: 14, backgroundColor: cores.botaoIcone, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontFamily: fontes.bold, fontSize: 18, color: cores.texto },
  cabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  codigo: { fontFamily: fontes.bold, fontSize: 16, color: cores.texto },
  data: { marginTop: 2, fontFamily: fontes.regular, fontSize: 12, color: cores.textoSuave },
  cartao: { backgroundColor: cores.superficie, borderWidth: 1, borderColor: cores.bordaCard, borderRadius: raio.card, padding: 16 },
  instrucao: { fontFamily: fontes.semibold, fontSize: 13, color: cores.texto, textAlign: 'center' },
  qr: { alignSelf: 'center', marginTop: 14, padding: 12, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: cores.bordaCard },
  valor: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 4, marginTop: 14 },
  moeda: { fontFamily: fontes.medium, fontSize: 14, color: cores.primaria },
  valorNumero: { fontFamily: fontes.bold, fontSize: 32, color: cores.primaria },
  rotulo: { marginTop: 18, marginBottom: 6, fontFamily: fontes.semibold, fontSize: 12, color: cores.textoSuave },
  codigoBox: { padding: 12, marginBottom: 12, backgroundColor: cores.campo, borderWidth: 1, borderColor: cores.bordaCampo, borderRadius: raio.campo },
  codigoTexto: { fontFamily: fontes.regular, fontSize: 11, lineHeight: 16, color: cores.texto },
  passos: { marginTop: 16, fontFamily: fontes.regular, fontSize: 12, lineHeight: 19, color: cores.textoSuave },
  aguarde: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14 },
  aguardeTexto: { fontFamily: fontes.medium, fontSize: 12, color: cores.textoSuave },
  msgTitulo: { marginTop: 10, fontFamily: fontes.bold, fontSize: 17, color: cores.texto },
  msgTexto: { marginTop: 6, fontFamily: fontes.regular, fontSize: 13, color: cores.textoSuave, textAlign: 'center' },
  secao: { marginTop: 22, marginBottom: 10, fontFamily: fontes.bold, fontSize: 15, color: cores.texto },
  linhaItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 10 },
  divisor: { borderTopWidth: 1, borderTopColor: cores.bordaNav },
  itemNome: { flex: 1, fontFamily: fontes.medium, fontSize: 13, color: cores.texto },
  itemValor: { fontFamily: fontes.semibold, fontSize: 13, color: cores.texto },
  totalRotulo: { fontFamily: fontes.bold, fontSize: 14, color: cores.texto },
  totalValor: { fontFamily: fontes.bold, fontSize: 16, color: cores.primaria },
  secundario: { height: 48, borderRadius: raio.campo, borderWidth: 1.5, borderColor: cores.primaria, alignItems: 'center', justifyContent: 'center' },
  secundarioTexto: { fontFamily: fontes.bold, fontSize: 14, color: cores.primaria },
  perigo: { height: 48, borderRadius: raio.campo, backgroundColor: cores.erro, alignItems: 'center', justifyContent: 'center' },
  perigoTexto: { fontFamily: fontes.bold, fontSize: 14, color: '#fff' },
  confirmacao: { gap: 10 },
  confirmacaoTexto: { textAlign: 'center', fontFamily: fontes.semibold, fontSize: 13, color: cores.texto },
  cancelarLink: { fontFamily: fontes.semibold, fontSize: 13, color: cores.textoSuave, textDecorationLine: 'underline' },
});
