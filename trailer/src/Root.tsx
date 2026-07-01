import { Composition } from 'remotion';
import { Trailer, TRAILER_FPS, TRAILER_DURATION } from './Trailer';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Trailer"
      component={Trailer}
      durationInFrames={TRAILER_DURATION}
      fps={TRAILER_FPS}
      width={1920}
      height={1080}
    />
  );
};
