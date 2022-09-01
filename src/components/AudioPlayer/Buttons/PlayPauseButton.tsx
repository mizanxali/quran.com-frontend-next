import { useContext } from 'react';

import { useSelector } from '@xstate/react';
import useTranslation from 'next-translate/useTranslation';

import PauseIcon from '../../../../public/icons/pause.svg';
import PlayIcon from '../../../../public/icons/play-arrow.svg';
import SurahAudioMismatchModal from '../SurahAudioMismatchModal';

import Button, { ButtonShape, ButtonVariant } from 'src/components/dls/Button/Button';
import Spinner, { SpinnerSize } from 'src/components/dls/Spinner/Spinner';
import DataContext from 'src/contexts/DataContext';
import useChapterIdsByUrlPath from 'src/hooks/useChapterId';
import { getChapterData } from 'src/utils/chapter';
import { withStopPropagation } from 'src/utils/event';
import { logButtonClick } from 'src/utils/eventLogger';
import { selectIsLoading } from 'src/xstate/actors/audioPlayer/selectors';
import { AudioPlayerMachineContext } from 'src/xstate/AudioPlayerMachineContext';

const PlayPauseButton = () => {
  const { t, lang } = useTranslation('common');

  const audioService = useContext(AudioPlayerMachineContext);
  const chaptersData = useContext(DataContext);
  const currentAudioChapterId = useSelector(audioService, (state) => state.context.surah);

  const isMismatchModalVisible = useSelector(audioService, (state) =>
    state.matches('VISIBLE.SURAH_MISMATCH'),
  );

  const isPlaying = useSelector(audioService, (state) =>
    state.matches('VISIBLE.AUDIO_PLAYER_INITIATED.PLAYING'),
  );
  const isLoading = useSelector(audioService, selectIsLoading);

  let button;

  if (isLoading) {
    button = (
      <Button
        tooltip={`${t('loading')}...`}
        shape={ButtonShape.Circle}
        variant={ButtonVariant.Ghost}
        isDisabled={isLoading}
      >
        <Spinner size={SpinnerSize.Large} />
      </Button>
    );
  } else if (isPlaying) {
    button = (
      <Button
        tooltip={t('audio.player.pause')}
        shape={ButtonShape.Circle}
        variant={ButtonVariant.Ghost}
        onClick={withStopPropagation(() => {
          logButtonClick('audio_player_pause');
          audioService.send('TOGGLE');
        })}
      >
        <PauseIcon />
      </Button>
    );
  } else if (!isPlaying) {
    button = (
      <Button
        tooltip={t('audio.player.play')}
        shape={ButtonShape.Circle}
        variant={ButtonVariant.Ghost}
        onClick={withStopPropagation(() => {
          logButtonClick('audio_player_play');
          audioService.send('TOGGLE');
        })}
        shouldFlipOnRTL={false}
      >
        <PlayIcon />
      </Button>
    );
  }

  const currentReadingChapterIds = useChapterIdsByUrlPath(lang);

  const [firstCurrentReadingChapterId] = currentReadingChapterIds; // get the first chapter in this page

  const onStartOverClicked = () => {
    audioService.send({ type: 'CONFIRM_PLAY_MISMATCHED_SURAH' });
  };

  const onContinueClicked = () => {
    audioService.send({ type: 'CANCEL_PLAY_MISMATCHED_SURAH' });
  };

  return (
    <>
      {button}
      {!isLoading && (
        <SurahAudioMismatchModal
          isOpen={isMismatchModalVisible}
          currentAudioChapter={
            getChapterData(chaptersData, currentAudioChapterId.toString())?.transliteratedName
          }
          currentReadingChapter={
            getChapterData(chaptersData, firstCurrentReadingChapterId)?.transliteratedName
          }
          onContinue={onContinueClicked}
          onStartOver={onStartOverClicked}
        />
      )}
    </>
  );
};

export default PlayPauseButton;
