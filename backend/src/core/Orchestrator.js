const researchAgent = require('../agents/ResearchAgent');
const businessAnalyst = require('../agents/BusinessAnalyst');
const solutionMapper = require('../agents/SolutionMapper');
const pitchWriter = require('../agents/PitchWriter');
const criticAgent = require('../agents/CriticAgent');
const dbQueries = require('../db/queries');

class Orchestrator {
    // Orchestrator: Coordinates execution between all specialized agents.
    // Manages state, pipeline flow, and handles the critic rewrite loop.
    constructor() {
        // Simple event emitter or callback registrar could go here
        this.activeRuns = new Map();
    }

    /**
     * Start the multi-agent pipeline
     * @param {string} campaignId 
     * @param {object} inputData 
     * @param {function} sseCallback 
     */
    async runPipeline(campaignId, inputData, sseCallback) {
        const emit = (data) => {
            if (sseCallback) sseCallback(data);
        };

        try {
            emit({ type: 'PIPELINE_START', campaignId });
            dbQueries.updateCampaignStatus(campaignId, 'RUNNING');

            // 1. Research Agent
            const researchData = await researchAgent.run(inputData, emit);
            dbQueries.updateCampaignData(campaignId, 'researchData', researchData);

            // 2. Business Analyst
            const analysisData = await businessAnalyst.run(researchData, emit);
            dbQueries.updateCampaignData(campaignId, 'analysisData', analysisData);

            // 3. Solution Mapper
            const mappingData = await solutionMapper.run(analysisData, inputData.serviceOffering, emit);
            dbQueries.updateCampaignData(campaignId, 'mappingData', mappingData);

            // 4. Pitch Writer & 5. Critic Loop
            let pitchData;
            let criticData;
            let attempts = 0;
            const MAX_ATTEMPTS = 2;
            let score = 0;
            let feedback = null;

            while (attempts < MAX_ATTEMPTS && score < 8) {
                attempts++;
                
                // Writer
                pitchData = await pitchWriter.run(mappingData, emit, feedback);
                dbQueries.updateCampaignData(campaignId, 'pitchData', pitchData);
                
                // Critic
                criticData = await criticAgent.run(pitchData, mappingData, emit);
                dbQueries.updateCampaignData(campaignId, 'criticData', criticData);
                
                score = criticData.overall_score || 0;
                
                if (score < 8 && attempts < MAX_ATTEMPTS) {
                    emit({ 
                        type: 'THOUGHT', 
                        agent: 'Orchestrator', 
                        message: `Critic score ${score}/10 is below threshold (8). Triggering rewrite (Attempt ${attempts + 1}/${MAX_ATTEMPTS})...` 
                    });
                    feedback = criticData;
                } else if (score >= 8) {
                    emit({ 
                        type: 'THOUGHT', 
                        agent: 'Orchestrator', 
                        message: `Critic score ${score}/10 meets quality threshold.` 
                    });
                } else {
                    emit({ 
                        type: 'THOUGHT', 
                        agent: 'Orchestrator', 
                        message: `Max attempts reached. Accepting current score of ${score}/10.` 
                    });
                }
            }

            dbQueries.updateCampaignStatus(campaignId, 'COMPLETED');
            emit({ type: 'PIPELINE_COMPLETE', campaignId });

        } catch (error) {
            console.error("Pipeline Error:", error);
            emit({ type: 'ERROR', agent: 'Orchestrator', message: error.message });
            dbQueries.updateCampaignStatus(campaignId, 'FAILED');
        }
    }
}

module.exports = new Orchestrator();
