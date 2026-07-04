const { db } = require('./init');
const crypto = require('crypto');

function createCampaign(data) {
    const id = crypto.randomUUID();
    const stmt = db.prepare(`
        INSERT INTO campaigns (id, companyName, websiteUrl, serviceOffering, context)
        VALUES (@id, @companyName, @websiteUrl, @serviceOffering, @context)
    `);
    
    stmt.run({
        id,
        companyName: data.companyName,
        websiteUrl: data.websiteUrl,
        serviceOffering: data.serviceOffering,
        context: data.context
    });
    
    return id;
}

function updateCampaignData(id, field, data) {
    const allowedFields = ['researchData', 'analysisData', 'mappingData', 'pitchData', 'criticData'];
    if (!allowedFields.includes(field)) {
        throw new Error(`Invalid field: ${field}`);
    }
    
    const stmt = db.prepare(`
        UPDATE campaigns 
        SET ${field} = @data
        WHERE id = @id
    `);
    
    stmt.run({
        id,
        data: JSON.stringify(data)
    });
}

function updateCampaignStatus(id, status) {
    const stmt = db.prepare(`
        UPDATE campaigns 
        SET status = @status
        WHERE id = @id
    `);
    
    stmt.run({
        id,
        status
    });
}

function getCampaign(id) {
    const stmt = db.prepare(`SELECT * FROM campaigns WHERE id = ?`);
    const row = stmt.get(id);
    if (!row) return null;
    
    return {
        ...row,
        researchData: row.researchData ? JSON.parse(row.researchData) : null,
        analysisData: row.analysisData ? JSON.parse(row.analysisData) : null,
        mappingData: row.mappingData ? JSON.parse(row.mappingData) : null,
        pitchData: row.pitchData ? JSON.parse(row.pitchData) : null,
        criticData: row.criticData ? JSON.parse(row.criticData) : null,
    };
}

module.exports = {
    createCampaign,
    updateCampaignData,
    updateCampaignStatus,
    getCampaign
};
