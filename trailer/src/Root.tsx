import { Composition } from 'remotion';
import { Trailer, TRAILER_FPS, TRAILER_DURATION } from './Trailer';
import { Intro, INTRO_DURATION } from './Intro';
import { Timejump, TIMEJUMP_DURATION } from './Timejump';

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
    </>
  );
};
