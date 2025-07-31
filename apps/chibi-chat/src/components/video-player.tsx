'use client';

import { useChat } from '@/hooks/chat-sync';
import { parseMessage, printTimestamp, stringToColour } from '@/lib/messages';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useRef, useState } from 'react';
import YouTube, { YouTubePlayer } from 'react-youtube';

export function VideoPlayer() {
  const player = useRef<YouTubePlayer>(undefined);
  const [playerState, setPlayerState] = useState(0);
  const messages = useChat(playerState, player.current);

  return (
    <div className="flex h-full w-full">
      {/* Video Player */}
      <YouTube
        videoId="23iGjNbk2vo"
        className="flex-1"
        iframeClassName="h-full w-full"
        onReady={(event) => {
          player.current = event.target;
        }}
        onStateChange={(e) => {
          setPlayerState(e.data);
        }}
      />

      {/* Chat Window */}
      <div className="text-[13px] leading-5 text-[#dedee3] border-l border-[#2f2f32] w-[340px] flex flex-col">
        {/* Title */}
        <div className="flex h-[50px] items-center justify-center bg-[#1f1f23] border-b border-white/[.1]">
          <span>Chibi Chat</span>
        </div>
        {/* Messages */}
        <div
          className={cn(
            'h-full bg-[#18181b] flex flex-1 flex-col-reverse overflow-auto',
            '[&::-webkit-scrollbar]:w-[0.6rem]',
            '[&::-webkit-scrollbar-thumb]:bg-[#323239]',
            '[&::-webkit-scrollbar-thumb]:border-2',
            '[&::-webkit-scrollbar-thumb]:rounded-[10px]',
            '[&::-webkit-scrollbar-thumb]:border-[#1f1f23]',
          )}
        >
          <ul className="flex flex-wrap">
            {messages.map((message) => (
              // Individual Messages
              <li className="w-full" key={message.index}>
                <div className="flex px-[5px] py-[2.5px] items-baseline break-words">
                  <p className="px-[5px] mr-[5px] text-[#dedee3] align-middle">
                    {printTimestamp(message.offsetMilli)}
                  </p>
                  <div className="inline min-w-0">
                    <span
                      className="font-bold"
                      style={{ color: stringToColour(message.from) }}
                    >
                      {message.from}
                    </span>
                    <span className="pr-[5px]">:</span>
                    <span>
                      {parseMessage(message.message).map((chunk, index) => {
                        if (chunk.kind === 'emote') {
                          return (
                            <div
                              key={index}
                              className="inline items-center align-middle -my-0.5"
                            >
                              <Image
                                width={28}
                                height={28}
                                src={chunk.emoteUrl}
                                alt={chunk.emote}
                              />
                            </div>
                          );
                        } else {
                          return chunk.message;
                        }
                      })}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
