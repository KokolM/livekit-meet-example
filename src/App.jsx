import {
  ControlBar,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
  RoomContext,
} from '@livekit/components-react';
import { Room, Track } from 'livekit-client';
import '@livekit/components-styles';
import { useState, useEffect } from 'react';

const serverUrl = 'https://livekit.matejkokol.eu';

// Token Input Dialog Component
function TokenDialog({ isOpen, onSubmit }) {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('Please enter a valid token');
      return;
    }
    setError('');
    onSubmit(token.trim());
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '90%',
        maxWidth: '500px'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Enter LiveKit Token</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Token:
            </label>
            <textarea
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste your LiveKit token here..."
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '12px',
                resize: 'vertical'
              }}
              autoFocus
            />
          </div>
          {error && (
            <div style={{ color: 'red', marginBottom: '1rem', fontSize: '14px' }}>
              {error}
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Connect
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [room] = useState(() => new Room({
    // Optimize video quality for each participant's screen
    adaptiveStream: true,
    // Enable automatic audio/video quality optimization
    dynacast: true,
  }));
  
  const [userToken, setUserToken] = useState('');
  const [showTokenDialog, setShowTokenDialog] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  const handleTokenSubmit = (token) => {
    setUserToken(token);
    setShowTokenDialog(false);
  };

  // Connect to room when token is provided
  useEffect(() => {
    if (!userToken) return;
    
    let mounted = true;
    
    const connect = async () => {
      try {
        if (mounted) {
          await room.connect(serverUrl, userToken);
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Failed to connect to room:', error);
        // Show token dialog again if connection fails
        setShowTokenDialog(true);
        setUserToken('');
      }
    };
    
    connect();

    return () => {
      mounted = false;
      room.disconnect();
      setIsConnected(false);
    };
  }, [room, userToken]);

  return (
    <>
      <TokenDialog 
        isOpen={showTokenDialog} 
        onSubmit={handleTokenSubmit} 
      />
      
      {isConnected && (
        <RoomContext.Provider value={room}>
          <div data-lk-theme="default" style={{ height: '100vh' }}>
            {/* Your custom component with basic video conferencing functionality. */}
            <MyVideoConference />
            {/* The RoomAudioRenderer takes care of room-wide audio for you. */}
            <RoomAudioRenderer />
            {/* Controls for the user to start/stop audio, video, and screen share tracks */}
            <ControlBar />
          </div>
        </RoomContext.Provider>
      )}
    </>
  );
}

function MyVideoConference() {
  // `useTracks` returns all camera and screen share tracks. If a user
  // joins without a published camera track, a placeholder track is returned.
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );
  return (
    <GridLayout tracks={tracks} style={{ height: 'calc(100vh - var(--lk-control-bar-height))' }}>
      {/* The GridLayout accepts zero or one child. The child is used
      as a template to render all passed in tracks. */}
      <ParticipantTile />
    </GridLayout>
  );
}