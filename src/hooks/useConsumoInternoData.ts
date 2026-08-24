import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  ConsumoInternoItem,
  ConsumoInternoInput,
  ConsumoInternoJSONItem,
  ConsumoMetrics,
} from '../types/consumoInterno';
import {
  DEMO_CONSUMO_INTERNO_LIST,
  DEMO_EMPRESA_ID,
  DEFAULT_CONSUMO_JSON_ITEMS,
  mapJsonToConsumoInternoItems,
} from '../data/mockConsumoInterno';
import { classificarCategoriaProduto } from '../utils/consumoClassifier';
import { parseDateToISO, formatDateBR } from '../utils/formatters';

const LOCAL_STORAGE_KEY = 'ARMAZEM_FACIL_CONSUMO_INTERNO_CACHE';

export function useConsumoInternoData(companyId: string = DEMO_EMPRESA_ID) {
  const [data, setData] = useState<ConsumoInternoItem[]>(() => {
    try {
      const cached = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${companyId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEMO_CONSUMO_INTERNO_LIST.filter((i) => i.empresaId === companyId || !i.empresaId);
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(false);

  // Sync to localStorage whenever data changes
  const saveToLocalCache = useCallback(
    (items: ConsumoInternoItem[]) => {
      try {
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_${companyId}`, JSON.stringify(items));
      } catch (err) {
        console.warn('Falha ao salvar cache local de consumo interno:', err);
      }
    },
    [companyId]
  );

  // Setup Firestore onSnapshot listener with where('empresaId', '==', companyId)
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const consumoCollectionRef = collection(db, 'consumo_interno');
    const consumoQuery = query(consumoCollectionRef, where('empresaId', '==', companyId));

    const unsubscribe = onSnapshot(
      consumoQuery,
      (snapshot) => {
        if (!isMounted) return;

        if (!snapshot.empty) {
          const items: ConsumoInternoItem[] = [];
          snapshot.forEach((docSnap) => {
            const raw = docSnap.data();
            const rawDataOp = raw.data_operacao || raw.dataOperacao || raw.dtOperacao || new Date().toISOString().slice(0, 10);
            const rawDataEm = raw.data_emissao || raw.dataEmissao || raw.emissao || rawDataOp;
            const dtISO = parseDateToISO(rawDataOp);
            const emISO = parseDateToISO(rawDataEm);
            const dtBR = formatDateBR(dtISO);
            const emBR = formatDateBR(emISO);

            const totalVal = Number(raw.valor ?? raw.total ?? 0);
            const sku = Number(raw.produto ?? raw.produtoId ?? 0);
            const emb = raw.embalagem || 'LONG NECK';
            const qtde = Number(raw.quantidade ?? raw.qtde ?? raw.qtd ?? 0);

            const item: ConsumoInternoItem = {
              id: docSnap.id,
              empresaId: raw.empresaId || companyId,
              operacao: Number(raw.operacao || 0),
              dtOperacao: dtISO,
              dataOperacao: dtISO,
              data_operacao: dtBR,
              emissao: emISO,
              data_emissao: emBR,
              status: raw.status || 'A',
              produtoId: sku,
              produto: sku,
              unidade: raw.unidade || 'cx',
              descricao: raw.descricao || '',
              qtde,
              quantidade: qtde,
              total: totalVal,
              valor: totalVal,
              embalagem: emb,
              categoria: raw.categoria || classificarCategoriaProduto(raw.descricao, sku),
              solicitante: raw.solicitante,
              centroCusto: raw.centroCusto,
              observacao: raw.observacao,
              createdAt: raw.createdAt,
            };
            items.push(item);
          });

          // Sort by dtOperacao descending
          items.sort((a, b) => b.dtOperacao.localeCompare(a.dtOperacao));

          setData(items);
          saveToLocalCache(items);
          setIsFirestoreConnected(true);
        } else {
          // If Firestore is empty for this company, populate state with initial demo list if needed
          setData((prev) => {
            if (prev.length === 0) {
              const demo = DEMO_CONSUMO_INTERNO_LIST.map((item) => ({
                ...item,
                empresaId: companyId,
              }));
              saveToLocalCache(demo);
              return demo;
            }
            return prev;
          });
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Firestore onSnapshot aviso (usando cache persistente local):', err.message);
        if (isMounted) {
          setIsFirestoreConnected(false);
          setLoading(false);
          // Keep existing cached data
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [companyId, saveToLocalCache]);

  // Actions: Add new consumo item
  const addConsumo = useCallback(
    async (input: ConsumoInternoInput) => {
      const sku = Number(input.produto ?? input.produtoId ?? 0);
      const rawDataOp = input.data_operacao || input.dataOperacao || input.dtOperacao || new Date().toISOString().slice(0, 10);
      const rawDataEm = input.data_emissao || input.dataEmissao || input.emissao || rawDataOp;
      const dtISO = parseDateToISO(rawDataOp);
      const emISO = parseDateToISO(rawDataEm);
      const dtBR = formatDateBR(dtISO);
      const emBR = formatDateBR(emISO);

      const totalVal = Number(input.valor ?? input.total ?? 0);
      const emb = input.embalagem || 'LONG NECK';
      const qtde = Number(input.quantidade ?? input.qtde ?? 1);
      const categoria = input.categoria || classificarCategoriaProduto(input.descricao, sku);

      const newItem: ConsumoInternoItem = {
        id: `CI-${Date.now()}`,
        empresaId: companyId,
        operacao: Number(input.operacao),
        dtOperacao: dtISO,
        dataOperacao: dtISO,
        data_operacao: dtBR,
        emissao: emISO,
        data_emissao: emBR,
        status: input.status || 'A',
        produtoId: sku,
        produto: sku,
        unidade: input.unidade || 'cx',
        descricao: input.descricao,
        qtde,
        quantidade: qtde,
        total: totalVal,
        valor: totalVal,
        embalagem: emb,
        categoria,
        solicitante: input.solicitante,
        centroCusto: input.centroCusto,
        observacao: input.observacao,
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      };

      // Optimistic update
      setData((prev) => {
        const next = [newItem, ...prev];
        saveToLocalCache(next);
        return next;
      });

      try {
        const consumoCollectionRef = collection(db, 'consumo_interno');
        const docRef = await addDoc(consumoCollectionRef, {
          empresaId: companyId,
          operacao: newItem.operacao,
          data_operacao: dtBR,
          dataOperacao: newItem.dtOperacao,
          dtOperacao: newItem.dtOperacao,
          data_emissao: emBR,
          emissao: newItem.emissao,
          status: newItem.status,
          produto: newItem.produtoId,
          produtoId: newItem.produtoId,
          unidade: newItem.unidade,
          descricao: newItem.descricao,
          quantidade: newItem.quantidade,
          qtde: newItem.qtde,
          total: newItem.total,
          valor: newItem.valor,
          embalagem: newItem.embalagem,
          categoria: newItem.categoria,
          solicitante: newItem.solicitante || '',
          centroCusto: newItem.centroCusto || '',
          observacao: newItem.observacao || '',
          createdAt: newItem.createdAt,
        });

        // Update local with actual firestore id
        setData((prev) =>
          prev.map((it) => (it.id === newItem.id ? { ...it, id: docRef.id } : it))
        );
      } catch (err) {
        console.warn('Salvo localmente no persistent cache (Firestore sync pendente):', err);
      }
    },
    [companyId, saveToLocalCache]
  );

  // Actions: Import JSON array directly in the requested format
  const importJsonData = useCallback(
    async (jsonItems: ConsumoInternoJSONItem[], overwrite: boolean = false) => {
      const formattedItems: ConsumoInternoItem[] = jsonItems.map((raw, idx) => {
        const sku = Number(raw.produto ?? (raw as any).produtoId ?? (raw as any).sku ?? 0);
        const rawDataOp = raw.data_operacao || raw.dataOperacao || (raw as any).dtOperacao || (raw as any).data || '08/01/2026';
        const rawDataEm = raw.data_emissao || (raw as any).dataEmissao || raw.emissao || rawDataOp;
        const dtISO = parseDateToISO(rawDataOp);
        const emISO = parseDateToISO(rawDataEm);
        const dtBR = formatDateBR(dtISO);
        const emBR = formatDateBR(emISO);

        const totalVal = Number(raw.valor ?? (raw as any).total ?? 0);
        const qtde = Number(raw.quantidade ?? raw.qtde ?? (raw as any).qtd ?? 1);
        const emb = raw.embalagem || 'LONG NECK';
        const desc = raw.descricao || 'PRODUTO CONSUMO INTERNO';
        const categoria = classificarCategoriaProduto(desc, sku);

        return {
          id: `CI-JSON-${Date.now()}-${idx}`,
          empresaId: companyId,
          operacao: Number(raw.operacao || 100 + idx),
          dtOperacao: dtISO,
          dataOperacao: dtISO,
          data_operacao: dtBR,
          emissao: emISO,
          data_emissao: emBR,
          status: raw.status || 'A',
          produtoId: sku,
          produto: sku,
          unidade: raw.unidade || 'cx',
          descricao: desc,
          quantidade: qtde,
          qtde,
          total: Number(totalVal.toFixed(2)),
          valor: Number(totalVal.toFixed(2)),
          embalagem: emb,
          categoria,
          solicitante: 'JSON Consumo Interno',
          centroCusto: 'CC-7102 Logística Operacional',
          observacao: 'Alimentado via JSON exclusivo de Consumo Interno',
          createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
        };
      });

      setData((prev) => {
        const next = overwrite ? formattedItems : [...formattedItems, ...prev];
        saveToLocalCache(next);
        return next;
      });

      // Sync to backend
      fetch('/api/consumo-interno/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: formattedItems, overwrite }),
      }).catch(() => {});

      // Sync to Firestore
      try {
        const batch = writeBatch(db);
        const consumoCollectionRef = collection(db, 'consumo_interno');

        if (overwrite) {
          const q = query(consumoCollectionRef, where('empresaId', '==', companyId));
          const snap = await getDocs(q);
          snap.forEach((docSnap) => {
            batch.delete(docSnap.ref);
          });
        }

        formattedItems.slice(0, 250).forEach((item) => {
          const newDocRef = doc(consumoCollectionRef);
          batch.set(newDocRef, {
            empresaId: companyId,
            operacao: item.operacao,
            data_operacao: item.data_operacao,
            dataOperacao: item.dtOperacao,
            dtOperacao: item.dtOperacao,
            data_emissao: item.data_emissao,
            emissao: item.emissao,
            status: item.status,
            produto: item.produtoId,
            produtoId: item.produtoId,
            unidade: item.unidade,
            descricao: item.descricao,
            quantidade: item.quantidade,
            qtde: item.qtde,
            valor: item.valor,
            total: item.total,
            embalagem: item.embalagem,
            categoria: item.categoria,
            solicitante: item.solicitante || '',
            centroCusto: item.centroCusto || '',
            observacao: item.observacao || '',
            createdAt: item.createdAt,
          });
        });

        await batch.commit();
      } catch (err) {
        console.warn('Firestore Batch sync aviso (dados salvos localmente):', err);
      }
    },
    [companyId, saveToLocalCache]
  );

  // Actions: Batch Import for table / inputs
  const importBatchConsumo = useCallback(
    async (items: ConsumoInternoInput[], overwrite: boolean = false) => {
      const jsonItems: ConsumoInternoJSONItem[] = items.map((i) => ({
        operacao: Number(i.operacao || 0),
        dataOperacao: i.dataOperacao || i.dtOperacao || new Date().toISOString().slice(0, 10),
        emissao: i.emissao || i.dtOperacao || new Date().toISOString().slice(0, 10),
        status: i.status || 'A',
        produto: Number(i.produto || i.produtoId || 0),
        unidade: i.unidade || 'cx',
        descricao: i.descricao || '',
        qtde: Number(i.qtde || 0),
        valor: Number(i.valor ?? i.total ?? 0),
        embalagem: i.embalagem || 'LONG NECK',
      }));

      await importJsonData(jsonItems, overwrite);
    },
    [importJsonData]
  );

  // Actions: Export formatted JSON adhering to exact requested format
  const exportAsJson = useCallback((): ConsumoInternoJSONItem[] => {
    return data.map((item) => ({
      operacao: item.operacao,
      dataOperacao: item.dtOperacao,
      emissao: item.emissao,
      status: item.status,
      produto: item.produtoId,
      unidade: item.unidade,
      descricao: item.descricao,
      qtde: item.qtde,
      valor: Number(item.total.toFixed(2)),
      embalagem: item.embalagem || 'LONG NECK',
    }));
  }, [data]);

  // Actions: Delete
  const deleteConsumo = useCallback(
    async (id: string) => {
      setData((prev) => {
        const next = prev.filter((it) => it.id !== id);
        saveToLocalCache(next);
        return next;
      });

      try {
        const docRef = doc(db, 'consumo_interno', id);
        await deleteDoc(docRef);
      } catch (err) {
        console.warn('Removido do cache local:', err);
      }
    },
    [saveToLocalCache]
  );

  // Actions: Update
  const updateConsumo = useCallback(
    async (id: string, patch: Partial<ConsumoInternoItem>) => {
      setData((prev) => {
        const next = prev.map((it) => (it.id === id ? { ...it, ...patch } : it));
        saveToLocalCache(next);
        return next;
      });

      try {
        const docRef = doc(db, 'consumo_interno', id);
        await updateDoc(docRef, patch);
      } catch (err) {
        console.warn('Atualizado no cache local:', err);
      }
    },
    [saveToLocalCache]
  );

  // Actions: Reset Demo Data back to default consumo_interno.json
  const resetDemoData = useCallback(async () => {
    const fresh = DEMO_CONSUMO_INTERNO_LIST.map((item) => ({
      ...item,
      empresaId: companyId,
    }));
    setData(fresh);
    saveToLocalCache(fresh);
  }, [companyId, saveToLocalCache]);

  // Computed Metrics
  const metrics: ConsumoMetrics = useMemo(() => {
    const totalGasto = data.reduce((acc, curr) => acc + (curr.total || 0), 0);
    const unidadesTotais = data.reduce((acc, curr) => acc + (curr.qtde || 0), 0);
    const numRegistros = data.length;

    // Unique operations
    const uniqueOps = new Set<number>();
    data.forEach((item) => {
      if (item.operacao) uniqueOps.add(item.operacao);
    });
    const numOperacoes = uniqueOps.size || (numRegistros > 0 ? numRegistros : 1);
    const ticketMedioOperacao = numOperacoes > 0 ? totalGasto / numOperacoes : 0;

    return {
      totalGasto,
      unidadesTotais,
      numRegistros,
      ticketMedioOperacao,
      numOperacoes,
    };
  }, [data]);

  return {
    data,
    metrics,
    loading,
    error,
    isFirestoreConnected,
    companyId,
    addConsumo,
    importBatchConsumo,
    importJsonData,
    exportAsJson,
    deleteConsumo,
    updateConsumo,
    resetDemoData,
  };
}

