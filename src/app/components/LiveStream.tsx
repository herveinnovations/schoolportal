import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { ArrowLeft, Video, VideoOff, Mic, MicOff, Monitor, Users, Send, Grid3x3, Maximize2, Hand, HelpCircle, CheckCircle2 } from 'lucide-react';
import type { LiveClass } from '@/app/context/AuthContext';
import { toast } from 'sonner';

interface LiveStreamProps {
  classInfo: LiveClass;
  onBack: () => void;
  isLecturer: boolean;
}

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
  isQuestion?: boolean;
}

interface Participant {
  id: string;
  name: string;
  isVideoOn: boolean;
  isAudioOn: boolean;
  isHandRaised?: boolean;
}

export const LiveStream: React.FC<LiveStreamProps> = ({ classInfo, onBack, isLecturer }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'speaker' | 'gallery'>('speaker');
  const [activeSidebar, setActiveSidebar] = useState<'chat' | 'participants' | 'qa'>('chat');
  const [handRaised, setHandRaised] = useState(false);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', sender: classInfo.lecturerName, message: 'Welcome to the live class! Feel free to ask questions.', timestamp: new Date().toLocaleTimeString() },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([
    { id: '1', name: classInfo.lecturerName, isVideoOn: true, isAudioOn: true },
  ]);

  const requestCameraAccess = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('Browser API not supported');
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(console.warn);
      }
    } catch (error) {
      console.warn('Media access error:', error);
      setCameraError('Could not access camera/microphone. Please check permissions.');
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
        setScreenStream(null);
      }
      setIsScreenSharing(false);
    } else {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenStream(displayStream);
        setIsScreenSharing(true);
        displayStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          setScreenStream(null);
        };
      } catch (err) {
        console.error("Error sharing screen:", err);
        toast.error("Failed to share screen");
      }
    }
  };

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (screenStream) screenStream.getTracks().forEach(track => track.stop());
    };
  }, []);

  useEffect(() => {
    if (stream && videoRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.warn);
    }
    if (screenStream && screenRef.current && !screenRef.current.srcObject) {
      screenRef.current.srcObject = screenStream;
      screenRef.current.play().catch(console.warn);
    }
  }, [stream, screenStream, viewMode]);

  const toggleVideo = () => {
    const t = stream?.getVideoTracks()[0];
    if (t) { t.enabled = !t.enabled; setIsVideoOn(t.enabled); }
  };

  const toggleAudio = () => {
    const t = stream?.getAudioTracks()[0];
    if (t) { t.enabled = !t.enabled; setIsAudioOn(t.enabled); }
  };

  const toggleHandRaise = () => {
    setHandRaised(!handRaised);
    toast.success(handRaised ? "Hand lowered" : "Hand raised");
    if (!isLecturer) {
      setParticipants(prev => prev.map(p => p.name === 'You' ? { ...p, isHandRaised: !handRaised } : p));
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    setChatMessages([...chatMessages, {
      id: Date.now().toString(),
      sender: isLecturer ? classInfo.lecturerName : 'You',
      message: newMessage,
      timestamp: new Date().toLocaleTimeString(),
      isQuestion: activeSidebar === 'qa'
    }]);
    setNewMessage('');
  };

  const takeAttendance = () => {
    toast.success(`Attendance captured: ${participants.length} participants present`);
  };

  const renderParticipantVideo = (participant: Participant, isMainVideo: boolean = false) => {
    const isCurrentUser = (isLecturer && participant.id === '1') || (!isLecturer && participant.name === 'You');
    const showVideo = isCurrentUser ? isVideoOn : participant.isVideoOn;

    return (
      <div key={participant.id}
        className={`relative bg-stone-900 rounded-lg overflow-hidden border border-stone-800 ${isMainVideo ? 'w-full h-full' : 'aspect-video'} ${participant.isHandRaised ? 'ring-2 ring-yellow-400' : ''}`}>
        {isCurrentUser && showVideo ? (
          <video ref={isMainVideo && !isScreenSharing ? videoRef : undefined} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
        ) : showVideo ? (
          <div className="w-full h-full bg-gradient-to-br from-emerald-700 to-amber-700 flex items-center justify-center">
            <div className="text-white font-bold text-lg">{participant.name}</div>
          </div>
        ) : (
          <div className="w-full h-full bg-stone-800 flex items-center justify-center">
            <div className="text-center text-white">
              <VideoOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <div className="text-sm">{participant.name}</div>
            </div>
          </div>
        )}

        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
          <div className="bg-black/70 px-2 py-1 rounded text-white text-xs font-medium flex items-center gap-1">
            {participant.name} {isCurrentUser && '(You)'}
            {participant.isAudioOn ? <Mic className="w-3 h-3 text-green-400" /> : <MicOff className="w-3 h-3 text-red-400" />}
          </div>
        </div>

        {participant.isHandRaised && (
          <div className="absolute top-2 right-2 bg-yellow-400 text-black p-1 rounded-full animate-bounce">
            <Hand className="w-4 h-4" />
          </div>
        )}

        {isMainVideo && (
          <div className="absolute top-4 left-4">
            <Badge className="bg-red-600 text-white animate-pulse">LIVE</Badge>
          </div>
        )}
      </div>
    );
  };

  const tabCls = (k: string) => `flex-1 py-3 text-sm font-medium ${activeSidebar === k ? 'text-emerald-700 border-b-2 border-emerald-700' : 'text-stone-500 hover:text-stone-700'}`;

  return (
    <div className="min-h-screen bg-stone-900 relative flex flex-col h-screen overflow-hidden">
      <header className="bg-stone-800/80 backdrop-blur-md border-b border-stone-700 z-50">
        <div className="max-w-full mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button onClick={onBack} variant="outline" size="sm" className="bg-stone-700 border-stone-600 text-white hover:bg-stone-600">
                <ArrowLeft className="w-4 h-4 mr-2" /> Leave
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-white">{classInfo.courseName}</h1>
                  <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
                </div>
                <p className="text-sm text-stone-400">Hosted by {classInfo.lecturerName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isLecturer && (
                <Button onClick={takeAttendance} variant="outline" size="sm" className="bg-green-700 border-green-600 text-white hover:bg-green-600">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Attendance
                </Button>
              )}
              <div className="h-8 w-[1px] bg-stone-600 mx-2"></div>
              <Button variant={activeSidebar === 'participants' ? "secondary" : "ghost"} size="sm"
                onClick={() => setActiveSidebar(activeSidebar === 'participants' ? 'chat' : 'participants')} className="text-white">
                <Users className="w-4 h-4 mr-2" />
                <span className="hidden md:inline">Participants ({participants.length})</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 bg-black/50 p-4 flex flex-col gap-4 overflow-y-auto">
          <div className="flex-1 min-h-0 bg-black rounded-xl overflow-hidden relative border border-stone-800 shadow-2xl">
            {!stream && !isScreenSharing && (
              <div className="absolute inset-0 flex items-center justify-center bg-stone-900 z-10">
                <Card className="max-w-md mx-4 bg-stone-800 border-stone-700 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Video className="w-6 h-6 text-emerald-600" /> Join Class
                    </CardTitle>
                    <CardDescription className="text-stone-400">
                      Please enable your camera and microphone to join the session.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button onClick={requestCameraAccess} className="w-full bg-emerald-700 hover:bg-emerald-800" size="lg">
                      Enable Camera & Microphone
                    </Button>
                    {cameraError && <p className="text-sm text-red-400">{cameraError}</p>}
                  </CardContent>
                </Card>
              </div>
            )}

            {isScreenSharing ? (
              <div className="w-full h-full bg-stone-900 flex items-center justify-center relative">
                <video ref={screenRef} autoPlay className="w-full h-full object-contain" />
                <div className="absolute top-4 right-4 bg-emerald-700 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                  You are sharing your screen
                </div>
              </div>
            ) : viewMode === 'speaker' ? (
              renderParticipantVideo(participants[0], true)
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 h-full auto-rows-fr">
                {participants.map(p => renderParticipantVideo(p))}
              </div>
            )}
          </div>

          {viewMode === 'speaker' && (
            <div className="h-32 flex gap-3 overflow-x-auto pb-2 px-2">
              {participants.slice(1).map(p => (
                <div key={p.id} className="flex-shrink-0 w-48 h-full">{renderParticipantVideo(p)}</div>
              ))}
            </div>
          )}
        </div>

        <div className="w-80 bg-white border-l border-stone-200 flex flex-col shadow-xl z-20">
          <div className="flex border-b">
            <button className={tabCls('chat')} onClick={() => setActiveSidebar('chat')}>Chat</button>
            <button className={tabCls('qa')} onClick={() => setActiveSidebar('qa')}>Q&A</button>
            <button className={tabCls('participants')} onClick={() => setActiveSidebar('participants')}>People</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-stone-50">
            {activeSidebar === 'chat' && (
              <div className="space-y-4">
                {chatMessages.filter(m => !m.isQuestion).map(msg => (
                  <div key={msg.id} className="flex flex-col gap-1">
                    <div className="flex items-baseline justify-between">
                      <span className="font-semibold text-sm">{msg.sender}</span>
                      <span className="text-xs text-stone-400">{msg.timestamp}</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border shadow-sm text-sm">{msg.message}</div>
                  </div>
                ))}
              </div>
            )}

            {activeSidebar === 'qa' && (
              <div className="space-y-4">
                <div className="text-center p-4 bg-emerald-50 rounded-lg border border-emerald-100 mb-4">
                  <HelpCircle className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
                  <p className="text-sm text-emerald-900">Post your questions here. The lecturer can mark them as answered.</p>
                </div>
                {chatMessages.filter(m => m.isQuestion).map(msg => (
                  <div key={msg.id} className="flex flex-col gap-1">
                    <div className="flex items-baseline justify-between">
                      <span className="font-semibold text-sm text-amber-800">{msg.sender}</span>
                      <span className="text-xs text-stone-400">{msg.timestamp}</span>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 text-sm">
                      <span className="font-bold text-xs text-amber-600 block mb-1">QUESTION</span>
                      {msg.message}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSidebar === 'participants' && (
              <div className="space-y-2">
                {participants.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2 hover:bg-white rounded-lg transition">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-xs font-bold">{p.name.charAt(0)}</div>
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <div className="flex gap-1">
                          {!p.isVideoOn && <VideoOff className="w-3 h-3 text-stone-400" />}
                          {!p.isAudioOn && <MicOff className="w-3 h-3 text-red-400" />}
                        </div>
                      </div>
                    </div>
                    {p.isHandRaised && <Hand className="w-4 h-4 text-yellow-500" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {(activeSidebar === 'chat' || activeSidebar === 'qa') && (
            <div className="p-4 bg-white border-t">
              <div className="flex gap-2">
                <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={activeSidebar === 'qa' ? "Ask a question..." : "Type a message..."} className="flex-1" />
                <Button onClick={handleSendMessage} size="icon"><Send className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-stone-800 border-t border-stone-700 py-4 px-6 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button size="lg" variant={isAudioOn ? 'secondary' : 'destructive'} onClick={toggleAudio} className="rounded-full w-12 h-12 p-0" title="Toggle Mic">
              {isAudioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </Button>
            <Button size="lg" variant={isVideoOn ? 'secondary' : 'destructive'} onClick={toggleVideo} className="rounded-full w-12 h-12 p-0" title="Toggle Camera">
              {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </Button>
          </div>

          <div className="flex items-center gap-4">
            {isLecturer && (
              <Button variant={isScreenSharing ? "destructive" : "secondary"} onClick={toggleScreenShare} className="flex flex-col gap-1 h-auto py-2 px-4">
                <Monitor className="w-5 h-5" />
                <span className="text-xs">{isScreenSharing ? 'Stop Share' : 'Share Screen'}</span>
              </Button>
            )}
            <Button variant={handRaised ? "default" : "secondary"} onClick={toggleHandRaise}
              className={`flex flex-col gap-1 h-auto py-2 px-4 ${handRaised ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : ''}`}>
              <Hand className="w-5 h-5" />
              <span className="text-xs">{handRaised ? 'Lower Hand' : 'Raise Hand'}</span>
            </Button>
            <Button variant="secondary" onClick={() => setViewMode(viewMode === 'speaker' ? 'gallery' : 'speaker')} className="flex flex-col gap-1 h-auto py-2 px-4">
              {viewMode === 'speaker' ? <Grid3x3 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              <span className="text-xs">{viewMode === 'speaker' ? 'Gallery' : 'Speaker'}</span>
            </Button>
          </div>

          <Button size="lg" variant="destructive" onClick={onBack} className="rounded-full px-8">End</Button>
        </div>
      </div>
    </div>
  );
};
