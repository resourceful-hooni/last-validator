import './loadFonts';
import { Composition } from 'remotion';
import { Trailer, TRAILER_FPS, TRAILER_DURATION } from './Trailer';
import { Intro, INTRO_DURATION } from './Intro';
import { Timejump, TIMEJUMP_DURATION } from './Timejump';
import { Finale, FINALE_DURATION } from './Finale';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Trailer"
        component={Trailer}
        durationInFrames={TRAILER_DURATION}
        fps={TRAILER_FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Intro"
        component={Intro}
        durationInFrames={INTRO_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Timejump"
        component={Timejump}
        durationInFrames={TIMEJUMP_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Finale"
        component={Finale}
        durationInFrames={FINALE_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />
      {/* 모바일 세로(9:16) 변형 — 같은 컴포넌트가 방향에 맞춰 스케일 */}
      <Composition
        id="IntroMobile"
        component={Intro}
        durationInFrames={INTRO_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="FinaleMobile"
        component={Finale}
        durationInFrames={FINALE_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
