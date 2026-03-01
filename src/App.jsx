import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, Info, BookOpen, ExternalLink, ArrowLeft } from 'lucide-react';

// Replace this with your actual public Cloudflare R2 URL
const DATA_URL = 'https://pub-d607727348954e568a4fb203bfcf4031.r2.dev/timeline_events.json';

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
      .sort((a, b) => new Date(a.event_date) - new Date(b.event_date)); 
    
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
    }
  }, [currentEventIndex, isDiveDeeperOpen]);

  // Listen for keyboard arrows
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
      <div className="center-screen">
        <div className="error-icon"><X size={48} /></div>
        <h2 className="error-title">Failed to load timeline</h2>
        <p className="error-text">{error}</p>
        <p className="error-hint">Ensure your daily Databricks export job is running and the DATA_URL is correct.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="center-screen">
        <p style={{ color: "var(--text-muted)", fontWeight: "500" }}>Loading Timeline Data...</p>
      </div>
    );
  }

  // --- STORY VIEW (Instagram-style Timeline) ---
  if (selectedSituation && storyEvents.length > 0) {
    const currentEvent = storyEvents[currentEventIndex];
    
    return (
      <div className="story-overlay">
        <div className="story-container">
          
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

          <div className="story-header">
            <div>
              <p className="story-topic">{selectedTopic}</p>
              <h2 className="story-situation">{selectedSituation}</h2>
            </div>
            <button onClick={closeStory} className="story-close">
              <X size={20} />
            </button>
          </div>

          <div className="story-click-left" onClick={handlePrevStory} />
          <div className="story-click-right" onClick={handleNextStory} />

          <div className="story-content">
             <div className="story-date">
               {new Date(currentEvent.event_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
             </div>
             
             <h1 className="story-summary">
               {currentEvent.summary}
             </h1>

             <div className="story-sources">
               <span className="sources-label">Sources:</span>
               {(Array.isArray(currentEvent.sources) ? currentEvent.sources : []).map((source, i) => (
                 <span key={i} className="source-tag">
                   <ExternalLink size={10} />
                   {source}
                 </span>
               ))}
             </div>
          </div>

          <div className="story-footer">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsDiveDeeperOpen(true);
              }}
              className="dive-deeper-btn"
            >
              <BookOpen size={20} />
              Dive Deeper
            </button>
          </div>

          <div className={`dive-deeper-modal ${isDiveDeeperOpen ? 'open' : ''}`}>
            <div className="modal-handle"><div /></div>
            <div className="modal-header">
              <h3 className="modal-title">
                <Info size={24} style={{ color: "var(--primary)" }} />
                Detailed Context
              </h3>
              <button onClick={() => setIsDiveDeeperOpen(false)} className="modal-close">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p>{currentEvent.detailed_context}</p>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // --- MAIN VIEW (Topics & Situations) ---
  return (
    <div>
      <header className="app-header">
        <div className="header-content">
          <div className="logo-icon">N</div>
          <h1 className="header-title">News Timeline</h1>
        </div>
      </header>

      <main className="app-main">
        
        <div className="section-header">
          <h2 className="section-title">What's happening?</h2>
          <p className="section-subtitle">Select a topic to explore unfolding situations.</p>
        </div>
        
        <div className="topic-grid">
          {topics.map(topic => {
            const isActive = selectedTopic === topic;
            return (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                className={`topic-card ${isActive ? 'active' : ''}`}
              >
                <div className="topic-indicator" />
                <h3 className="topic-name">{topic}</h3>
                <p className="topic-count">
                  {data.filter(d => d.topic_name === topic).reduce((acc, curr) => acc.includes(curr.situation_name) ? acc : [...acc, curr.situation_name], []).length} Active Situations
                </p>
              </button>
            );
          })}
        </div>

        {selectedTopic && (
          <div>
            <h3 className="situations-title">
              Active Situations in {selectedTopic}
            </h3>
            <div className="situation-grid">
              {situationsForTopic.map(situation => (
                <button
                  key={situation.id}
                  onClick={() => handleOpenSituation(situation.name)}
                  className="situation-card"
                >
                  <div className="situation-header">
                    <h3 className="situation-name">{situation.name}</h3>
                    <div className="situation-icon"><BookOpen size={18} /></div>
                  </div>
                  <div className="situation-footer">
                    <span className="situation-events-count">
                      {data.filter(d => d.situation_name === situation.name).length} Timeline Events
                    </span>
                    <span className="situation-action">
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