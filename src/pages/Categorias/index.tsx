import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tag, Plus, Trash2, X, TrendingUp, TrendingDown, Loader2, Pencil, Check, Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { MainLayout } from '../../components/layout/MainLayout';
import { DeleteConfirmationModal } from '../../components/modals/DeleteConfirmationModal';
import { CategoriaControllerService } from '../../api/services/CategoriaControllerService';
import { CategoriaResponseDTO } from '../../api/models/CategoriaResponseDTO';
import { CategoriaRegistroRequestDTO } from '../../api/models/CategoriaRegistroRequestDTO';
import { getApiErrorMessage } from '../../lib/errorMessage';
import { toast } from '../../store/useToastStore';
import { useI18nStore } from '../../store/useI18nStore';

export const CategoriasPage = () => {
  const queryClient = useQueryClient();
  const language = useI18nStore((s) => s.language);
  const tr = (pt: string, en: string) => (language === 'en-US' ? en : pt);
  const [searchParams, setSearchParams] = useSearchParams();
  const buscaParam = searchParams.get('busca') ?? '';
  const [modalAberto, setModalAberto] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoTipo, setNovoTipo] = useState<CategoriaRegistroRequestDTO.tipo>(CategoriaRegistroRequestDTO.tipo.DESPESA);
  const [busca, setBusca] = useState(buscaParam);

  // Estado de edição inline
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nomeEditando, setNomeEditando] = useState('');

  // Modal de confirmação de exclusão
  const [categoriaParaDeletar, setCategoriaParaDeletar] = useState<CategoriaResponseDTO | undefined>(undefined);

  useEffect(() => {
    setBusca(buscaParam);
  }, [buscaParam]);

  const { data: categorias = [], isLoading } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => CategoriaControllerService.listarCategorias(),
  });

  const criarMutation = useMutation({
    mutationFn: () =>
      CategoriaControllerService.criarCategoria({ nome: novoNome.trim(), tipo: novoTipo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      toast.success(tr(`Categoria "${novoNome.trim()}" criada com sucesso.`, `Category "${novoNome.trim()}" created successfully.`));
      setNovoNome('');
      setModalAberto(false);
    },
    onError: (error: unknown) =>
      toast.error(getApiErrorMessage(error, tr('Não foi possível criar a categoria agora. Tente novamente.', 'Could not create the category right now. Please try again.'))),
  });

  const atualizarMutation = useMutation({
    mutationFn: ({ id, nome, tipo }: { id: number; nome: string; tipo: CategoriaRegistroRequestDTO.tipo }) =>
      CategoriaControllerService.atualizarCategoria(id, { nome, tipo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(tr('Categoria atualizada.', 'Category updated.'));
      setEditandoId(null);
    },
    onError: (error: unknown) =>
      toast.error(getApiErrorMessage(error, tr('Não foi possível salvar a edição da categoria. Tente novamente.', 'Could not save category changes. Please try again.'))),
  });

  const deletarMutation = useMutation({
    mutationFn: (id: number) => CategoriaControllerService.deletarCategoria(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(tr('Categoria removida.', 'Category removed.'));
      setCategoriaParaDeletar(undefined);
    },
    onError: () => {
      toast.error(tr('Não é possível remover uma categoria vinculada a transações.', 'A category linked to transactions cannot be removed.'));
      setCategoriaParaDeletar(undefined);
    },
  });

  const categoriasFiltradas = categorias.filter((c) =>
    (c.nome ?? '').toLowerCase().includes(busca.toLowerCase().trim())
  );
  const receitas = categoriasFiltradas.filter((c) => c.tipo === CategoriaResponseDTO.tipo.RECEITA);
  const despesas = categoriasFiltradas.filter((c) => c.tipo === CategoriaResponseDTO.tipo.DESPESA);

  const handleBuscaChange = (valor: string) => {
    setBusca(valor);
    if (valor.trim()) {
      setSearchParams({ busca: valor });
    } else {
      setSearchParams({});
    }
  };

  const handleCriar = () => {
    if (!novoNome.trim()) return;
    criarMutation.mutate();
  };

  const iniciarEdicao = (cat: CategoriaResponseDTO) => {
    setEditandoId(cat.id!);
    setNomeEditando(cat.nome ?? '');
  };

  const confirmarEdicao = (cat: CategoriaResponseDTO) => {
    if (!nomeEditando.trim() || nomeEditando.trim() === cat.nome) {
      setEditandoId(null);
      return;
    }
    atualizarMutation.mutate({ id: cat.id!, nome: nomeEditando.trim(), tipo: cat.tipo as CategoriaRegistroRequestDTO.tipo });
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6 animate-in fade-in duration-500">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{tr('Categorias', 'Categories')}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {tr('Organize suas transações com categorias personalizadas.', 'Organize your transactions with custom categories.')}
            </p>
          </div>
          <button
            onClick={() => setModalAberto(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-[0.98] text-sm"
          >
            <Plus size={16} />
            {tr('Nova Categoria', 'New Category')}
          </button>
        </div>

        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={busca}
            onChange={(e) => handleBuscaChange(e.target.value)}
            placeholder={tr('Buscar categoria...', 'Search category...')}
            className="w-full bg-secondary/30 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium placeholder:text-muted-foreground/30"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Receitas */}
            <div className="glass rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
                  <TrendingUp size={16} />
                </div>
                <h2 className="text-sm font-bold text-white uppercase tracking-widest">{tr('Receitas', 'Income')}</h2>
                <span className="ml-auto text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">
                  {receitas.length}
                </span>
              </div>

              {receitas.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  {busca.trim() ? tr('Nenhuma categoria de receita encontrada.', 'No income category found.') : tr('Nenhuma categoria de receita ainda.', 'No income categories yet.')}
                </p>
              ) : (
                <div className="space-y-2">
                  {receitas.map((cat) => (
                    <CategoriaItem
                      key={cat.id}
                      categoria={cat}
                      editandoId={editandoId}
                      nomeEditando={nomeEditando}
                      setNomeEditando={setNomeEditando}
                      onIniciarEdicao={() => iniciarEdicao(cat)}
                      onConfirmarEdicao={() => confirmarEdicao(cat)}
                      onCancelarEdicao={() => setEditandoId(null)}
                      onDeletar={() => setCategoriaParaDeletar(cat)}
                      salvando={atualizarMutation.isPending && editandoId === cat.id}
                      cor="emerald"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Despesas */}
            <div className="glass rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-rose-500/10 rounded-lg text-rose-400">
                  <TrendingDown size={16} />
                </div>
                <h2 className="text-sm font-bold text-white uppercase tracking-widest">{tr('Despesas', 'Expenses')}</h2>
                <span className="ml-auto text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">
                  {despesas.length}
                </span>
              </div>

              {despesas.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  {busca.trim() ? tr('Nenhuma categoria de despesa encontrada.', 'No expense category found.') : tr('Nenhuma categoria de despesa ainda.', 'No expense categories yet.')}
                </p>
              ) : (
                <div className="space-y-2">
                  {despesas.map((cat) => (
                    <CategoriaItem
                      key={cat.id}
                      categoria={cat}
                      editandoId={editandoId}
                      nomeEditando={nomeEditando}
                      setNomeEditando={setNomeEditando}
                      onIniciarEdicao={() => iniciarEdicao(cat)}
                      onConfirmarEdicao={() => confirmarEdicao(cat)}
                      onCancelarEdicao={() => setEditandoId(null)}
                      onDeletar={() => setCategoriaParaDeletar(cat)}
                      salvando={atualizarMutation.isPending && editandoId === cat.id}
                      cor="rose"
                    />
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Modal Nova Categoria */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass w-full max-w-sm rounded-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag size={18} className="text-primary" />
                <h3 className="font-bold text-white">{tr('Nova Categoria', 'New Category')}</h3>
              </div>
              <button
                onClick={() => { setModalAberto(false); setNovoNome(''); }}
                className="text-muted-foreground hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                  {tr('Nome', 'Name')}
                </label>
                <input
                  type="text"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCriar()}
                  placeholder={tr('Ex: Alimentação, Salário...', 'Ex: Food, Salary...')}
                  maxLength={50}
                  autoFocus
                  className="w-full bg-secondary/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium placeholder:text-muted-foreground/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                  {tr('Tipo', 'Type')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNovoTipo(CategoriaRegistroRequestDTO.tipo.RECEITA)}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                      novoTipo === CategoriaRegistroRequestDTO.tipo.RECEITA
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        : 'bg-white/5 border-white/5 text-muted-foreground hover:text-white'
                    }`}
                  >
                    <TrendingUp size={14} /> {tr('Receita', 'Income')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNovoTipo(CategoriaRegistroRequestDTO.tipo.DESPESA)}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                      novoTipo === CategoriaRegistroRequestDTO.tipo.DESPESA
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                        : 'bg-white/5 border-white/5 text-muted-foreground hover:text-white'
                    }`}
                  >
                    <TrendingDown size={14} /> {tr('Despesa', 'Expense')}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleCriar}
              disabled={!novoNome.trim() || criarMutation.isPending}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-[0.98] text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {criarMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {criarMutation.isPending ? tr('Criando...', 'Creating...') : tr('Criar Categoria', 'Create Category')}
            </button>
          </div>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={!!categoriaParaDeletar}
        title={tr('Remover Categoria?', 'Remove Category?')}
        description={
          <>
            {tr('Você está prestes a remover', 'You are about to remove')} <span className="text-white font-semibold">"{categoriaParaDeletar?.nome}"</span>.
            <br />
            {tr('Transações já vinculadas a ela não serão afetadas.', 'Transactions already linked to it will not be affected.')}
          </>
        }
        confirmText={tr('CONFIRMAR', 'CONFIRM')}
        loadingText={tr('REMOVENDO...', 'REMOVING...')}
        isLoading={deletarMutation.isPending}
        onCancel={() => {
          if (!deletarMutation.isPending) {
            setCategoriaParaDeletar(undefined);
          }
        }}
        onConfirm={() => {
          if (!categoriaParaDeletar?.id) return;
          deletarMutation.mutate(categoriaParaDeletar.id);
        }}
      />
    </MainLayout>
  );
};

interface CategoriaItemProps {
  categoria: CategoriaResponseDTO;
  editandoId: number | null;
  nomeEditando: string;
  setNomeEditando: (v: string) => void;
  onIniciarEdicao: () => void;
  onConfirmarEdicao: () => void;
  onCancelarEdicao: () => void;
  onDeletar: () => void;
  salvando: boolean;
  cor: 'emerald' | 'rose';
}

const CategoriaItem = ({
  categoria,
  editandoId,
  nomeEditando,
  setNomeEditando,
  onIniciarEdicao,
  onConfirmarEdicao,
  onCancelarEdicao,
  onDeletar,
  salvando,
  cor,
}: CategoriaItemProps) => {
  const language = useI18nStore((s) => s.language);
  const tr = (pt: string, en: string) => (language === 'en-US' ? en : pt);
  const isEditing = editandoId === categoria.id;

  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-white/5 rounded-xl group hover:bg-white/8 transition-all">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cor === 'emerald' ? 'bg-emerald-400' : 'bg-rose-400'}`} />

      {isEditing ? (
        <input
          type="text"
          value={nomeEditando}
          onChange={(e) => setNomeEditando(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onConfirmarEdicao();
            if (e.key === 'Escape') onCancelarEdicao();
          }}
          autoFocus
          className="flex-1 bg-white/10 border border-primary/40 rounded-lg px-2 py-1 text-sm text-white font-medium focus:outline-none focus:ring-1 focus:ring-primary/60"
        />
      ) : (
        <span className="flex-1 text-sm font-medium text-white truncate">{categoria.nome}</span>
      )}

      <div className="flex items-center gap-1 flex-shrink-0">
        {isEditing ? (
          <>
            <button
              onClick={onConfirmarEdicao}
              disabled={salvando}
              className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-400 transition-all"
              title={tr('Confirmar', 'Confirm')}
            >
              {salvando ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            </button>
            <button
              onClick={onCancelarEdicao}
              className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-all"
              title={tr('Cancelar', 'Cancel')}
            >
              <X size={13} />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onIniciarEdicao}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-primary transition-all"
              title={tr('Editar nome', 'Edit name')}
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={onDeletar}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 transition-all"
              title={tr(`Remover ${categoria.nome}`, `Remove ${categoria.nome}`)}
            >
              <Trash2 size={13} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
