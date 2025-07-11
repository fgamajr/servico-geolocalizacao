// Core/Internal Modules
import { setTimeout } from 'node:timers/promises';

// Third-party Libraries
import axios from 'axios';
import axiosRetry from 'axios-retry';
import rateLimit from 'axios-rate-limit';

// --- Constants ---
const API_TIMEOUT_MS = 5000;
const MAX_API_RETRIES = 3;
const API_RETRY_DELAY_MS = 1000;

/**
 * @typedef {Object} GeoLocationResponse
 * @property {boolean} isWithinBrazil - True se as coordenadas estão no Brasil.
 * @property {string} checkMethod - Sempre 'api' nesta versão.
 * @property {string|null} provider - Provedor de API que respondeu com sucesso.
 * @property {object|null} apiData - Dados brutos da API.
 */

/**
 * Serviço online para verificar se coordenadas estão no Brasil
 * utilizando exclusivamente APIs externas (OpenCage, Nominatim).
 */
export class GeoLocationService {
  #httpClient;
  #openCageApiKey;

  /**
   * @param {Object} config - Configuração do serviço.
   * @param {string} [config.openCageApiKey] - Chave da API OpenCage. Essencial para melhor performance.
   */
  constructor({ openCageApiKey } = {}) {
    this.#openCageApiKey = openCageApiKey;

    this.#httpClient = rateLimit(
      axios.create({
        timeout: API_TIMEOUT_MS,
        headers: { 'User-Agent': 'ServicoGeolocalizacaoBR-Online/2.0 (contato@empresa.com)' }
      }), 
      { maxRequests: 10, perMilliseconds: 1000 }
    );

    axiosRetry(this.#httpClient, { 
      retries: MAX_API_RETRIES,
      retryDelay: () => API_RETRY_DELAY_MS,
      retryCondition: (error) => 
        axiosRetry.isNetworkOrIdempotentRequestError(error) || 
        error.response?.status >= 500
    });
  }

  #validateCoordinates(lat, lon) {
    const nLat = parseFloat(lat);
    const nLon = parseFloat(lon);
    if (isNaN(nLat) || nLat < -90 || nLat > 90 || isNaN(nLon) || nLon < -180 || nLon > 180) {
      throw new Error(`Coordenadas inválidas: lat=${lat}, lon=${lon}`);
    }
    return { lat: nLat, lon: nLon };
  }

  /**
   * Verifica se as coordenadas estão dentro do território brasileiro via API.
   * @param {number} lat - Latitude (-90 a 90)
   * @param {number} lon - Longitude (-180 a 180)
   * @returns {Promise<GeoLocationResponse>} Resposta padronizada.
   */
  async isWithinBrazil(lat, lon) {
    const { lat: validLat, lon: validLon } = this.#validateCoordinates(lat, lon);

    try {
      const result = await this.#queryApis(validLat, validLon);
      return {
        isWithinBrazil: result.countryCode === 'BR',
        checkMethod: 'api',
        provider: result.provider,
        apiData: result._raw
      };
    } catch (error) {
      console.error('Falha na verificação com API:', error.message);
      throw new Error('Não foi possível determinar a localização via API.');
    }
  }

  async #queryApis(lat, lon) {
    const providers = [];
    if (this.#openCageApiKey) {
      providers.push(() => this.#queryOpenCage(lat, lon));
    } else {
      console.warn('Chave da API OpenCage não configurada. Usando apenas Nominatim, que pode ter limites de taxa mais estritos.');
    }
    providers.push(() => this.#queryNominatim(lat, lon));

    for (const provider of providers) {
      try {
        const result = await Promise.race([
          provider(),
          setTimeout(API_TIMEOUT_MS, 'Timeout do provedor').then(() => { 
            throw new Error('Timeout do provedor'); 
          })
        ]);

        if (result?.countryCode) return result;
      } catch (error) {
        console.warn(`Provedor de API falhou: ${error.message}`);
      }
    }
    throw new Error('Todos os provedores de API falharam.');
  }

  async #queryOpenCage(lat, lon) {
    const response = await this.#httpClient.get('https://api.opencagedata.com/geocode/v1/json', {
      params: { q: `${lat}+${lon}`, key: this.#openCageApiKey, limit: 1, countrycode: 'br' }
    });
    const components = response.data.results[0]?.components;
    return {
      countryCode: components?.['ISO_3166-1_alpha-2'] || null,
      provider: 'OpenCage',
      _raw: components
    };
  }

  async #queryNominatim(lat, lon) {
    const response = await this.#httpClient.get('https://nominatim.openstreetmap.org/reverse', {
      params: { lat, lon, format: 'json', 'accept-language': 'en', countrycodes: 'br' }
    });
    const address = response.data?.address;
    return {
      countryCode: address?.country_code?.toUpperCase() || null,
      provider: 'Nominatim',
      _raw: address
    };
  }
}
