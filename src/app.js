require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const yaml = require('yaml');
const fs = require('fs');
const fetch = require('node-fetch');

const app = express();

// Configuration
const PROM_YML_PATH = '/app/prometheus.yml';
const PROMETHEUS_URL = 'http://128.140.76.71:9090';
const PORT = 3322;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Helper to read and parse prometheus.yml
function readPrometheusConfig() {
  try {
    const file = fs.readFileSync(PROM_YML_PATH, 'utf8');
    return file;
  } catch (error) {
    console.error('Error reading prometheus.yml:', error);
    return '';
  }
}

// Helper to write prometheus.yml
function writePrometheusConfig(content) {
  try {
    fs.writeFileSync(PROM_YML_PATH, content, 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing prometheus.yml:', error);
    return false;
  }
}

// Helper to validate YAML
function validateYaml(content) {
  try {
    yaml.parse(content);
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// Home page: show YAML editor
app.get('/', (req, res) => {
  try {
    const yamlContent = readPrometheusConfig();
    res.render('index', { yamlContent });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Save YAML
app.post('/save', (req, res) => {
  try {
    const { yaml: yamlContent } = req.body;
    
    // Validate YAML before saving
    const validation = validateYaml(yamlContent);
    if (!validation.valid) {
      return res.json({ success: false, error: validation.error });
    }

    // Save the file
    const success = writePrometheusConfig(yamlContent);
    if (success) {
      res.json({ success: true });
    } else {
      res.json({ success: false, error: 'Failed to write file' });
    }
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Test YAML
app.post('/test', (req, res) => {
  try {
    const { yaml: yamlContent } = req.body;
    const validation = validateYaml(yamlContent);
    
    if (validation.valid) {
      res.json({ success: true });
    } else {
      res.json({ success: false, error: validation.error });
    }
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Reload Prometheus configuration
app.post('/reload', async (req, res) => {
  try {
    const response = await fetch(`${PROMETHEUS_URL}/-/reload`, {
      method: 'POST'
    });

    if (response.ok) {
      res.json({ success: true });
    } else {
      const error = await response.text();
      res.json({ success: false, error: `Failed to reload Prometheus: ${error}` });
    }
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Prometheus config path: ${PROM_YML_PATH}`);
  console.log(`Prometheus URL: ${PROMETHEUS_URL}`);
}); 