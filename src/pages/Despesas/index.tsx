import { TransacaoResponseDTO } from '../../api/models/TransacaoResponseDTO';
import { ExtratoPage } from '../Extrato';
import { useI18nStore } from '../../store/useI18nStore';

export const DespesasPage = () => {
  const language = useI18nStore((s) => s.language);
  const tr = (pt: string, en: string) => (language === 'en-US' ? en : pt);

  return (
    <ExtratoPage
      filtroTipo={TransacaoResponseDTO.tipo.DESPESA}
      titulo={tr('Despesas', 'Expenses')}
      descricao={tr('Acompanhe todos os seus gastos e controle seu orçamento.', 'Track all your spending and control your budget.')}
    />
  );
};
