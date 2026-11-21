import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pedido, Produto } from '../types';

export type AuthStackParams = { Login: undefined; Registrar: undefined };
export type AbasParams = {
  Inicio: { categoriaId?: string } | undefined;
  Promocoes: undefined;
  Vitrine: undefined;
  Conta: undefined;
};
export type AppStackParams = {
  Abas: NavigatorScreenParams<AbasParams> | undefined;
  PainelAdmin: undefined;
  ProdutoDetalhe: { produto: Produto };
  Carrinho: undefined;
  Checkout: { pedidoId: string; pedido?: Pedido };
  Pedidos: undefined;
  ProdutoForm: { produto?: Produto }; // sem produto = cadastro novo
  Enderecos: undefined;
  DadosPessoais: undefined;
  Favoritos: undefined;
  PaginaTexto: { titulo: string; campo: 'quemSomos' | 'termosPedido' | 'avisoLegal' };
  ContatoLocalizacao: { tipo: 'contato' | 'localizacao' };
};

// Props de uma aba que também pode navegar para telas da pilha (Carrinho, ProdutoDetalhe...).
export type AbaProps<K extends keyof AbasParams> = CompositeScreenProps<
  BottomTabScreenProps<AbasParams, K>,
  NativeStackScreenProps<AppStackParams>
>;
