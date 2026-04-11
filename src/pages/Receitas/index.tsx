import { TransacaoResponseDTO } from '../../api/models/TransacaoResponseDTO';
import { ExtratoPage } from '../Extrato';
import { useI18nStore } from '../../store/useI18nStore';

export const ReceitasPage = () => {
  const language = useI18nStore((s) => s.language);
  const tr = (pt: string, en: string) => (language === 'en-US' ? en : pt);

  return (
    <ExtratoPage
      filtroTipo={TransacaoResponseDTO.tipo.RECEITA}
      titulo={tr('Receitas', 'Income')}
      descricao={tr('Acompanhe todas as suas entradas de dinheiro.', 'Track all your incoming money.')}
    />
  );
};
