'use client';

import { useChat } from '@/hooks/chat-sync';
import { parseMessage, printTimestamp, stringToColour } from '@/lib/messages';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useRef, useState } from 'react';
import YouTube, { type YouTubePlayer } from 'react-youtube';

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
      <div className="flex w-[340px] flex-col border-l border-[#2f2f32] text-[13px] leading-5 text-[#dedee3]">
        {/* Title */}
        <div className="flex h-[50px] items-center justify-center border-b border-white/[.1] bg-[#1f1f23]">
          <span>Chibi Chat</span>
        </div>
        {/* Messages */}
        <div
          className={cn(
            'flex h-full flex-1 flex-col-reverse overflow-auto bg-[#18181b]',
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
                <div className="flex items-baseline break-words px-[5px] py-[2.5px]">
                  <p className="mr-[5px] px-[5px] align-middle text-[#dedee3]">
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
                              className="-my-0.5 inline items-center align-middle"
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
