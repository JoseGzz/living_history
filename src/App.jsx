import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, Info, BookOpen, ExternalLink, ArrowLeft, ArrowRight, ArrowUp, Moon, Sun, Clock } from 'lucide-react';
import './index.css';

const DATA_URL = '[https://pub-d607727348954e568a4fb203bfcf4031.r2.dev/timeline_events.json](https://pub-d607727348954e568a4fb203bfcf4031.r2.dev/timeline_events.json)';

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
        <div className="center-message" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
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
        <div className="center-message" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div className="spinner"></div>
          <p style={{color: 'var(--text-muted)', fontWeight: '500'}}>Loading Timeline Data...</p>
        </div>
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
                    
                    {/* Sources Section */}
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