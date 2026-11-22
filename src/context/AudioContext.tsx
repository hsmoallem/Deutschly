"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AudioContextType {
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
  user: any;
  setUser: (user: any) => void;
}

const AudioContext = createContext<AudioContextType>({
  playbackSpeed: 1.0,
  setPlaybackSpeed: () => {},
  user: null,
  setUser: () => {},
});

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          if (data.user.settings?.playbackSpeed) {
            setPlaybackSpeed(data.user.settings.playbackSpeed);
          }
        }
      })
      .catch((err) => console.error("Session check error:", err));
  }, []);

  return (
    <AudioContext.Provider
      value={{
        playbackSpeed,
        setPlaybackSpeed,
        user,
        setUser,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  return useContext(AudioContext);
}
