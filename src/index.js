const express = require('express');
const yaml = require('js-yaml');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;
const prometheusUrl = process.env.PROMETHEUS_URL || 'http://128.140.76.71:9090';
const configPath = process.env.PROM_CONFIG_PATH || '/etc/prometheus/prometheus.yml';

app.use(express.json());
app.use(express.static('public'));

// Get current Prometheus configuration
app.get('/api/config', async (req, res) => {
  try {
    const response = await axios.get(`${prometheusUrl}/api/v1/status/config`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Prometheus configuration
app.post('/api/config', async (req, res) => {
  try {
    const config = req.body.config;
    const yamlConfig = yaml.dump(config);
    
    // Write to file
    fs.writeFileSync(configPath, yamlConfig);
    
    // Reload Prometheus
    await axios.post(`${prometheusUrl}/-/reload`);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 