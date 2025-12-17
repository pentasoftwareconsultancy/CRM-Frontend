import React, { useEffect, useState } from 'react';
import { api } from '../services/mockApi';
import { Plus, GripVertical } from 'lucide-react';

const STAGES = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];

const Pipeline = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    const data = await api.getDeals();
    setDeals(data);
    setLoading(false);
  };

  const moveDeal = async (dealId, direction) => {
    const deal = deals.find(d => d.id === dealId);
    if (!deal) return;

    const currentStageIdx = STAGES.indexOf(deal.stage);
    let newStageIdx = currentStageIdx;

    if (direction === 'next' && currentStageIdx < STAGES.length - 1) {
      newStageIdx++;
    } else if (direction === 'prev' && currentStageIdx > 0) {
      newStageIdx--;
    }

    if (newStageIdx !== currentStageIdx) {
      const newStage = STAGES[newStageIdx];
      // Optimistic update for UI responsiveness
      const updatedDeals = deals.map(d => d.id === dealId ? { ...d, stage: newStage } : d);
      setDeals(updatedDeals);
      // Actual API call
      await api.updateDealStage(dealId, newStage);
    }
  };

  const getStageTotal = (stage) => {
    return deals
      .filter(d => d.stage === stage)
      .reduce((acc, curr) => acc + curr.value, 0)
      .toLocaleString();
  };

  if (loading) return <div className="p-12 text-center text-slate-500">Loading pipeline...</div>;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col p-6 overflow-hidden bg-slate-100">
      <div className="flex justify-between items-center mb-6 px-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Sales Pipeline</h2>
          <p className="text-slate-500 text-sm">Drag and drop deals to move them through the funnel.</p>
        </div>
        <button className="flex items-center gap-2 bg-primary hover:bg-blue-500 text-black px-4 py-2 rounded-lg font-medium shadow-md shadow-blue-500/20 transition-all">
          <Plus size={18} />
          New Deal
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 h-full kanban-scroll">
        {STAGES.map(stage => (
          <div key={stage} className="min-w-[300px] flex flex-col h-full bg-slate-200/50 rounded-xl border border-slate-200/60 p-3">
            <div className="flex justify-between items-center mb-3 px-1">
              <span className="font-semibold text-slate-700 text-sm uppercase tracking-wider">{stage}</span>
              <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-slate-500 border border-slate-200">
                {deals.filter(d => d.stage === stage).length}
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 kanban-scroll">
              {deals.filter(d => d.stage === stage).map(deal => (
                <div key={deal.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-slate-800 text-sm">{deal.title}</h4>
                    <button className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing">
                      <GripVertical size={16} />
                    </button>
                  </div>
                  <div className="text-xl font-bold text-slate-700 mb-3">
                    {deal.currency === 'INR' ? '₹' : '$'}{deal.value.toLocaleString()}
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-400 border-t border-slate-100 pt-3">
                    <span>{new Date(deal.expectedCloseDate).toLocaleDateString()}</span>
                    <div className="flex gap-1">
                        <button 
                            disabled={STAGES.indexOf(stage) === 0}
                            onClick={() => moveDeal(deal.id, 'prev')}
                            className="hover:bg-slate-100 p-1 rounded disabled:opacity-30 text-slate-600"
                        >
                            ←
                        </button>
                        <button 
                            disabled={STAGES.indexOf(stage) === STAGES.length - 1}
                            onClick={() => moveDeal(deal.id, 'next')}
                            className="hover:bg-slate-100 p-1 rounded disabled:opacity-30 text-slate-600"
                        >
                            →
                        </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 text-center text-xs font-semibold text-slate-500 border-t border-slate-300/20 pt-2">
               Total: {deals.filter(d => d.stage === stage)[0]?.currency === 'INR' ? '₹' : '$'}{getStageTotal(stage)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Pipeline;