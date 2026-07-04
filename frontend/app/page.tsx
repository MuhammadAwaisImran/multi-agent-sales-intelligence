"use client";

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Play, CheckCircle2, AlertCircle, Terminal, FileText, Briefcase, Award, MessageSquare } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001/api';

export default function Dashboard() {
  const [formData, setFormData] = useState({
    companyName: '',
    websiteUrl: '',
    serviceOffering: '',
    context: ''
  });

  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('logs');
  const [status, setStatus] = useState<'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED'>('IDLE');
  
  // States for outputs
  const [logs, setLogs] = useState<any[]>([]);
  const [researchData, setResearchData] = useState<any>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [pitchData, setPitchData] = useState<any>(null);
  const [criticData, setCriticData] = useState<any>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName || !formData.serviceOffering) return;

    setStatus('RUNNING');
    setLogs([]);
    setResearchData(null);
    setAnalysisData(null);
    setPitchData(null);
    setCriticData(null);
    setActiveTab('logs');

    try {
      const response = await axios.post(`${API_BASE_URL}/generate`, formData);
      const newCampaignId = response.data.campaignId;
      setCampaignId(newCampaignId);

      // Start SSE Connection
      const eventSource = new EventSource(`${API_BASE_URL}/stream/${newCampaignId}`);
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), ...data }]);

        if (data.type === 'PIPELINE_COMPLETE') {
          setStatus('COMPLETED');
          eventSource.close();
          fetchFinalData(newCampaignId);
        } else if (data.type === 'ERROR') {
          setStatus('FAILED');
          eventSource.close();
        }
      };

      eventSource.onerror = (err) => {
        console.error('SSE Error:', err);
        setStatus('FAILED');
        eventSource.close();
      };
      
    } catch (err: any) {
      console.error(err);
      setStatus('FAILED');
      setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), type: 'ERROR', message: err.message }]);
    }
  };

  const fetchFinalData = async (id: string) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/campaigns/${id}`);
      setResearchData(res.data.researchData);
      setAnalysisData(res.data.analysisData);
      setPitchData(res.data.pitchData);
      setCriticData(res.data.criticData);
      setActiveTab('evaluation'); // Auto-switch to evaluation on finish
    } catch (err) {
      console.error("Failed to fetch final data", err);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      <header className="border-b border-neutral-800 bg-neutral-900 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-indigo-400" />
          Multi-Agent Sales Intelligence
        </h1>
        <div className="flex items-center gap-2 text-sm font-medium">
          Status: 
          {status === 'IDLE' && <span className="text-neutral-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Ready</span>}
          {status === 'RUNNING' && <span className="text-blue-400 flex items-center gap-1 animate-pulse"><Play className="w-4 h-4"/> Processing...</span>}
          {status === 'COMPLETED' && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Completed</span>}
          {status === 'FAILED' && <span className="text-red-400 flex items-center gap-1"><AlertCircle className="w-4 h-4"/> Failed</span>}
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Input */}
        <aside className="w-80 border-r border-neutral-800 bg-neutral-900/50 p-6 overflow-y-auto">
          <form onSubmit={handleStart} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">Target Company <span className="text-red-400">*</span></label>
              <input 
                required
                type="text" 
                value={formData.companyName}
                onChange={e => setFormData({...formData, companyName: e.target.value})}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                placeholder="e.g. Acme Corp" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">Website URL</label>
              <input 
                type="url" 
                value={formData.websiteUrl}
                onChange={e => setFormData({...formData, websiteUrl: e.target.value})}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                placeholder="https://example.com" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">Your Service Offering <span className="text-red-400">*</span></label>
              <textarea 
                required
                value={formData.serviceOffering}
                onChange={e => setFormData({...formData, serviceOffering: e.target.value})}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm h-24 focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                placeholder="Describe what you sell..." 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">Additional Context</label>
              <textarea 
                value={formData.context}
                onChange={e => setFormData({...formData, context: e.target.value})}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm h-20 focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                placeholder="Any special focus or goal?" 
              />
            </div>
            
            <button 
              type="submit" 
              disabled={status === 'RUNNING'}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-md py-2 text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {status === 'RUNNING' ? 'Agents are working...' : 'Launch Agents'}
            </button>
          </form>
        </aside>

        {/* Main Content Area */}
        <section className="flex-1 flex flex-col overflow-hidden bg-neutral-950">
          
          {/* Tabs */}
          <div className="flex border-b border-neutral-800 px-4 bg-neutral-900/30">
            <button 
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 ${activeTab === 'logs' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-neutral-400 hover:text-neutral-200'}`}
            >
              <Terminal className="w-4 h-4"/> Agent Logs
            </button>
            <button 
              onClick={() => setActiveTab('research')}
              disabled={!researchData}
              className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 disabled:opacity-30 ${activeTab === 'research' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-neutral-400 hover:text-neutral-200'}`}
            >
              <FileText className="w-4 h-4"/> Research Profile
            </button>
            <button 
              onClick={() => setActiveTab('analysis')}
              disabled={!analysisData}
              className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 disabled:opacity-30 ${activeTab === 'analysis' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-neutral-400 hover:text-neutral-200'}`}
            >
              <Briefcase className="w-4 h-4"/> Business Analysis
            </button>
            <button 
              onClick={() => setActiveTab('evaluation')}
              disabled={!criticData}
              className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 disabled:opacity-30 ${activeTab === 'evaluation' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-neutral-400 hover:text-neutral-200'}`}
            >
              <Award className="w-4 h-4"/> Critic Score
            </button>
            <button 
              onClick={() => setActiveTab('pitch')}
              disabled={!pitchData}
              className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 disabled:opacity-30 ${activeTab === 'pitch' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-neutral-400 hover:text-neutral-200'}`}
            >
              <MessageSquare className="w-4 h-4"/> Final Outreach
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            
            {activeTab === 'logs' && (
              <div className="bg-[#0f111a] border border-neutral-800 rounded-lg p-4 font-mono text-sm shadow-inner min-h-full">
                {logs.length === 0 ? (
                  <div className="text-neutral-600 flex items-center justify-center h-full">Waiting for agent execution...</div>
                ) : (
                  <div className="space-y-3">
                    {logs.map((log, i) => (
                      <div key={i} className="flex gap-3">
                        <span className="text-neutral-500 shrink-0">[{log.time}]</span>
                        {log.type === 'AGENT_START' && <span className="text-blue-400 font-semibold">{log.agent} started.</span>}
                        {log.type === 'AGENT_COMPLETE' && <span className="text-emerald-400 font-semibold">{log.agent} completed successfully.</span>}
                        {log.type === 'THOUGHT' && <span><span className="text-purple-400 font-bold">{log.agent}:</span> <span className="text-neutral-300">{log.message}</span></span>}
                        {log.type === 'TOOL_USE' && <span><span className="text-amber-400 font-bold">[{log.tool}]:</span> <span className="text-neutral-300">{log.message}</span></span>}
                        {log.type === 'ERROR' && <span><span className="text-red-500 font-bold">ERROR:</span> <span className="text-red-400">{log.message}</span></span>}
                        {log.type === 'PIPELINE_COMPLETE' && <span className="text-emerald-500 font-bold">--- PIPELINE EXECUTION FINISHED ---</span>}
                      </div>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'research' && researchData && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">{researchData.company}</h2>
                  <p className="text-indigo-400 font-medium">{researchData.industry}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Business Model</h3>
                    <p className="text-neutral-200">{researchData.business_model}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Positioning</h3>
                    <p className="text-neutral-200">{researchData.positioning}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 pt-4 border-t border-neutral-800">
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Products</h3>
                    <ul className="list-disc list-inside text-neutral-300 space-y-1">
                      {researchData.products?.map((p: string, i: number) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Services</h3>
                    <ul className="list-disc list-inside text-neutral-300 space-y-1">
                      {researchData.services?.map((p: string, i: number) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Strengths</h3>
                    <ul className="list-disc list-inside text-emerald-400 space-y-1">
                      {researchData.strengths?.map((p: string, i: number) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                </div>
                
                {researchData.explainability && (
                  <div className="bg-indigo-950/30 border border-indigo-500/30 rounded p-4 mt-6">
                    <h4 className="text-indigo-400 font-semibold mb-2">Agent Reasoning</h4>
                    <p className="text-sm text-neutral-300 mb-1"><strong className="text-neutral-200">Observation:</strong> {researchData.explainability.observation}</p>
                    <p className="text-sm text-neutral-300"><strong className="text-neutral-200">Evidence:</strong> {researchData.explainability.evidence}</p>
                  </div>
                )}
              </div>
            )}

            {/* Analysis Tab */}
            {activeTab === 'analysis' && analysisData && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-2">Customer Journey</h3>
                  <p className="text-neutral-200 bg-neutral-800 p-4 rounded">{analysisData.customer_journey}</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-2">Retention Gaps</h3>
                      <ul className="list-disc list-inside text-neutral-300 space-y-1">
                        {analysisData.retention_gaps?.map((p: string, i: number) => <li key={i}>{p}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-2">Marketing Gaps</h3>
                      <ul className="list-disc list-inside text-neutral-300 space-y-1">
                        {analysisData.marketing_gaps?.map((p: string, i: number) => <li key={i}>{p}</li>)}
                      </ul>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-2">Revenue Drivers</h3>
                      <ul className="list-disc list-inside text-neutral-300 space-y-1">
                        {analysisData.revenue_drivers?.map((p: string, i: number) => <li key={i}>{p}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-2">Expansion Opportunities (Upsell/Cross)</h3>
                      <ul className="list-disc list-inside text-neutral-300 space-y-1">
                        {analysisData.upsell_opportunities?.map((p: string, i: number) => <li key={i}>{p}</li>)}
                        {analysisData.cross_sell_opportunities?.map((p: string, i: number) => <li key={i}>{p}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
                {analysisData.explainability && (
                  <div className="bg-indigo-950/30 border border-indigo-500/30 rounded p-4 mt-6">
                    <h4 className="text-indigo-400 font-semibold mb-2">Agent Reasoning</h4>
                    <p className="text-sm text-neutral-300 mb-1"><strong className="text-neutral-200">Observation:</strong> {analysisData.explainability.observation}</p>
                    <p className="text-sm text-neutral-300"><strong className="text-neutral-200">Recommendation:</strong> {analysisData.explainability.recommendation}</p>
                  </div>
                )}
              </div>
            )}

            {/* Evaluation Tab */}
            {activeTab === 'evaluation' && criticData && (
              <div className="max-w-3xl mx-auto space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-white mb-2">Score: {criticData.overall_score}/10</h2>
                  <p className="text-neutral-400">Final evaluation from the Critic Agent</p>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
                  <div className="space-y-6">
                    {['personalization', 'specificity', 'business_insight', 'persuasiveness', 'clarity'].map((metric) => (
                      <div key={metric}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-neutral-300 capitalize">{metric.replace('_', ' ')}</span>
                          <span className="text-sm font-bold text-white">{criticData[metric]}/10</span>
                        </div>
                        <div className="w-full bg-neutral-800 rounded-full h-2">
                          <div 
                            className="bg-indigo-500 h-2 rounded-full" 
                            style={{ width: `${(criticData[metric] / 10) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-5">
                    <h3 className="text-red-400 font-semibold mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4"/> Weaknesses Identified
                    </h3>
                    <ul className="list-disc list-inside text-sm text-neutral-300 space-y-2">
                      {criticData.weaknesses?.map((w: string, i: number) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                  <div className="bg-emerald-950/20 border border-emerald-900/50 rounded-lg p-5">
                    <h3 className="text-emerald-400 font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4"/> Suggested Improvements
                    </h3>
                    <ul className="list-disc list-inside text-sm text-neutral-300 space-y-2">
                      {criticData.improvements?.map((w: string, i: number) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Pitch Tab */}
            {activeTab === 'pitch' && pitchData && (
              <div className="space-y-6 max-w-4xl mx-auto">
                <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
                  <div className="bg-neutral-800/50 px-4 py-3 border-b border-neutral-800 font-medium text-neutral-200">
                    Cold Email
                  </div>
                  <div className="p-6 whitespace-pre-wrap text-neutral-300 text-sm font-sans leading-relaxed">
                    {pitchData.email}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
                    <div className="bg-[#0a66c2]/10 px-4 py-3 border-b border-[#0a66c2]/20 font-medium text-[#0a66c2]">
                      LinkedIn Message
                    </div>
                    <div className="p-5 whitespace-pre-wrap text-neutral-300 text-sm">
                      {pitchData.linkedin_message}
                    </div>
                  </div>
                  
                  <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
                    <div className="bg-amber-500/10 px-4 py-3 border-b border-amber-500/20 font-medium text-amber-500">
                      Discovery Call Opener
                    </div>
                    <div className="p-5 whitespace-pre-wrap text-neutral-300 text-sm">
                      {pitchData.call_opener}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </section>
      </main>
    </div>
  );
}
