const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initDB } = require('./db/init');
const dbQueries = require('./db/queries');
const orchestrator = require('./core/Orchestrator');

dotenv.config();
initDB();

const app = express();
app.use(cors());
app.use(express.json());

// Store active SSE clients
const clients = new Map();

app.post('/api/generate', async (req, res) => {
    try {
        const { companyName, websiteUrl, serviceOffering, context } = req.body;
        
        if (!companyName || !serviceOffering) {
            return res.status(400).json({ error: "companyName and serviceOffering are required" });
        }

        const campaignId = dbQueries.createCampaign({ companyName, websiteUrl, serviceOffering, context });
        
        // Start pipeline asynchronously
        orchestrator.runPipeline(campaignId, { companyName, websiteUrl, serviceOffering, context }, (event) => {
            // Forward events to the specific client
            if (clients.has(campaignId)) {
                const res = clients.get(campaignId);
                res.write(`data: ${JSON.stringify(event)}\n\n`);
                
                // End stream if complete or error
                if (event.type === 'PIPELINE_COMPLETE' || event.type === 'ERROR') {
                    res.end();
                    clients.delete(campaignId);
                }
            }
        });

        res.status(202).json({ campaignId, message: "Pipeline started" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// SSE Endpoint
app.get('/api/stream/:campaignId', (req, res) => {
    const { campaignId } = req.params;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    clients.set(campaignId, res);

    req.on('close', () => {
        clients.delete(campaignId);
    });
});

app.get('/api/campaigns/:campaignId', (req, res) => {
    try {
        const campaign = dbQueries.getCampaign(req.params.campaignId);
        if (!campaign) {
            return res.status(404).json({ error: "Campaign not found" });
        }
        res.json(campaign);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
