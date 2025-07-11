import express from 'express';
import { GeoLocationService } from './GeoLocationService.js';

// --- Configuração e Inicialização ---
const PORT = process.env.PORT || 3000;
const OPENCAGE_API_KEY = process.env.OPENCAGE_API_KEY;

const app = express();
app.use(express.json());

// Instancia o serviço de geolocalização
const geoLocationService = new GeoLocationService({ openCageApiKey: OPENCAGE_API_KEY });

// --- Rota Principal ---
app.get('/api/v1/check-brazil', async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({
      success: false,
      error: 'Parâmetros `lat` e `lon` são obrigatórios.',
    });
  }

  try {
    const result = await geoLocationService.isWithinBrazil(lat, lon);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    // Distingue erros de validação de erros internos
    if (error.message.startsWith('Coordenadas inválidas')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    console.error(`[REQUEST_ERROR] lat=${lat}, lon=${lon}:`, error);
    res.status(500).json({
      success: false,
      error: 'Ocorreu um erro interno ao processar a sua solicitação.',
    });
  }
});

// --- Rota de Health Check ---
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Inicialização do Servidor ---
app.listen(PORT, () => {
  console.log(`Servidor de geolocalização (Online) rodando na porta ${PORT}`);
  if (!OPENCAGE_API_KEY) {
    console.warn('AVISO: A chave da API OpenCage não foi definida no arquivo .env. O serviço pode enfrentar limites de taxa mais rapidamente.');
  }
  console.log(`Exemplo de uso: http://localhost:${PORT}/api/v1/check-brazil?lat=-3.8196&lon=-32.4422`);
});

