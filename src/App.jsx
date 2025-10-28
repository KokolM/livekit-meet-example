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

const serverUrl = 'https://livekit.heyme.uk';

// Login Dialog Component
function LoginDialog({ isOpen, onSubmit }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [livekitToken, setLivekitToken] = useState('');
  const [authMode, setAuthMode] = useState('credentials'); // 'credentials' or 'token'
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (authMode === 'token') {
      // Direct LiveKit token authentication
      if (!livekitToken.trim()) {
        setError('Please enter a LiveKit token');
        return;
      }
      
      setError('');
      onSubmit(livekitToken.trim());
      return;
    }
    
    // Email/Password authentication (existing logic)
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Step 1: Login to get access token
      const loginResponse = await fetch('https://server.heyme.uk/api/ui/v1/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });

      if (!loginResponse.ok) {
        throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
      }

      const loginData = await loginResponse.json();
      const accessToken = loginData.data.access_token;

      if (!accessToken) {
        throw new Error('No access token received from login');
      }

      // Step 2: Get LiveKit token using access token
      const meetResponse = await fetch('https://server.heyme.uk/api/ui/v1/meetings/public', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!meetResponse.ok) {
        throw new Error(`Failed to get LiveKit token: ${meetResponse.status} ${meetResponse.statusText}`);
      }

      const meetData = await meetResponse.json();
      
      if (!meetData.success || !meetData.data) {
        throw new Error('Failed to get LiveKit token from response');
      }

      // Success! Pass the LiveKit token to the parent component
      onSubmit(meetData.data);

    } catch (err) {
      console.error('Authentication error:', err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
        maxWidth: '400px'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '1.5rem', textAlign: 'center' }}>Login to HeyMe</h2>
        
        {/* Authentication Mode Toggle */}
        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', backgroundColor: '#f5f5f5', borderRadius: '6px', padding: '4px' }}>
            <button
              type="button"
              onClick={() => setAuthMode('credentials')}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                backgroundColor: authMode === 'credentials' ? '#007bff' : 'transparent',
                color: authMode === 'credentials' ? 'white' : '#666',
                transition: 'all 0.2s'
              }}
            >
              Email & Password
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('token')}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                backgroundColor: authMode === 'token' ? '#007bff' : 'transparent',
                color: authMode === 'token' ? 'white' : '#666',
                transition: 'all 0.2s'
              }}
            >
              LiveKit Token
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {authMode === 'credentials' ? (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Email:
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  autoFocus
                  disabled={isLoading}
                />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Password:
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  disabled={isLoading}
                />
              </div>
            </>
          ) : (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                LiveKit Token:
              </label>
              <textarea
                value={livekitToken}
                onChange={(e) => setLivekitToken(e.target.value)}
                placeholder="Paste your LiveKit token here..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  resize: 'vertical',
                  minHeight: '100px',
                  fontFamily: 'monospace',
                  boxSizing: 'border-box'
                }}
                autoFocus
                disabled={isLoading}
              />
              <div style={{ fontSize: '12px', color: '#666', marginTop: '0.5rem' }}>
                Enter a valid LiveKit access token to connect directly to the room.
              </div>
            </div>
          )}
          
          {error && (
            <div style={{ 
              color: 'red', 
              marginBottom: '1rem', 
              fontSize: '14px',
              padding: '0.5rem',
              backgroundColor: '#ffebee',
              border: '1px solid #ffcdd2',
              borderRadius: '4px'
            }}>
              {error}
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                backgroundColor: isLoading ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {isLoading 
                ? 'Connecting...' 
                : authMode === 'token' 
                  ? 'Connect with Token' 
                  : 'Login & Connect'
              }
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
  
  const [livekitToken, setLivekitToken] = useState('');
  const [showLoginDialog, setShowLoginDialog] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  const handleLoginSuccess = (token) => {
    setLivekitToken(token);
    setShowLoginDialog(false);
  };

  // Connect to room when LiveKit token is provided
  useEffect(() => {
    if (!livekitToken) return;
    
    let mounted = true;
    
    const connect = async () => {
      try {
        if (mounted) {
          await room.connect(serverUrl, livekitToken);
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Failed to connect to room:', error);
        // Show login dialog again if connection fails
        setShowLoginDialog(true);
        setLivekitToken('');
      }
    };
    
    connect();

    return () => {
      mounted = false;
      room.disconnect();
      setIsConnected(false);
    };
  }, [room, livekitToken]);

  return (
    <>
      <LoginDialog 
        isOpen={showLoginDialog} 
        onSubmit={handleLoginSuccess} 
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