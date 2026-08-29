/**
 * Utilitário para detecção, normalização e download automático de dados via links do GitHub, Gist e URLs Web.
 */

export interface FetchResult {
  success: boolean;
  data: any;
  rawText: string;
  urlUsed: string;
  error?: string;
}

/**
 * Verifica se a string informada é uma URL web / GitHub
 */
export function isWebOrGitHubUrl(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  const trimmed = input.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return true;
  }
  if (trimmed.startsWith('raw.githubusercontent.com') || trimmed.startsWith('github.com') || trimmed.startsWith('gist.github.com')) {
    return true;
  }
  return false;
}

/**
 * Converte links visuais do GitHub (blob/raw/gist) para a URL direta (raw content)
 */
export function normalizeGitHubRawUrl(inputUrl: string): string {
  let url = inputUrl.trim();

  // Adiciona https:// caso o usuário tenha colado sem protocolo
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  try {
    const parsed = new URL(url);

    // 1. Caso github.com/{owner}/{repo}/blob/{branch}/{filePath...}
    // Exemplo: https://github.com/paubrasil/dados/blob/main/quebras.json
    if (parsed.hostname === 'github.com' || parsed.hostname === 'www.github.com') {
      const parts = parsed.pathname.split('/').filter(Boolean);
      // parts: [owner, repo, 'blob'|'raw'|'tree', branch, ...filePath]
      if (parts.length >= 4 && (parts[2] === 'blob' || parts[2] === 'raw' || parts[2] === 'tree')) {
        const owner = parts[0];
        const repo = parts[1];
        const branch = parts[3];
        const filePath = parts.slice(4).join('/');
        return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
      }
    }

    // 2. Caso gist.github.com/{user}/{gistId}
    if (parsed.hostname === 'gist.github.com') {
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
        const user = parts[0];
        const gistId = parts[1];
        return `https://gist.githubusercontent.com/${user}/${gistId}/raw`;
      }
    }

    // 3. Caso raw.githubusercontent.com já formatado
    return url;
  } catch {
    return url;
  }
}

/**
 * Realiza a busca dos dados a partir de uma URL do GitHub ou Web
 */
export async function fetchDataFromGitHubOrUrl(inputUrl: string): Promise<FetchResult> {
  const normalizedUrl = normalizeGitHubRawUrl(inputUrl);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    let response: Response;
    try {
      response = await fetch(normalizedUrl, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json, text/plain, */*',
        },
      });
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      // Caso ocorra erro de CORS em URLs não raw, tenta via fallback se aplicável
      if (normalizedUrl.includes('github.com') && !normalizedUrl.includes('raw.githubusercontent.com')) {
        const fallbackUrl = normalizedUrl.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
        const fallbackRes = await fetch(fallbackUrl);
        if (fallbackRes.ok) {
          const text = await fallbackRes.text();
          try {
            const data = JSON.parse(text);
            return { success: true, data, rawText: text, urlUsed: fallbackUrl };
          } catch {
            return { success: true, data: text, rawText: text, urlUsed: fallbackUrl };
          }
        }
      }
      throw new Error(`Falha na requisição de rede: ${fetchErr.message || 'Verifique se o link está acessível e público'}`);
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(
          `Arquivo não encontrado (404) no link do GitHub. Verifique se o repositório é PÚBLICO e se o nome do arquivo ou branch ('main'/'master') está correto.`
        );
      }
      if (response.status === 403) {
        throw new Error(
          `Acesso negado (403). O repositório no GitHub pode ser privado. Torne o repositório público ou copie o conteúdo do arquivo diretamente.`
        );
      }
      throw new Error(`Erro ao buscar arquivo: HTTP ${response.status} ${response.statusText}`);
    }

    const rawText = await response.text();

    if (!rawText.trim()) {
      throw new Error('O arquivo retornado pelo link está completamente vazio.');
    }

    // Tenta interpretar como JSON
    try {
      const data = JSON.parse(rawText);
      return {
        success: true,
        data,
        rawText,
        urlUsed: normalizedUrl,
      };
    } catch {
      // Se não for JSON direto, retorna o texto bruto (ex: CSV ou TSV)
      return {
        success: true,
        data: rawText,
        rawText,
        urlUsed: normalizedUrl,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      data: null,
      rawText: '',
      urlUsed: normalizedUrl,
      error: error.message || 'Erro desconhecido ao carregar link.',
    };
  }
}
