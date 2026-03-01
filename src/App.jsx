import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, Info, BookOpen, ExternalLink, ArrowLeft } from 'lucide-react';

// URL where your Databricks job will save the daily JSON file
// Replace this with your public Cloudflare R2 or S3 Bucket URL
const DATA_URL = 'https://pub-d607727348954e568a4fb203bfcf4031.r2.dev';


export default function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Navigation State
  const [selectedTopic, setSelectedTopic] = useState('Politics');
  const [selectedSituation, setSelectedSituation] = useState(null);
  
  // Story State
  const [storyEvents, setStoryEvents] = useState([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isDiveDeeperOpen, setIsDiveDeeperOpen] = useState(false);

  // Load Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error('Failed to fetch timeline data');
        const jsonData = await response.json();
        setData(jsonData);
      } catch (err) {
        console.error("Error loading data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Derived Data
  const topics = useMemo(() => {
    const uniqueTopics = [...new Set(data.map(item => item.topic_name))];
    // Ensure we prioritize Politics, Technology, Economics if they exist
    const priority = ['Politics', 'Technology', 'Economics'];
    return uniqueTopics.sort((a, b) => {
      const indexA = priority.indexOf(a);
      const indexB = priority.indexOf(b);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [data]);

  const situationsForTopic = useMemo(() => {
    if (!selectedTopic) return [];
    const filtered = data.filter(item => item.topic_name === selectedTopic);
    const uniqueSituations = [...new Set(filtered.map(item => item.situation_name))];
    return uniqueSituations.map(name => {
      const item = filtered.find(i => i.situation_name === name);
      return { id: item.situation_id, name: item.situation_name };
    });
  }, [selectedTopic, data]);

  // Handlers
  const handleOpenSituation = (situationName) => {
    const events = data
      .filter(item => item.situation_name === situationName)
      .sort((a, b) => new Date(a.event_date) - new Date(b.event_date)); // Sort left to right by timestamp
    
    setStoryEvents(events);
    setSelectedSituation(situationName);
    setCurrentEventIndex(0);
    setIsDiveDeeperOpen(false);
  };

  const closeStory = () => {
    setSelectedSituation(null);
    setStoryEvents([]);
    setIsDiveDeeperOpen(false);
  };

  const handleNextStory = useCallback(() => {
    if (isDiveDeeperOpen) return; // Don't turn page if modal is open
    if (currentEventIndex < storyEvents.length - 1) {
      setCurrentEventIndex(prev => prev + 1);
    } else {
      closeStory();
    }
  }, [currentEventIndex, storyEvents.length, isDiveDeeperOpen]);

  const handlePrevStory = useCallback(() => {
    if (isDiveDeeperOpen) return;
    if (currentEventIndex > 0) {
      setCurrentEventIndex(prev => prev - 1);
    }
  }, [currentEventIndex, isDiveDeeperOpen]);

  // Listen for keyboard arrows for desktop users
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedSituation || isDiveDeeperOpen) return;
      if (e.key === 'ArrowRight') handleNextStory();
      if (e.key === 'ArrowLeft') handlePrevStory();
      if (e.key === 'Escape') closeStory();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSituation, handleNextStory, handlePrevStory, isDiveDeeperOpen]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="text-red-500 mb-2"><X size={48} className="mx-auto" /></div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Failed to load timeline</h2>
        <p className="text-slate-500">{error}</p>
        <p className="text-sm text-slate-400 mt-4">Ensure your daily Databricks export job is running and the DATA_URL is correct.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-medium">
        Loading Timeline Data...
      </div>
    );
  }

  // --- STORY VIEW (Instagram-style Timeline) ---
  if (selectedSituation && storyEvents.length > 0) {
    const currentEvent = storyEvents[currentEventIndex];
    
    return (
      <div className="fixed inset-0 bg-black flex justify-center items-center overflow-hidden z-50 font-sans">
        {/* Mobile-sized container for desktop to maintain IG-story aspect ratio */}
        <div className="w-full h-full max-w-md bg-slate-900 relative flex flex-col shadow-2xl">
          
          {/* Progress Bars */}
          <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-3 pt-4 bg-gradient-to-b from-black/80 to-transparent">
            {storyEvents.map((_, idx) => (
              <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-white transition-all duration-300 ${
                    idx < currentEventIndex ? 'w-full' : 
                    idx === currentEventIndex ? 'w-full' : 'w-0' // In a real app with auto-advance, this would animate 0->100%
                  }`}
                />
              </div>
            ))}
          </div>

          {/* Header Controls */}
          <div className="absolute top-8 left-0 right-0 z-20 flex justify-between items-center px-4 text-white">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">{selectedTopic}</p>
              <h2 className="text-lg font-bold drop-shadow-md">{selectedSituation}</h2>
            </div>
            <button 
              onClick={closeStory}
              className="p-2 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Click Zones for Navigation */}
          <div className="absolute inset-y-0 left-0 w-1/3 z-10 cursor-pointer" onClick={handlePrevStory} />
          <div className="absolute inset-y-0 right-0 w-2/3 z-10 cursor-pointer" onClick={handleNextStory} />

          {/* Main Card Content */}
          <div className="flex-1 flex flex-col justify-center px-6 relative z-0">
             {/* Subtle date pill */}
             <div className="mb-4 inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-full text-sm font-medium w-max border border-indigo-500/30">
               {new Date(currentEvent.event_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
             </div>
             
             <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
               {currentEvent.summary}
             </h1>

             {/* Sources list */}
             <div className="mt-8 flex flex-wrap gap-2">
               <span className="text-xs font-medium text-slate-400 uppercase tracking-widest mr-2 flex items-center">Sources:</span>
               {currentEvent.sources.map((source, i) => (
                 <span key={i} className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700 flex items-center gap-1">
                   <ExternalLink size={10} />
                   {source}
                 </span>
               ))}
             </div>
          </div>

          {/* Dive Deeper Button Area */}
          <div className="p-6 pb-8 z-20 bg-gradient-to-t from-black via-black/80 to-transparent">
            <button 
              onClick={(e) => {
                e.stopPropagation(); // Prevent next-story click
                setIsDiveDeeperOpen(true);
              }}
              className="w-full bg-white text-black py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-slate-200 active:scale-95 transition-all shadow-lg"
            >
              <BookOpen size={20} />
              Dive Deeper
            </button>
          </div>

          {/* Dive Deeper Bottom Sheet / Modal */}
          <div 
            className={`absolute inset-x-0 bottom-0 bg-slate-50 z-30 rounded-t-3xl transition-transform duration-300 ease-out flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] ${
              isDiveDeeperOpen ? 'translate-y-0 h-[85%]' : 'translate-y-full h-[85%]'
            }`}
          >
            <div className="flex justify-center p-3">
              <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
            </div>
            <div className="flex justify-between items-center px-6 pb-4 border-b border-slate-200">
              <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                <Info size={24} className="text-indigo-600" />
                Detailed Context
              </h3>
              <button 
                onClick={() => setIsDiveDeeperOpen(false)}
                className="p-2 bg-slate-200 rounded-full text-slate-700 hover:bg-slate-300 transition"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 text-slate-700 text-lg leading-relaxed">
              <p>{currentEvent.detailed_context}</p>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // --- MAIN VIEW (Topics & Situations) ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
            N
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            News Timeline
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-8">
        
        {/* LEVEL 1: TOPIC SELECTION */}
        <div className="space-y-6 mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">What's happening?</h2>
            <p className="text-slate-500">Select a topic to explore unfolding situations.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topics.map(topic => {
              const isActive = selectedTopic === topic;
              return (
                <button
                  key={topic}
                  onClick={() => setSelectedTopic(topic)}
                  className={`group relative bg-white border rounded-2xl p-6 transition-all duration-300 text-left overflow-hidden ${
                    isActive 
                      ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500 bg-indigo-50/50' 
                      : 'border-slate-200 hover:shadow-lg hover:border-indigo-300'
                  }`}
                >
                  <div className={`absolute right-0 top-0 bottom-0 w-2 transition-opacity ${isActive ? 'bg-indigo-600 opacity-100' : 'bg-indigo-400 opacity-0 group-hover:opacity-100'}`} />
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">{topic}</h3>
                  <p className="text-slate-500 text-sm">
                    {data.filter(d => d.topic_name === topic).reduce((acc, curr) => acc.includes(curr.situation_name) ? acc : [...acc, curr.situation_name], []).length} Active Situations
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* LEVEL 2: SITUATION SELECTION */}
        {selectedTopic && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-indigo-500 rounded-full inline-block"></span>
              Active Situations in {selectedTopic}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {situationsForTopic.map(situation => (
                <button
                  key={situation.id}
                  onClick={() => handleOpenSituation(situation.name)}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-400 flex flex-col text-left transition-all active:scale-[0.98]"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-slate-900 leading-tight">
                      {situation.name}
                    </h3>
                    <div className="bg-indigo-50 text-indigo-700 p-2 rounded-full">
                      <BookOpen size={18} />
                    </div>
                  </div>
                  <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center w-full">
                    <span className="text-sm font-medium text-slate-500">
                      {data.filter(d => d.situation_name === situation.name).length} Timeline Events
                    </span>
                    <span className="text-indigo-600 text-sm font-bold flex items-center gap-1">
                      View Story <ChevronRight size={16} />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}