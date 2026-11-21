// Lista paginada com estados (carregando/ok/erro), "carregar mais", "puxar para atualizar"
// e atualização silenciosa quando a tela volta a ficar em foco (ex.: depois de editar um produto).
// Passe uma `buscarPagina` estável (useCallback): quando ela muda (filtros), a lista recomeça.
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import { mensagemDeErro } from '../utils/erros';

type Modo = 'reset' | 'mais' | 'refresh' | 'silencioso';
interface Pagina<T> {
  itens: T[];
  totalPaginas: number;
}

export function useListaPaginada<T>(buscarPagina: (pagina: number) => Promise<Pagina<T>>) {
  const { mostrar } = useToast();
  const [itens, setItens] = useState<T[]>([]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [estado, setEstado] = useState<'carregando' | 'ok' | 'erro'>('carregando');
  const [mensagemErro, setMensagemErro] = useState('');
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [atualizando, setAtualizando] = useState(false);
  const requisicao = useRef(0); // descarta respostas atrasadas

  const carregar = useCallback(
    async (pag: number, modo: Modo) => {
      const id = ++requisicao.current;
      if (modo === 'reset') setEstado('carregando');
      if (modo === 'mais') setCarregandoMais(true);
      if (modo === 'refresh') setAtualizando(true);
      try {
        const r = await buscarPagina(pag);
        if (id !== requisicao.current) return;
        setItens((anterior) => (pag === 1 ? r.itens : [...anterior, ...r.itens]));
        setPagina(pag);
        setTotalPaginas(r.totalPaginas);
        setEstado('ok');
      } catch (e) {
        if (id !== requisicao.current) return;
        if (modo === 'reset') {
          setMensagemErro(mensagemDeErro(e));
          setEstado('erro');
        } else mostrar(mensagemDeErro(e), 'erro');
      } finally {
        if (id === requisicao.current) {
          setCarregandoMais(false);
          setAtualizando(false);
        }
      }
    },
    [buscarPagina, mostrar],
  );

  useEffect(() => {
    carregar(1, 'reset');
  }, [carregar]);

  // Ao voltar para a tela (menos na primeira vez), recarrega sem mostrar o spinner.
  const carregarRef = useRef(carregar);
  carregarRef.current = carregar;
  const primeiroFoco = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (primeiroFoco.current) {
        primeiroFoco.current = false;
        return;
      }
      carregarRef.current(1, 'silencioso');
    }, []),
  );

  return {
    itens,
    setItens,
    estado,
    mensagemErro,
    carregandoMais,
    atualizando,
    recarregar: (modo: Modo = 'reset') => carregar(1, modo),
    carregarMais: () => {
      if (estado === 'ok' && !carregandoMais && pagina < totalPaginas) carregar(pagina + 1, 'mais');
    },
  };
}
