import { Tech } from '@/lib/skills';
import Image from 'next/image';

export function SkillBubble({ tech }: { tech: Tech }) {
  return (
    <div
      className="rounded-base bg-background box-shadow border-border relative flex h-28 w-28 flex-col items-stretch border p-2 text-center"
      key={tech.name}
    >
      {tech.name}
      <div className="relative flex flex-1 justify-center">
        <Image
          className="object-contain p-2"
          fill
          src={tech.src}
          alt={`${tech.name} logo`}
        />
      </div>
    </div>
  );
}
