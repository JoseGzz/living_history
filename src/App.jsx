import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, Info, BookOpen, ExternalLink, ArrowLeft, ArrowRight, ArrowUp, Moon, Sun, Clock } from 'lucide-react';

const DATA_URL = 'https://pub-d607727348954e568a4fb203bfcf4031.r2.dev/timeline_events.json';

// --- CSS STYLES ---
const globalStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
  .app-wrapper {
      --bg-color: #f8fafc;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --primary: #4f46e5;
      --primary-light: #e0e7ff;
      --card-bg: #ffffff;
      --border: #e2e8f0;
      background-color: var(--bg-color);
      color: var(--text-main);
      min-height: 100vh;
      transition: background-color 0.3s, color 0.3s;
      padding-bottom: 3rem;
  }
  .app-wrapper.dark {
      --bg-color: #0f172a;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #818cf8;
      --primary-light: #1e293b;
      --card-bg: #1e293b;
      --border: #334155;
  }
  
  button { background: none; border: none; cursor: pointer; font-family: inherit; }
  
  /* Header */
  .app-header { background: var(--card-bg); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 10; }
  .header-content { max-width: 56rem; margin: 0 auto; padding: 1rem; display: flex; align-items: center; justify-content: space-between; }
  .header-left { display: flex; align-items: center; gap: 0.75rem; }
  .logo-icon { width: 2rem; height: 2rem; background: var(--primary); border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; }
  .header-title { font-size: 1.25rem; font-weight: 700; color: var(--text-main); }
  .theme-toggle { padding: 0.5rem; border-radius: 50%; color: var(--text-muted); transition: background 0.2s; }
  .theme-toggle:hover { background: var(--border); }
  
  /* Topic Nav (Centered) */
  .topic-nav-wrapper { max-width: 56rem; margin: 0 auto; }
  .topic-nav { display: flex; justify-content: center; gap: 0.75rem; padding: 1rem; overflow-x: auto; scrollbar-width: none; }
  .topic-nav::-webkit-scrollbar { display: none; }
  .topic-pill { padding: 0.5rem 1.25rem; border-radius: 999px; font-weight: 700; font-size: 0.875rem; white-space: nowrap; transition: all 0.2s; background: var(--border); color: var(--text-muted); }
  .topic-pill.active { background: var(--text-main); color: var(--bg-color); }
  .topic-pill:not(.active):hover { background: var(--card-bg); color: var(--text-main); border: 1px solid var(--border); }
  
  /* Main Content */
  .app-main { max-width: 56rem; margin: 2rem auto 0; padding: 0 1rem; }
  .situations-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; }
  .situations-indicator { width: 0.375rem; height: 1.5rem; background: var(--primary); border-radius: 999px; }
  .situations-title { font-size: 1.25rem; font-weight: 700; color: var(--text-main); }
  
  /* Situation Timeline */
  .situations-timeline { display: flex; flex-direction: column; width: 100%; }
  .situation-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 1rem; padding: 1.5rem; text-align: left; display: flex; flex-direction: column; transition: all 0.2s; width: 100%; }
  .situation-card:hover { border-color: var(--primary); transform: translateY(-2px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
  .situation-card:active { transform: scale(0.98); }
  .situation-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
  .situation-name { font-size: 1.25rem; font-weight: 700; color: var(--text-main); line-height: 1.2; padding-right: 1rem; }
  .situation-icon { background: var(--primary-light); color: var(--primary); padding: 0.5rem; border-radius: 999px; }
  .situation-footer { margin-top: auto; padding-top: 1rem; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
  .situation-meta { display: flex; flex-direction: column; gap: 0.25rem; }
  .situation-events-count { font-size: 0.875rem; font-weight: 500; color: var(--text-muted); }
  .situation-action { color: var(--primary); font-size: 0.875rem; font-weight: 700; display: flex; align-items: center; gap: 0.25rem; }
  
  .timeline-arrow-container { display: flex; flex-direction: column; align-items: center; height: 3.5rem; position: relative; }
  .timeline-arrow-head { margin-bottom: -6px; color: var(--primary); z-index: 1; opacity: 0.9; }
  .timeline-arrow-line { width: 3px; flex: 1; background: var(--primary); opacity: 0.3; border-radius: 999px; }
  .timeline-gap { height: 1.5rem; }
  
  /* Story Viewer */
  .story-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); display: flex; justify-content: center; align-items: center; z-index: 50; backdrop-filter: blur(4px); }
  .story-container { width: 100%; height: 100%; max-width: 28rem; background: linear-gradient(to bottom right, #0f172a, #020617); position: relative; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
  @media (min-width: 640px) { .story-container { height: 90vh; border-radius: 1.5rem; } }
  .story-progress { position: absolute; top: 0; left: 0; right: 0; z-index: 30; display: flex; gap: 0.25rem; padding: 1.25rem 1rem 0; background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent); pointer-events: none; }
  .progress-bar { height: 0.25rem; flex: 1; background: rgba(255,255,255,0.3); border-radius: 999px; overflow: hidden; }
  .progress-fill { height: 100%; background: #fff; transition: width 0.3s; }
  
  .story-header { position: absolute; top: 2rem; left: 0; right: 0; z-index: 30; display: flex; justify-content: space-between; align-items: flex-start; padding: 0 1rem; color: #fff; pointer-events: none; }
  .story-topic { font-size: 0.625rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #a5b4fc; margin-bottom: 0.125rem; }
  .story-situation { font-size: 1.125rem; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
  .story-close { background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); color: white; padding: 0.5rem; border-radius: 999px; transition: background 0.2s; pointer-events: auto; }
  .story-close:hover { background: rgba(0,0,0,0.6); }
  
  .story-click-left { position: absolute; top: 0; bottom: 0; left: 0; width: 33.333%; z-index: 10; cursor: pointer; }
  .story-click-right { position: absolute; top: 0; bottom: 0; right: 0; width: 66.666%; z-index: 10; cursor: pointer; }
  
  .story-content-wrapper { flex: 1; display: flex; flex-direction: column; position: relative; width: 100%; height: 100%; z-index: 20; pointer-events: none; }
  .story-event-content { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 0 1.5rem; position: relative; z-index: 10; }
  .story-date { display: inline-flex; align-items: center; background: rgba(99, 102, 241, 0.2); color: #a5b4fc; padding: 0.375rem 0.75rem; border-radius: 999px; font-size: 0.875rem; font-weight: 600; width: max-content; border: 1px solid rgba(99, 102, 241, 0.3); margin-bottom: 1.5rem; backdrop-filter: blur(4px); }
  .story-summary { font-size: 2rem; font-weight: 700; color: #fff; line-height: 1.2; text-shadow: 0 2px 10px rgba(0,0,0,0.3); }
  @media (min-width: 640px) { .story-summary { font-size: 2.25rem; } }
  
  .story-footer { padding: 1.5rem; z-index: 30; background: linear-gradient(to top, rgba(0,0,0,1), rgba(0,0,0,0.8), transparent); padding-top: 3rem; pointer-events: none; }
  .dive-deeper-btn { width: 100%; background: #fff; color: #0f172a; padding: 1rem; border-radius: 1rem; font-weight: 700; font-size: 1.125rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5); transition: transform 0.1s; pointer-events: auto; }
  .dive-deeper-btn:active { transform: scale(0.98); }
  
  /* Jump Cards */
  .jump-card { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 2rem; z-index: 10; position: relative; color: #fff; }
  .jump-icon { margin: 0 auto 1rem; color: #818cf8; opacity: 0.8; }
  .jump-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; }
  .jump-subtitle { font-size: 0.875rem; color: #cbd5e1; margin-bottom: 2rem; }
  .jump-buttons-container { display: flex; flex-direction: column; gap: 0.75rem; width: 100%; max-width: 20rem; margin: 0 auto; }
  .jump-button { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); backdrop-filter: blur(12px); padding: 1rem; border-radius: 1rem; color: white; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s, transform 0.2s; pointer-events: auto; }
  .jump-button:hover { background: rgba(255,255,255,0.15); }
  .jump-button-next { background: rgba(79, 70, 229, 0.8); border: 1px solid rgba(129, 140, 248, 0.5); }
  .jump-button-next:hover { background: rgba(79, 70, 229, 1); }
  .jump-text { font-weight: 600; text-align: left; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .jump-arrow { opacity: 0.7; transition: opacity 0.2s, transform 0.2s; }
  .jump-button:hover .jump-arrow { opacity: 1; }
  
  /* Dive Deeper Modal */
  .dive-deeper-modal { position: absolute; bottom: 0; left: 0; right: 0; background: var(--bg-color); z-index: 40; border-radius: 1.5rem 1.5rem 0 0; height: 85%; display: flex; flex-direction: column; box-shadow: 0 -10px 40px rgba(0,0,0,0.5); transform: translateY(100%); transition: transform 0.3s ease-out; }
  .dive-deeper-modal.open { transform: translateY(0); }
  .modal-handle-area { display: flex; justify-content: center; padding: 0.75rem; cursor: pointer; }
  .modal-handle { width: 3rem; height: 0.375rem; background: var(--border); border-radius: 999px; }
  .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 0 1.5rem 1rem; border-bottom: 1px solid var(--border); }
  .modal-title { font-weight: 700; font-size: 1.25rem; color: var(--text-main); display: flex; align-items: center; gap: 0.5rem; }
  .modal-close { padding: 0.5rem; background: var(--border); color: var(--text-main); border-radius: 999px; transition: background 0.2s; }
  .modal-close:hover { background: var(--card-bg); }
  .modal-body { padding: 1.5rem; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 2rem; }
  .modal-text { color: var(--text-main); font-size: 1.125rem; line-height: 1.6; white-space: pre-wrap; }
  
  /* Sources Styling inside Modal */
  .sources-section { border-top: 1px solid var(--border); padding-top: 1.5rem; }
  .sources-title { font-size: 1rem; font-weight: 700; color: var(--text-main); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em; }
  .sources-list { display: flex; flex-direction: column; gap: 0.75rem; }
  .source-link { display: flex; align-items: center; gap: 0.75rem; background: var(--card-bg); border: 1px solid var(--border); padding: 0.75rem 1rem; border-radius: 0.5rem; text-decoration: none; color: var(--text-main); font-size: 0.875rem; word-break: break-all; transition: border-color 0.2s, background 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
  .source-link:hover { border-color: var(--primary); background: var(--primary-light); }
  .source-favicon { width: 1.5rem; height: 1.5rem; border-radius: 0.25rem; object-fit: contain; }
  .source-domain { font-weight: 600; text-transform: lowercase; }
`;

// --- UTILS ---
// Robust parser to handle stringified Python lists like "['url1'\n 'url2']"
const parseSources = (sourcesStr) => {
  if (!sourcesStr) return [];
  if (Array.isArray(sourcesStr)) return sourcesStr;
  if (typeof sourcesStr === 'string') {
    if (sourcesStr === '[]') return [];
    try {
      // Try standard JSON parse first (replacing single quotes with double)
      return JSON.parse(sourcesStr.replace(/'/g, '"'));
    } catch (e) {
      // Fallback: extract anything inside single quotes
      const matches = sourcesStr.match(/'([^']+)'/g);
      if (matches) {
        return matches.map(m => m.replace(/'/g, ''));
      }
    }
  }
  return [];
};

const getDomain = (url) => {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace('www.', '');
  } catch (e) {
    return url;
  }
};

export default function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(true);

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
    const priority = ['Politics', 'Technology', 'Economy'];
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
    const uniqueSituationNames = [...new Set(filtered.map(item => item.situation_name))];
    const validSituations = new Set(data.map(d => d.situation_name));

    const enrichedSituations = uniqueSituationNames.map(name => {
      const evts = filtered.filter(i => i.situation_name === name);
      const item = evts[0];
      
      let prevSits = new Set();
      let nextSits = new Set();
      evts.forEach(e => {
        if (e.previous_situation && e.previous_situation !== name && validSituations.has(e.previous_situation)) {
          prevSits.add(e.previous_situation);
        }
        if (e.next_situation && e.next_situation !== name && validSituations.has(e.next_situation)) {
          nextSits.add(e.next_situation);
        }
      });

      return { 
        id: item.situation_id, 
        name: name,
        eventCount: evts.length,
        prevSituations: Array.from(prevSits),
        nextSituations: Array.from(nextSits),
        latestDate: new Date(Math.max(...evts.map(e => new Date(e.event_date))))
      };
    });

    return enrichedSituations.sort((a, b) => b.latestDate - a.latestDate);
  }, [selectedTopic, data]);

  // Handlers
  const handleOpenSituation = useCallback((situationName, jumpType = 'default') => {
    const rawEvents = data
      .filter(item => item.situation_name === situationName)
      .sort((a, b) => new Date(a.event_date) - new Date(b.event_date)); 
    
    const validSituations = new Set(data.map(d => d.situation_name));
    const prevSituations = new Set();
    const nextSituations = new Set();

    rawEvents.forEach(e => {
        if (e.previous_situation && e.previous_situation !== situationName && validSituations.has(e.previous_situation)) {
            prevSituations.add(e.previous_situation);
        }
        if (e.next_situation && e.next_situation !== situationName && validSituations.has(e.next_situation)) {
            nextSituations.add(e.next_situation);
        }
    });

    const builtEvents = [];
    
    if (prevSituations.size > 0) {
        builtEvents.push({ type: 'prev_card', targets: Array.from(prevSituations) });
    }

    rawEvents.forEach(e => builtEvents.push({ type: 'event', data: e }));

    if (nextSituations.size > 0) {
        builtEvents.push({ type: 'next_card', targets: Array.from(nextSituations) });
    }

    setStoryEvents(builtEvents);
    setSelectedSituation(situationName);
    setIsDiveDeeperOpen(false);

    let startIndex = 0;
    if (jumpType === 'next') {
        startIndex = builtEvents.findIndex(e => e.type === 'event');
    } else {
        let lastEventIdx = builtEvents.length - 1;
        while (lastEventIdx >= 0 && builtEvents[lastEventIdx].type !== 'event') lastEventIdx--;
        startIndex = Math.max(0, lastEventIdx);
    }
    setCurrentEventIndex(startIndex);

  }, [data]);

  const handleJumpToSituation = useCallback((targetSituationName, jumpType) => {
    const targetItem = data.find(d => d.situation_name === targetSituationName);
    if (targetItem) {
        setSelectedTopic(targetItem.topic_name);
        handleOpenSituation(targetSituationName, jumpType);
    }
  }, [data, handleOpenSituation]);

  const closeStory = () => {
    setSelectedSituation(null);
    setStoryEvents([]);
    setIsDiveDeeperOpen(false);
  };

  const handleNextStory = useCallback(() => {
    if (isDiveDeeperOpen) return;
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
    } else {
      closeStory();
    }
  }, [currentEventIndex, isDiveDeeperOpen]);

  // Keyboard Navigation
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
      <div className={`app-wrapper ${isDarkMode ? 'dark' : ''}`}>
        <style dangerouslySetInnerHTML={{__html: globalStyles}} />
        <div className="center-message">
          <X size={48} style={{color: '#ef4444', marginBottom: '1rem'}} />
          <h2 style={{fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem'}}>Failed to load timeline</h2>
          <p style={{color: 'var(--text-muted)'}}>{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`app-wrapper ${isDarkMode ? 'dark' : ''}`}>
        <style dangerouslySetInnerHTML={{__html: globalStyles}} />
        <div className="center-message" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div className="spinner"></div>
          <p style={{color: 'var(--text-muted)', fontWeight: '500'}}>Loading Timeline Data...</p>
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          .spinner { border: 3px solid rgba(0,0,0,0.1); border-top-color: var(--primary); border-radius: 50%; width: 2rem; height: 2rem; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
          .dark .spinner { border: 3px solid rgba(255,255,255,0.1); border-top-color: var(--primary); }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}} />
      </div>
    );
  }

  // --- STORY VIEW RENDERER ---
  const renderStoryContent = () => {
    const currentItem = storyEvents[currentEventIndex];
    if (!currentItem) return null;

    if (currentItem.type === 'prev_card') {
      return (
        <div className="jump-card">
            <Clock size={48} className="jump-icon" />
            <h2 className="jump-title">Leading up to this...</h2>
            <p className="jump-subtitle">Explore previous connected situations.</p>
            <div className="jump-buttons-container">
                {currentItem.targets.map(target => (
                    <button key={target} onClick={(e) => { e.stopPropagation(); handleJumpToSituation(target, 'prev'); }} className="jump-button">
                        <span className="jump-text">{target}</span>
                        <ArrowLeft size={20} className="jump-arrow" />
                    </button>
                ))}
            </div>
        </div>
      );
    }

    if (currentItem.type === 'next_card') {
      return (
        <div className="jump-card">
            <ArrowRight size={48} className="jump-icon" />
            <h2 className="jump-title">The story continues</h2>
            <p className="jump-subtitle">Follow the fallout in these unfolding timelines.</p>
            <div className="jump-buttons-container">
                {currentItem.targets.map(target => (
                    <button key={target} onClick={(e) => { e.stopPropagation(); handleJumpToSituation(target, 'next'); }} className="jump-button jump-button-next">
                        <span className="jump-text">{target}</span>
                        <ChevronRight size={20} className="jump-arrow" />
                    </button>
                ))}
            </div>
        </div>
      );
    }

    // Normal Event Card
    const currentEvent = currentItem.data;
    return (
      <>
        <div className="story-event-content">
           <div className="story-date">
             {new Date(currentEvent.event_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
           </div>
           
           <h1 className="story-summary">
             {currentEvent.summary}
           </h1>
        </div>

        <div className="story-footer">
          <button onClick={(e) => { e.stopPropagation(); setIsDiveDeeperOpen(true); }} className="dive-deeper-btn">
            <BookOpen size={20} /> Dive Deeper
          </button>
        </div>
      </>
    );
  };

  return (
    <div className={`app-wrapper ${isDarkMode ? 'dark' : ''}`}>
      {/* Embedded Vanilla CSS */}
      <style dangerouslySetInnerHTML={{__html: globalStyles}} />

      {/* App Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo-icon">N</div>
            <h1 className="header-title">Living History</h1>
          </div>
          <button className="theme-toggle" onClick={() => setIsDarkMode(!isDarkMode)}>
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
        
        {/* Horizontal Topic Navigation (Centered) */}
        <div className="topic-nav-wrapper">
          <div className="topic-nav">
            {topics.map(topic => (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                className={`topic-pill ${selectedTopic === topic ? 'active' : ''}`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        {selectedTopic && (
          <div style={{ maxWidth: '40rem', margin: '0 auto' }}>
            <div className="situations-header">
              <div className="situations-indicator" />
              <h3 className="situations-title">{selectedTopic}</h3>
            </div>
            
            <div className="situations-timeline">
              {situationsForTopic.map((situation, index) => {
                const olderSituation = situationsForTopic[index + 1];
                let isConnected = false;
                
                if (olderSituation) {
                  // Connect visually if they have a sequential relationship
                  if (situation.prevSituations.includes(olderSituation.name) || olderSituation.nextSituations.includes(situation.name)) {
                    isConnected = true;
                  }
                }

                return (
                  <React.Fragment key={situation.id}>
                    <button
                      onClick={() => handleOpenSituation(situation.name, 'default')}
                      className="situation-card"
                    >
                      <div className="situation-header">
                        <h3 className="situation-name">{situation.name}</h3>
                        <div className="situation-icon"><BookOpen size={18} /></div>
                      </div>
                      
                      <div className="situation-footer">
                        <div className="situation-meta">
                          <span className="situation-events-count">{situation.eventCount} Events</span>
                        </div>
                        <span className="situation-action">
                          Read <ChevronRight size={16} />
                        </span>
                      </div>
                    </button>
                    
                    {/* Render upward-pointing arrow from the older card to this newer card */}
                    {olderSituation && (
                      isConnected ? (
                        <div className="timeline-arrow-container">
                          <ArrowUp size={24} className="timeline-arrow-head" />
                          <div className="timeline-arrow-line"></div>
                        </div>
                      ) : (
                        <div className="timeline-gap"></div>
                      )
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Story View Modal */}
      {selectedSituation && storyEvents.length > 0 && (
        <div className="story-overlay">
          <div className="story-container">
            
            {/* Progress Bars */}
            <div className="story-progress">
              {storyEvents.map((_, idx) => (
                <div key={idx} className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: idx <= currentEventIndex ? '100%' : '0%' }}
                  />
                </div>
              ))}
            </div>

            {/* Story Header */}
            <div className="story-header">
              <div>
                <p className="story-topic">{selectedTopic}</p>
                <h2 className="story-situation">{selectedSituation}</h2>
              </div>
              <button onClick={closeStory} className="story-close">
                <X size={20} />
              </button>
            </div>

            {/* Click Handlers */}
            <div className="story-click-left" onClick={handlePrevStory} />
            <div className="story-click-right" onClick={handleNextStory} />

            {/* Dynamic Content */}
            <div className="story-content-wrapper">
               {renderStoryContent()}
            </div>

            {/* Dive Deeper Bottom Sheet Modal */}
            <div className={`dive-deeper-modal ${isDiveDeeperOpen ? 'open' : ''}`}>
              <div className="modal-handle-area" onClick={() => setIsDiveDeeperOpen(false)}>
                <div className="modal-handle" />
              </div>
              
              <div className="modal-header">
                <h3 className="modal-title">
                  <Info size={24} style={{color: "var(--primary)"}} />
                  Detailed Context
                </h3>
                <button onClick={() => setIsDiveDeeperOpen(false)} className="modal-close">
                  <X size={20} />
                </button>
              </div>
              
              <div className="modal-body">
                {storyEvents[currentEventIndex] && storyEvents[currentEventIndex].type === 'event' && (
                  <>
                    <p className="modal-text">
                      {storyEvents[currentEventIndex].data.detailed_context}
                    </p>
                    
                    {/* Sources Section moved to Dive Deeper */}
                    <div className="sources-section">
                      <h4 className="sources-title">External Sources</h4>
                      {parseSources(storyEvents[currentEventIndex].data.sources).length > 0 ? (
                        <div className="sources-list">
                          {parseSources(storyEvents[currentEventIndex].data.sources).map((src, i) => (
                             <a key={i} href={src} target="_blank" rel="noopener noreferrer" className="source-link" title={src}>
                               <img src={`https://www.google.com/s2/favicons?domain=${getDomain(src)}&sz=64`} alt="" className="source-favicon" />
                               <span className="source-domain">{getDomain(src)}</span>
                             </a>
                          ))}
                        </div>
                      ) : (
                        <p style={{color: 'var(--text-muted)', fontSize: '0.875rem'}}>No external sources available.</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}