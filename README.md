# Serviço de Geolocalização BR Online

## Visão Geral

O **Serviço de Geolocalização BR Online** é uma API REST robusta e eficiente para verificar se coordenadas geográficas (latitude e longitude) estão localizadas dentro do território brasileiro. O serviço utiliza exclusivamente APIs externas confiáveis (OpenCage Data e Nominatim) para fornecer resultados precisos e atualizados.

### Características Principais

- ✅ **Verificação precisa** de coordenadas em território brasileiro
- ✅ **Múltiplos provedores** de API (OpenCage, Nominatim) com fallback automático
- ✅ **Rate limiting** e retry automático para alta disponibilidade
- ✅ **Validação rigorosa** de coordenadas
- ✅ **API RESTful** simples e intuitiva
- ✅ **Health check** integrado
- ✅ **Logs detalhados** para monitoramento

## Índice

1. [Instalação](#instalação)
2. [Configuração](#configuração)
3. [Uso Básico](#uso-básico)
4. [Documentação da API](#documentação-da-api)
5. [Casos de Uso](#casos-de-uso)
6. [Integração com Outros Projetos](#integração-com-outros-projetos)
7. [Arquitetura](#arquitetura)
8. [Desenvolvimento](#desenvolvimento)
9. [Monitoramento](#monitoramento)
10. [Troubleshooting](#troubleshooting)
11. [Contribuição](#contribuição)
12. [Licença](#licença)

## Instalação

### Pré-requisitos

- Node.js >= 14.0.0
- npm ou yarn
- Conexão com internet (para APIs externas)

### Instalação Local

```bash
# Clone o repositório
git clone https://github.com/fgamajr/servico-geolocalizacao

# Entre no diretório
cd servico-geolocalizacao-br-online

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

### Instalação via Docker

```bash
# Build da imagem
docker build -t geolocation-br .

# Execute o container
docker run -p 3000:3000 -e OPENCAGE_API_KEY=sua_chave_aqui geolocation-br
```

## Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Porta em que o servidor irá rodar
PORT=3000

# Chave da API da OpenCage Data (recomendado)
# Obtenha uma chave gratuita em: https://opencagedata.com/
OPENCAGE_API_KEY=sua_chave_aqui
```

### Configuração da API OpenCage

É **altamente recomendado** configurar uma chave da API OpenCage:

1. Visite [OpenCage Data](https://opencagedata.com/)
2. Crie uma conta gratuita
3. Obtenha sua chave de API
4. Configure a variável `OPENCAGE_API_KEY` no arquivo `.env`

**Benefícios da chave OpenCage:**
- Maior limite de requisições por dia
- Melhor performance e confiabilidade
- Menor latência de resposta
- Suporte prioritário

## Uso Básico

### Iniciando o Servidor

```bash
# Modo produção
npm start

# Modo desenvolvimento (com hot-reload)
npm run dev
```

### Fazendo Requisições

#### Exemplo básico com curl

```bash
# Verificar se as coordenadas estão no Brasil
curl "http://localhost:3000/api/v1/check-brazil?lat=-15.7942&lon=-47.8822"

# Resposta esperada:
{
  "success": true,
  "data": {
    "isWithinBrazil": true,
    "checkMethod": "api",
    "provider": "OpenCage",
    "apiData": {
      "ISO_3166-1_alpha-2": "BR",
      "country": "Brazil",
      "state": "Distrito Federal"
    }
  }
}
```

#### Exemplo com JavaScript/Node.js

```javascript
const axios = require('axios');

async function checkBrazilLocation(lat, lon) {
  try {
    const response = await axios.get(`http://localhost:3000/api/v1/check-brazil`, {
      params: { lat, lon }
    });
    
    return response.data;
  } catch (error) {
    console.error('Erro na verificação:', error.response?.data || error.message);
    throw error;
  }
}

// Uso
checkBrazilLocation(-15.7942, -47.8822)
  .then(result => console.log('Resultado:', result))
  .catch(error => console.error('Erro:', error));
```

#### Exemplo com Python

```python
import requests

def check_brazil_location(lat, lon):
    try:
        response = requests.get(
            'http://localhost:3000/api/v1/check-brazil',
            params={'lat': lat, 'lon': lon}
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Erro na verificação: {e}")
        raise

# Uso
result = check_brazil_location(-15.7942, -47.8822)
print(f"Resultado: {result}")
```

## Documentação da API

### Endpoints

#### `GET /api/v1/check-brazil`

Verifica se as coordenadas fornecidas estão dentro do território brasileiro.

**Parâmetros de Query:**
- `lat` (obrigatório): Latitude (-90 a 90)
- `lon` (obrigatório): Longitude (-180 a 180)

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "isWithinBrazil": true,
    "checkMethod": "api",
    "provider": "OpenCage",
    "apiData": {
      "ISO_3166-1_alpha-2": "BR",
      "country": "Brazil",
      "state": "Distrito Federal"
    }
  }
}
```

**Resposta de Erro (400):**
```json
{
  "success": false,
  "error": "Parâmetros `lat` e `lon` são obrigatórios."
}
```

**Resposta de Erro (500):**
```json
{
  "success": false,
  "error": "Ocorreu um erro interno ao processar a sua solicitação."
}
```

#### `GET /health`

Endpoint de health check para monitoramento.

**Resposta (200):**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Casos de Uso

### 1. Validação de Endereços E-commerce

```javascript
// Validar se o endereço de entrega está no Brasil
async function validateDeliveryAddress(coordinates) {
  const result = await checkBrazilLocation(coordinates.lat, coordinates.lon);
  
  if (!result.data.isWithinBrazil) {
    throw new Error('Desculpe, não entregamos fora do Brasil');
  }
  
  return result;
}
```

### 2. Controle de Acesso Geográfico

```javascript
// Permitir acesso apenas para usuários no Brasil
async function geoFence(userCoordinates) {
  const result = await checkBrazilLocation(userCoordinates.lat, userCoordinates.lon);
  
  if (!result.data.isWithinBrazil) {
    return {
      allowed: false,
      message: 'Acesso restrito ao território brasileiro'
    };
  }
  
  return { allowed: true };
}
```

### 3. Análise de Dados Geográficos

```javascript
// Filtrar dados geográficos por localização no Brasil
async function filterBrazilianData(dataPoints) {
  const brazilianPoints = [];
  
  for (const point of dataPoints) {
    const result = await checkBrazilLocation(point.lat, point.lon);
    
    if (result.data.isWithinBrazil) {
      brazilianPoints.push({
        ...point,
        verifiedBrazilian: true,
        verificationProvider: result.data.provider
      });
    }
  }
  
  return brazilianPoints;
}
```

### 4. Integração com Aplicativos Móveis

```javascript
// Verificar localização atual do usuário
async function checkCurrentLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const result = await fetch(`/api/v1/check-brazil?lat=${latitude}&lon=${longitude}`);
          const data = await result.json();
          
          resolve(data);
        } catch (error) {
          reject(error);
        }
      },
      (error) => reject(error)
    );
  });
}
```

## Integração com Outros Projetos

### Como Biblioteca (Módulo Node.js)

```javascript
// Importar o serviço diretamente
import { GeoLocationService } from './src/GeoLocationService.js';

// Configurar o serviço
const geoService = new GeoLocationService({
  openCageApiKey: process.env.OPENCAGE_API_KEY
});

// Usar em seu projeto
async function myFunction() {
  try {
    const result = await geoService.isWithinBrazil(-15.7942, -47.8822);
    console.log('Localização no Brasil:', result.isWithinBrazil);
  } catch (error) {
    console.error('Erro:', error.message);
  }
}
```

### Como Microserviço

#### Docker Compose

```yaml
version: '3.8'
services:
  geolocation-br:
    build: .
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - OPENCAGE_API_KEY=sua_chave_aqui
    restart: unless-stopped
    
  seu-app:
    depends_on:
      - geolocation-br
    environment:
      - GEOLOCATION_SERVICE_URL=http://geolocation-br:3000
```

#### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: geolocation-br
spec:
  replicas: 3
  selector:
    matchLabels:
      app: geolocation-br
  template:
    metadata:
      labels:
        app: geolocation-br
    spec:
      containers:
      - name: geolocation-br
        image: geolocation-br:latest
        ports:
        - containerPort: 3000
        env:
        - name: OPENCAGE_API_KEY
          valueFrom:
            secretKeyRef:
              name: geolocation-secrets
              key: opencage-api-key
---
apiVersion: v1
kind: Service
metadata:
  name: geolocation-br-service
spec:
  selector:
    app: geolocation-br
  ports:
  - port: 80
    targetPort: 3000
```

### Integração com Frameworks Web

#### Express.js

```javascript
const express = require('express');
const axios = require('axios');

const app = express();

// Middleware para verificar localização
app.use('/api/protected', async (req, res, next) => {
  const { lat, lon } = req.query;
  
  if (!lat || !lon) {
    return res.status(400).json({ error: 'Coordenadas obrigatórias' });
  }
  
  try {
    const result = await axios.get(`http://localhost:3000/api/v1/check-brazil?lat=${lat}&lon=${lon}`);
    
    if (!result.data.data.isWithinBrazil) {
      return res.status(403).json({ error: 'Acesso restrito ao Brasil' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Erro na verificação de localização' });
  }
});
```

#### FastAPI (Python)

```python
from fastapi import FastAPI, HTTPException, Depends
import httpx

app = FastAPI()

async def verify_brazil_location(lat: float, lon: float):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"http://localhost:3000/api/v1/check-brazil?lat={lat}&lon={lon}"
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Erro na verificação")
        
        data = response.json()
        if not data["data"]["isWithinBrazil"]:
            raise HTTPException(status_code=403, detail="Acesso restrito ao Brasil")
        
        return data

@app.get("/protected-endpoint")
async def protected_endpoint(
    lat: float,
    lon: float,
    location_check = Depends(verify_brazil_location)
):
    return {"message": "Acesso autorizado", "location": location_check}
```

## Arquitetura

### Diagrama de Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Cliente       │    │   Serviço       │    │   APIs Externas │
│   (Browser/App) │───▶│   Geolocalização│───▶│   OpenCage      │
│                 │    │   BR Online     │    │   Nominatim     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Validação     │
                       │   Rate Limiting │
                       │   Retry Logic   │
                       └─────────────────┘
```

### Componentes Principais

#### 1. **GeoLocationService**
- Classe principal que gerencia a lógica de verificação
- Implementa fallback entre provedores
- Gerencia rate limiting e retry automático

#### 2. **Server (Express.js)**
- API REST que expõe os endpoints
- Validação de parâmetros
- Tratamento de erros padronizado

#### 3. **Provedores de API**
- **OpenCage Data**: Provedor principal (requer chave)
- **Nominatim**: Provedor de fallback (gratuito)

### Fluxo de Execução

1. **Recebimento da requisição**: Validação de parâmetros
2. **Validação de coordenadas**: Verificação de formato e limites
3. **Consulta às APIs**: Tentativa com OpenCage, fallback para Nominatim
4. **Processamento da resposta**: Normalização dos dados
5. **Resposta ao cliente**: Formato padronizado

## Desenvolvimento

### Estrutura do Projeto

```
servico-geolocalizacao-br-online/
├── src/
│   ├── GeoLocationService.js    # Lógica principal do serviço
│   └── server.js                # Servidor Express
├── .env                         # Variáveis de ambiente
├── .gitignore                   # Arquivos ignorados pelo Git
├── package.json                 # Dependências e scripts
└── README.md                    # Documentação
```

### Scripts Disponíveis

```bash
# Executar em produção
npm start

# Executar em desenvolvimento com hot-reload
npm run dev

# Executar testes (quando implementados)
npm test
```

### Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env

# Iniciar em modo desenvolvimento
npm run dev

# Testar endpoint
curl "http://localhost:3000/api/v1/check-brazil?lat=-15.7942&lon=-47.8822"
```

### Extensões Recomendadas

Para adicionar novas funcionalidades:

#### 1. **Cache de Resultados**
```javascript
// Implementar cache Redis para melhorar performance
const redis = require('redis');
const client = redis.createClient();

async function getCachedResult(lat, lon) {
  const key = `geo:${lat}:${lon}`;
  const cached = await client.get(key);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const result = await geoService.isWithinBrazil(lat, lon);
  await client.setEx(key, 3600, JSON.stringify(result)); // Cache por 1 hora
  
  return result;
}
```

#### 2. **Métricas e Monitoring**
```javascript
// Implementar métricas Prometheus
const client = require('prom-client');

const requestCounter = new client.Counter({
  name: 'geolocation_requests_total',
  help: 'Total number of geolocation requests',
  labelNames: ['provider', 'result']
});

const responseTime = new client.Histogram({
  name: 'geolocation_response_time_seconds',
  help: 'Response time for geolocation requests',
  labelNames: ['provider']
});
```

#### 3. **Autenticação por API Key**
```javascript
// Middleware para autenticação
function authenticateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || !isValidApiKey(apiKey)) {
    return res.status(401).json({ error: 'API key inválida' });
  }
  
  next();
}

app.use('/api/v1', authenticateApiKey);
```

## Monitoramento

### Health Check

O serviço inclui um endpoint de health check:

```bash
curl http://localhost:3000/health
```

### Logs

O serviço gera logs detalhados:

```bash
# Logs de inicialização
Servidor de geolocalização (Online) rodando na porta 3000
Exemplo de uso: http://localhost:3000/api/v1/check-brazil?lat=-3.8196&lon=-32.4422

# Logs de requisições com erro
[REQUEST_ERROR] lat=-15.7942, lon=-47.8822: Todos os provedores de API falharam.

# Logs de advertência
AVISO: A chave da API OpenCage não foi definida no arquivo .env
```

### Métricas Recomendadas

Para monitoramento em produção, considere acompanhar:

- **Taxa de sucesso/erro** das requisições
- **Latência** das respostas
- **Uso de provedores** (OpenCage vs Nominatim)
- **Rate limiting** e throttling
- **Status das APIs externas**

## Troubleshooting

### Problemas Comuns

#### 1. **Erro 500 - Todos os provedores falharam**

**Causa**: APIs externas indisponíveis ou rate limit excedido

**Soluções**:
- Verificar conexão com internet
- Configurar chave OpenCage API
- Aguardar reset do rate limit
- Verificar logs para detalhes específicos

#### 2. **Erro 400 - Coordenadas inválidas**

**Causa**: Parâmetros lat/lon inválidos

**Soluções**:
- Verificar formato dos parâmetros (números decimais)
- Garantir que lat está entre -90 e 90
- Garantir que lon está entre -180 e 180

#### 3. **Lentidão nas respostas**

**Causa**: Dependência de APIs externas ou falta de chave OpenCage

**Soluções**:
- Configurar chave OpenCage API
- Implementar cache
- Aumentar timeout se necessário
- Verificar rede/firewall

#### 4. **Rate limiting excessivo**

**Causa**: Muitas requisições simultâneas

**Soluções**:
- Implementar cache local
- Usar chave OpenCage para limites maiores
- Implementar queue para requisições
- Distribuir carga entre instâncias

### Debugging

Para debugar problemas:

```bash
# Ativar logs detalhados
DEBUG=* npm start

# Verificar variáveis de ambiente
node -e "console.log(process.env)"

# Testar APIs diretamente
curl "https://api.opencagedata.com/geocode/v1/json?q=-15.7942+-47.8822&key=SUA_CHAVE&limit=1"
```

## Performance e Otimização

### Recomendações de Performance

#### 1. **Usar Chave OpenCage**
- Limite diário: 2.500 requisições (grátis) vs 1 req/s (Nominatim)
- Melhor performance e disponibilidade

#### 2. **Implementar Cache**
```javascript
// Cache em memória simples
const cache = new Map();

function getCachedResult(lat, lon) {
  const key = `${lat},${lon}`;
  
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const result = geoService.isWithinBrazil(lat, lon);
  cache.set(key, result);
  
  return result;
}
```

#### 3. **Load Balancing**
```yaml
# nginx.conf
upstream geolocation_backend {
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}

server {
    location /api/v1/check-brazil {
        proxy_pass http://geolocation_backend;
    }
}
```

## Segurança

### Considerações de Segurança

#### 1. **Rate Limiting**
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requisições por IP
  message: 'Muitas requisições, tente novamente mais tarde'
});

app.use('/api/v1', limiter);
```

#### 2. **Validação de Input**
```javascript
const { body, validationResult } = require('express-validator');

app.get('/api/v1/check-brazil', [
  body('lat').isFloat({ min: -90, max: 90 }),
  body('lon').isFloat({ min: -180, max: 180 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // ... resto da lógica
});
```

#### 3. **Proteção de Chaves API**
```javascript
// Usar variáveis de ambiente
const apiKey = process.env.OPENCAGE_API_KEY;

// Nunca expor chaves nos logs
console.log(`Usando chave: ${apiKey ? '[CONFIGURADA]' : '[NÃO CONFIGURADA]'}`);
```

## Contribuição

### Como Contribuir

1. **Fork** o repositório
2. **Crie** uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. **Commit** suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. **Push** para a branch (`git push origin feature/nova-funcionalidade`)
5. **Crie** um Pull Request

### Padrões de Código

- Use **ES6+ modules** 
- Siga o **padrão de nomeação** existente
- Adicione **testes** para novas funcionalidades
- Mantenha **cobertura de testes** alta
- Documente **APIs públicas**

### Estrutura de Commits

```
tipo(escopo): descrição breve

Descrição mais detalhada se necessário.

Fixes #123
```

**Tipos de commit:**
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação de código
- `refactor`: Refatoração
- `test`: Testes
- `chore`: Manutenção

## Roadmap

### Próximas Funcionalidades

- [ ] **Cache distribuído** (Redis)
- [ ] **Métricas Prometheus**
- [ ] **API de geocodificação** reversa
- [ ] **Suporte a múltiplos países**
- [ ] **WebSocket** para tempo real
- [ ] **Dashboard** de monitoramento
- [ ] **Batch processing** de coordenadas
- [ ] **Suporte a polígonos** customizados

### Melhorias Técnicas

- [ ] **Testes unitários** completos
- [ ] **Testes de integração**
- [ ] **Documentação OpenAPI**
- [ ] **Container otimizado**
- [ ] **CI/CD pipeline**
- [ ] **Monitoring avançado**

## FAQ

### Perguntas Frequentes

**Q: O serviço funciona offline?**
A: Não, o serviço depende de APIs externas para verificar a localização.

**Q: Qual a precisão das coordenadas?**
A: A precisão depende das APIs externas, geralmente é alta para coordenadas dentro do Brasil.

**Q: Posso usar sem a chave OpenCage?**
A: Sim, mas com limitações de rate limiting mais rigorosas usando apenas Nominatim.

**Q: Como implementar cache?**
A: Veja a seção de [Performance e Otimização](#performance-e-otimização) para exemplos.

**Q: O serviço suporta HTTPS?**
A: Sim, configure um reverse proxy (nginx) ou use um load balancer com SSL.

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## Suporte

Para suporte, dúvidas ou sugestões:

- 📧 Email: contato@empresa.com
- 🐛 Issues: [GitHub Issues](https://github.com/seuusuario/servico-geolocalizacao-br-online/issues)
- 📖 Documentação: [Wiki do Projeto](https://github.com/seuusuario/servico-geolocalizacao-br-online/wiki)

---

**Desenvolvido com ❤️ para a comunidade brasileira de desenvolvedores.**